"use client";

// Dependency-free waveform peak extraction: decodes an audio blob with the
// Web Audio API and downsamples it into a fixed number of peak-amplitude
// bins, ready to draw on a <canvas>. No wavesurfer.js / ffmpeg — just the
// browser's own decoder, consistent with the rest of this app's approach
// to avoiding new npm dependencies.

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** Resolves to peak amplitudes (0..1, normalized) across `bins` even segments of the clip. */
export async function computeWaveformPeaks(blob: Blob, bins = 96): Promise<number[]> {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return [];

  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new Ctor();
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerBin = Math.max(1, Math.floor(channelData.length / bins));
    const peaks: number[] = [];
    for (let i = 0; i < bins; i++) {
      const start = i * samplesPerBin;
      let max = 0;
      const end = Math.min(start + samplesPerBin, channelData.length);
      for (let j = start; j < end; j++) {
        const v = Math.abs(channelData[j]);
        if (v > max) max = v;
      }
      peaks.push(max);
    }
    const peakMax = Math.max(...peaks, 0.01);
    return peaks.map((p) => Math.max(0.04, p / peakMax));
  } finally {
    ctx.close().catch(() => {});
  }
}
