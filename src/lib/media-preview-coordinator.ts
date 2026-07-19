// Every inline media preview in the editor (Media Library thumbnails, the
// trim dialog's own player, etc.) is its own independent component with its
// own <audio>/<video> element — nothing coordinated which one is "the" one
// playing, so starting a second preview left the first one running
// underneath it. A single module-level pointer to whichever element is
// currently playing is enough to pause it the instant another one starts.
// No React state/context needed: this is a one-way "stop that" signal, not
// something any component needs to re-render off of.
let currentlyPlaying: HTMLMediaElement | null = null;

/** Call right before starting playback on `el` — pauses whatever else (if
 * anything) was playing across every coordinated preview on the page. */
export function pauseOthersAndTrack(el: HTMLMediaElement) {
  if (currentlyPlaying && currentlyPlaying !== el) currentlyPlaying.pause();
  currentlyPlaying = el;
}

/** Call from the element's own onPause/onEnded so a later preview doesn't
 * try to pause an element that already stopped on its own. */
export function untrack(el: HTMLMediaElement) {
  if (currentlyPlaying === el) currentlyPlaying = null;
}
