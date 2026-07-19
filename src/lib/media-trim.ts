"use client";

// In-browser media trimming (and video -> audio-only extraction) with zero
// new dependencies: no ffmpeg.wasm, no server round-trip.
//
// Two fundamentally different strategies are used, picked by output kind:
//
//  - Audio output (source is audio, or "extract audio only" from a video)
//    goes through `AudioContext.decodeAudioData()`, which decodes the
//    *entire* clip in one shot — not in real time, just as fast as the CPU
//    can decode it (typically well under a second, even for a multi-minute
//    source). The requested [start, end] range is sliced directly out of
//    the decoded PCM samples and written out as a WAV file by hand (a WAV
//    header is ~20 lines of DataView writes — no encoder library needed).
//    This is the fast path and covers the overwhelming majority of trims
//    in a quiz app built around music questions and audio answers.
//
//  - Video output (the picture is kept) still has to go through realtime
//    playback + `HTMLMediaElement.captureStream()` + `MediaRecorder`. This
//    is a hard limitation of what the browser exposes without a bundled
//    demuxer/encoder (WebCodecs alone isn't enough — turning a raw video
//    frame stream back into a valid file needs a muxer, and correctly
//    reading an arbitrary uploaded MP4/WebM's frames out of order needs a
//    demuxer; both are substantial third-party libraries this project
//    doesn't have network access to fetch and can't safely hand-roll
//    without being able to test video files locally). Speeding up capture
//    by raising `playbackRate` was considered and rejected: MediaRecorder
//    timestamps frames by real wall-clock arrival, so a faster
//    `playbackRate` bakes a permanently sped-up tempo into the output
//    instead of just processing quicker — not a shortcut, a different
//    (wrong) result. So this path stays real-time; it already avoids any
//    wasted time before `start`, and uses a precise timer instead of
//    polling to stop exactly at `end`.

export interface TrimOptions {
  /** Start time, in seconds. */
  start: number;
  /** End time, in seconds. */
  end: number;
  /** If the source has a video track, drop it and keep only the audio. */
  audioOnly: boolean;
}

type CaptureStreamElement = HTMLMediaElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

function getAudioContextCtor(): typeof AudioContext | null {
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** Whether *any* trim path is available — audio (decodeAudioData) is the
 * common, far more broadly supported case, so this stays true as long as
 * that works even if the realtime video-capture path's prerequisites are
 * missing (that combination shows up as a per-attempt error instead, only
 * for the rarer "keep the video picture" case). */
export function isTrimSupported(): boolean {
  if (typeof window === "undefined") return false;
  return getAudioContextCtor() !== null;
}

function isVideoCaptureSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  const probe = document.createElement("video") as CaptureStreamElement;
  return typeof probe.captureStream === "function" || typeof probe.mozCaptureStream === "function";
}

function captureStreamOf(el: CaptureStreamElement): MediaStream {
  if (el.captureStream) return el.captureStream();
  if (el.mozCaptureStream) return el.mozCaptureStream();
  throw new Error("CAPTURE_UNSUPPORTED");
}

