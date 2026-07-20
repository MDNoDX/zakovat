"use client";

// In-browser spatial cropping for images and video, mirroring media-trim.ts's
// zero-dependency approach.
//
//  - Image crop is a single synchronous canvas draw: decode once, draw the
//    selected pixel rectangle onto a canvas sized to match, done. No
//    realtime constraint at all -- effectively instant regardless of the
//    source image's resolution.
//
//  - Video crop has no such shortcut (same reasoning as media-trim.ts's
//    video path: no muxer/demuxer library available in this sandbox). It
//    plays the source off-screen, redraws only the cropped region of every
//    frame onto a canvas, captures *that* canvas as a video track, and
//    separately routes the original audio through a silent Web Audio graph
//    to recombine as the recorded clip's audio track -- since
//    canvas.captureStream() only ever produces video.

export interface CropRect {
  /** All four fields are 0-1, relative to the source media's full frame. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CropErrorCode =
  | "CROP_UNSUPPORTED"
  | "SOURCE_LOAD_FAILED"
  | "INVALID_RECT"
  | "CAPTURE_FAILED"
  | "RECORDER_INIT_FAILED"
  | "RECORD_FAILED"
  | "PLAYBACK_FAILED"
  | "EMPTY_OUTPUT";

export class CropError extends Error {
  code: CropErrorCode;
  constructor(code: CropErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

function getAudioContextCtor(): typeof AudioContext | null {
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function isVideoCaptureSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  const probe = document.createElement("canvas") as HTMLCanvasElement & { captureStream?: () => MediaStream };
  return typeof probe.captureStream === "function";
}

export function isCropSupported(): boolean {
  if (typeof window === "undefined") return false;
  return true; // image crop only needs <canvas>, always available
}

function pickVideoMimeType(): string {
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return "video/webm";
}

function validRect(rect: CropRect): boolean {
  return (
    rect.width > 0.01 &&
    rect.height > 0.01 &&
    rect.x >= -0.001 &&
    rect.y >= -0.001 &&
    rect.x + rect.width <= 1.001 &&
    rect.y + rect.height <= 1.001
  );
}

/** Fast path: decode once, draw the selected pixel rectangle, done. */
async function cropImage(sourceUrl: string, rect: CropRect): Promise<Blob> {
  if (!validRect(rect)) throw new CropError("INVALID_RECT");

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new CropError("SOURCE_LOAD_FAILED"));
    el.src = sourceUrl;
  });

  const sx = Math.round(rect.x * img.naturalWidth);
  const sy = Math.round(rect.y * img.naturalHeight);
  const sw = Math.max(1, Math.round(rect.width * img.naturalWidth));
  const sh = Math.max(1, Math.round(rect.height * img.naturalHeight));

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new CropError("CAPTURE_FAILED");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  // JPEG at high quality: crop sources here are effectively always photos
  // (movie frames, screenshots), so this keeps cropped copies from
  // ballooning IndexedDB storage the way a lossless PNG re-encode would.
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob || blob.size === 0) throw new CropError("EMPTY_OUTPUT");
  return blob;
}

/** The realtime path for video: redraw only the cropped region of every
 * frame onto an off-screen canvas, capture that canvas as the video track,
 * and separately pipe the original audio through a silent Web Audio graph
 * as the recording's audio track. Optionally also trims to [start, end] in
 * the same pass, so crop+trim is one export instead of two. */
