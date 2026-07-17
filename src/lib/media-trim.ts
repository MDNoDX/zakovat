"use client";

// In-browser media trimming (and video -> audio-only extraction) with zero
// new dependencies: no ffmpeg.wasm, no server round-trip. It plays the
// source off-screen between `start` and `end` and re-encodes it with
// MediaRecorder.
//
// Two separate capture paths are used on purpose, never mixed on the same
// element:
//  - Audio-only output (source is audio, or "extract audio only" from a
//    video) goes through the Web Audio API alone: MediaElementSource ->
//    MediaStreamDestination, which is never connected to speakers, so
//    processing is silent. This is the common case and the one worth
//    keeping silent.
//  - Video output (video kept) uses HTMLMediaElement.captureStream() alone,
//    which hands back synchronized video+audio tracks from one place.
//    Mixing this with a separate Web Audio graph on the very same element
//    was the source of unreliable output (audio tracks going silent or out
//    of sync) — so for this path the clip does play audibly while it's
//    being processed, which is an acceptable trade-off for a less common
//    case.
//
// The output length is controlled with a precise setTimeout instead of
// polling `timeupdate` (which only fires a few times a second and made the
// old version overshoot / cut off early).

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

export function isTrimSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  const probe = document.createElement("video") as CaptureStreamElement;
  return typeof probe.captureStream === "function" || typeof probe.mozCaptureStream === "function";
}

function getAudioContextCtor(): typeof AudioContext | null {
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
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

/**
 * Trims (and optionally strips the video from) a media blob, returning a
 * new Blob for the requested [start, end] range. Must be called from a
 * user-gesture context (a click handler), since the audio-only path opens
 * an AudioContext.
 */
export function trimMedia(
  sourceUrl: string,
  sourceKind: "video" | "audio",
  { start, end, audioOnly }: TrimOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!isTrimSupported()) {
      reject(new TrimError("TRIM_UNSUPPORTED"));
      return;
    }

    const outputIsVideo = sourceKind === "video" && !audioOnly;

    const el = document.createElement(
      sourceKind === "video" ? "video" : "audio"
    ) as CaptureStreamElement;
    el.src = sourceUrl;
    el.preload = "auto";
    el.style.position = "fixed";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.width = "1px";
    el.style.height = "1px";
    document.body.appendChild(el);

    let audioCtx: AudioContext | null = null;
    let stopTimer: ReturnType<typeof setTimeout> | null = null;
    let settled = false;

    const cleanup = () => {
      if (stopTimer) clearTimeout(stopTimer);
      el.pause();
      el.remove();
      audioCtx?.close().catch(() => {});
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

        if (outputIsVideo) {
          try {
            finalStream = captureStreamOf(el);
          } catch {
            fail(new TrimError("CAPTURE_FAILED"));
            return;
          }
        } else {
          const AudioCtx = getAudioContextCtor();
          if (!AudioCtx) {
            fail(new TrimError("CAPTURE_FAILED"));
            return;
          }
          try {
            audioCtx = new AudioCtx();
            const source = audioCtx.createMediaElementSource(el);
            const dest = audioCtx.createMediaStreamDestination();
            source.connect(dest);
            // Deliberately not connected to audioCtx.destination — this is
            // what keeps the trim silent instead of playing out loud.
            finalStream = dest.stream;
          } catch {
            fail(new TrimError("CAPTURE_FAILED"));
            return;
          }
        }

        const outputKind: "video" | "audio" = outputIsVideo ? "video" : "audio";
        const mimeType = pickMimeType(outputKind);
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