function pickMimeType(kind: "video" | "audio"): string {
  const candidates =
    kind === "video"
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      : ["audio/webm;codecs=opus", "audio/webm"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return kind === "video" ? "video/webm" : "audio/webm";
}

export type TrimErrorCode =
  | "TRIM_UNSUPPORTED"
  | "SOURCE_LOAD_FAILED"
  | "INVALID_RANGE"
  | "CAPTURE_FAILED"
  | "RECORDER_INIT_FAILED"
  | "RECORD_FAILED"
  | "PLAYBACK_FAILED"
  | "EMPTY_OUTPUT";

export class TrimError extends Error {
  code: TrimErrorCode;
  constructor(code: TrimErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

/** Writes a 16-bit PCM WAV file by hand from decoded channel data — the
 * whole "encoder" is just this header plus the interleaved samples, which
 * is what makes the fast audio path possible without any library. */
function encodeWav(channelData: Float32Array[], sampleRate: number): Blob {
  const numChannels = Math.max(channelData.length, 1);
  const numFrames = channelData[0]?.length ?? 0;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, 1, true); // format = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const clamped = Math.max(-1, Math.min(1, channelData[c][i] ?? 0));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/** The fast path: decode the whole source once (not in real time), slice
 * the requested range straight out of the resulting samples, done. */
async function trimAudioFast(sourceUrl: string, start: number, end: number): Promise<Blob> {
  const AudioCtx = getAudioContextCtor();
  if (!AudioCtx) throw new TrimError("TRIM_UNSUPPORTED");

  let arrayBuffer: ArrayBuffer;
  try {
    const res = await fetch(sourceUrl);
    arrayBuffer = await res.arrayBuffer();
  } catch {
    throw new TrimError("SOURCE_LOAD_FAILED");
  }

  const ctx = new AudioCtx();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  } catch {
    await ctx.close().catch(() => {});
    throw new TrimError("SOURCE_LOAD_FAILED");
  }
  await ctx.close().catch(() => {});

  const sampleRate = audioBuffer.sampleRate;
  const clampedEnd = Math.min(end, audioBuffer.duration);
  if (!(clampedEnd > start)) throw new TrimError("INVALID_RANGE");

  const startSample = Math.max(0, Math.floor(start * sampleRate));
  const endSample = Math.min(audioBuffer.length, Math.floor(clampedEnd * sampleRate));
  if (endSample <= startSample) throw new TrimError("INVALID_RANGE");

  const channelData: Float32Array[] = [];
  for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
    channelData.push(audioBuffer.getChannelData(c).subarray(startSample, endSample));
  }

  const blob = encodeWav(channelData, sampleRate);
  if (blob.size === 0) throw new TrimError("EMPTY_OUTPUT");
  return blob;
}

/** The realtime path — unavoidable for keeping the video picture, see the
 * file-level comment above for why. Only ever reached when the source is a
 * video and its picture is being kept (audio-only output, from either an
 * audio or video source, always takes the fast decode-and-slice path
 * instead). Plays the source off-screen between `start` and `end` and
 * re-encodes it with MediaRecorder. */
function trimVideoRealtime(sourceUrl: string, { start, end }: { start: number; end: number }): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!isVideoCaptureSupported()) {
      reject(new TrimError("TRIM_UNSUPPORTED"));
      return;
    }

    const el = document.createElement("video") as CaptureStreamElement;
    el.src = sourceUrl;
    el.preload = "auto";
    el.style.position = "fixed";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.width = "1px";
    el.style.height = "1px";
    document.body.appendChild(el);

    let stopTimer: ReturnType<typeof setTimeout> | null = null;
    let settled = false;

    const cleanup = () => {
      if (stopTimer) clearTimeout(stopTimer);
      el.pause();
      el.remove();
    };

    const fail = (err: TrimError) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const succeed = (blob: Blob) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (blob.size === 0) {
        reject(new TrimError("EMPTY_OUTPUT"));
        return;
      }
      resolve(blob);
    };

    el.onerror = () => fail(new TrimError("SOURCE_LOAD_FAILED"));

    el.onloadedmetadata = () => {
      const clampedEnd = Math.min(end, el.duration || end);
      if (!(clampedEnd > start)) {
        fail(new TrimError("INVALID_RANGE"));
        return;
      }
      el.currentTime = start;

      el.onseeked = () => {
        let finalStream: MediaStream;
        try {
          finalStream = captureStreamOf(el);
        } catch {
          fail(new TrimError("CAPTURE_FAILED"));
          return;
        }

        const mimeType = pickMimeType("video");
        const chunks: BlobPart[] = [];
        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(finalStream, { mimeType });
        } catch {
          fail(new TrimError("RECORDER_INIT_FAILED"));
          return;
        }

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onerror = () => fail(new TrimError("RECORD_FAILED"));
        recorder.onstop = () => succeed(new Blob(chunks, { type: mimeType }));

        const stop = () => {
          if (recorder.state !== "inactive") recorder.stop();
        };
        el.onended = stop;

        recorder.start();
        el.play()
          .then(() => {
            // A precise, deterministic stop instead of polling
            // `timeupdate` (which only fires a handful of times a second
            // and made the previous version overshoot the requested end).
            const durationMs = (clampedEnd - start) * 1000;
            stopTimer = setTimeout(stop, durationMs + 60);
          })
          .catch(() => {
            fail(new TrimError("PLAYBACK_FAILED"));
          });
      };
    };
  });
}

/**
 * Trims (and optionally strips the video from) a media blob, returning a
 * new Blob for the requested [start, end] range. Picks the fast
 * decode-and-slice path whenever the output is audio-only (the common
 * case), and only falls back to realtime capture when the video picture
 * itself needs to be kept.
 */
export function trimMedia(
  sourceUrl: string,
  sourceKind: "video" | "audio",
  { start, end, audioOnly }: TrimOptions
): Promise<Blob> {
  const outputIsVideo = sourceKind === "video" && !audioOnly;
  if (!outputIsVideo) {
    return trimAudioFast(sourceUrl, start, end);
  }
  return trimVideoRealtime(sourceUrl, { start, end });
}