function cropVideoRealtime(
  sourceUrl: string,
  rect: CropRect,
  range?: { start: number; end: number }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!isVideoCaptureSupported()) {
      reject(new CropError("CROP_UNSUPPORTED"));
      return;
    }
    if (!validRect(rect)) {
      reject(new CropError("INVALID_RECT"));
      return;
    }

    const el = document.createElement("video");
    el.src = sourceUrl;
    el.preload = "auto";
    el.muted = false;
    el.style.position = "fixed";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.width = "1px";
    el.style.height = "1px";
    document.body.appendChild(el);

    let audioCtx: AudioContext | null = null;
    let stopTimer: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;
    let settled = false;

    const cleanup = () => {
      if (stopTimer) clearTimeout(stopTimer);
      if (rafId !== null) cancelAnimationFrame(rafId);
      el.pause();
      el.remove();
      audioCtx?.close().catch(() => {});
    };

    const fail = (err: CropError) => {
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
        reject(new CropError("EMPTY_OUTPUT"));
        return;
      }
      resolve(blob);
    };

    el.onerror = () => fail(new CropError("SOURCE_LOAD_FAILED"));

    el.onloadedmetadata = () => {
      const start = range?.start ?? 0;
      const end = Math.min(range?.end ?? el.duration, el.duration || range?.end || 0);
      if (!(end > start)) {
        fail(new CropError("INVALID_RECT"));
        return;
      }
      el.currentTime = start;

      el.onseeked = () => {
        const sx = Math.round(rect.x * el.videoWidth);
        const sy = Math.round(rect.y * el.videoHeight);
        const sw = Math.max(2, Math.round(rect.width * el.videoWidth));
        const sh = Math.max(2, Math.round(rect.height * el.videoHeight));

        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d");
        const canvasWithCapture = canvas as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream };
        if (!ctx || !canvasWithCapture.captureStream) {
          fail(new CropError("CAPTURE_FAILED"));
          return;
        }

        let finalStream: MediaStream;
        try {
          const videoStream = canvasWithCapture.captureStream(30);
          const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()];
          const AudioCtx = getAudioContextCtor();
          if (AudioCtx) {
            try {
              audioCtx = new AudioCtx();
              const source = audioCtx.createMediaElementSource(el);
              const dest = audioCtx.createMediaStreamDestination();
              source.connect(dest);
              // Not connected to audioCtx.destination -- keeps this silent
              // instead of playing the source out loud during export.
              tracks.push(...dest.stream.getAudioTracks());
            } catch {
              // A video with no audio track (or a codec Web Audio won't
              // touch) still crops fine -- just silently, video-only.
            }
          }
          finalStream = new MediaStream(tracks);
        } catch {
          fail(new CropError("CAPTURE_FAILED"));
          return;
        }

        const mimeType = pickVideoMimeType();
        const chunks: BlobPart[] = [];
        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(finalStream, { mimeType });
        } catch {
          fail(new CropError("RECORDER_INIT_FAILED"));
          return;
        }

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onerror = () => fail(new CropError("RECORD_FAILED"));
        recorder.onstop = () => succeed(new Blob(chunks, { type: mimeType }));

        function drawFrame() {
          if (settled || !ctx) return;
          ctx.drawImage(el, sx, sy, sw, sh, 0, 0, sw, sh);
          rafId = requestAnimationFrame(drawFrame);
        }

        const stop = () => {
          if (recorder.state !== "inactive") recorder.stop();
        };
        el.onended = stop;

        recorder.start();
        drawFrame();
        el.play()
          .then(() => {
            const durationMs = (end - start) * 1000;
            stopTimer = setTimeout(stop, durationMs + 60);
          })
          .catch(() => fail(new CropError("PLAYBACK_FAILED")));
      };
    };
  });
}

/**
 * Crops a media blob to `rect` (a 0-1 relative rectangle), returning a new
 * Blob. Images take the fast synchronous canvas path; video takes the
 * realtime redraw-and-record path (optionally combined with a [start, end]
 * trim in the same export, so cropping a video doesn't require a separate
 * trim pass afterward).
 */
export async function cropMedia(
  sourceUrl: string,
  kind: "image" | "video",
  rect: CropRect,
  range?: { start: number; end: number }
): Promise<Blob> {
  if (kind === "image") return cropImage(sourceUrl, rect);
  return cropVideoRealtime(sourceUrl, rect, range);
}
