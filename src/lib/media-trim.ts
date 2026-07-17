"use client";

// In-browser media trimming (and video -> audio-only extraction) with zero
// new dependencies: no ffmpeg.wasm, no server round-trip. It works by
// playing the source off-screen between `start` and `end`, capturing its
// video track (if any) via HTMLMediaElement.captureStream() and its audio
// track *silently* via the Web Audio API (MediaElementSource -> a
// MediaStreamDestination that is never connected to the speakers), then
// re-encoding that combined stream with MediaRecorder. The user never hears
// the clip playing back while it's being processed.
//
// Browser support: captureStream() is solid on Chrome/Edge/Firefox but
// still inconsistent on Safari, so callers should check isTrimSupported()
// first and show a clear fallback message when it returns false.

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
  | "PLAYBACK_FAILED";

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
 * user-gesture context (a click handler) since it opens an AudioContext.
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

    const el = document.createElement(
      sourceKind === "video" ? "video" : "audio"
    ) as CaptureStreamElement;
    el.src = sourceUrl;
    el.crossOrigin = "anonymous";
    el.preload = "auto";
    el.style.position = "fixed";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.width = "1px";
    el.style.height = "1px";
    document.body.appendChild(el);

    let audioCtx: AudioContext | null = null;
    let settled = false;

    const cleanup = () => {
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
        let rawStream: MediaStream;
        try {
          rawStream = captureStreamOf(el);
        } catch {
          fail(new TrimError("CAPTURE_FAILED"));
          return;
        }

        const outputIsVideo = sourceKind === "video" && !audioOnly;
        let finalStream: MediaStream;

        try {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (!AudioCtx) throw new Error("no AudioContext");
          audioCtx = new AudioCtx();
          const source = audioCtx.createMediaElementSource(el);
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);
          // Deliberately not connecting to audioCtx.destination — this is
          // what keeps the trim silent instead of blasting through speakers.
          const audioTracks = dest.stream.getAudioTracks();
          const videoTracks = outputIsVideo ? rawStream.getVideoTracks() : [];
          finalStream = new MediaStream([...videoTracks, ...audioTracks]);
        } catch {
          // Fall back to the raw captured stream (audible during processing)
          // if silent routing via Web Audio isn't available for some reason.
          finalStream = outputIsVideo
            ? rawStream
            : new MediaStream(rawStream.getAudioTracks());
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

        const onTimeUpdate = () => {
          if (el.currentTime >= clampedEnd || el.ended) {
            el.removeEventListener("timeupdate", onTimeUpdate);
            if (recorder.state !== "inactive") recorder.stop();
          }
        };
        el.addEventListener("timeupdate", onTimeUpdate);

        recorder.start();
        el.play().catch(() => {
          el.removeEventListener("timeupdate", onTimeUpdate);
          if (recorder.state !== "inactive") recorder.stop();
          fail(new TrimError("PLAYBACK_FAILED"));
        });
      };
    };
  });
}
