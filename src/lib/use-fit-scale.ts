"use client";

import { useLayoutEffect, useRef, useState } from "react";

const MIN_SCALE = 0.35;

/**
 * Presentation slides are a fixed viewport (h-screen, clipped with
 * overflow-hidden — there's no scrolling in front of an audience), but
 * prompt/answer text is free-form and presenter-resizable up to "XL". Long
 * text at a large size previously had no way to know it didn't fit and
 * just got silently clipped past the edge of the screen. This measures the
 * wrapped element's natural (untransformed) size against its parent's
 * available box and returns a uniform `scale` to shrink it down to fit —
 * 1 (a no-op transform) whenever it already fits, which is the common case,
 * so short text at any size renders completely unaffected.
 */
export function useFitScale<T extends HTMLElement>(deps: unknown[]) {
  const ref = useRef<T>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    function measure() {
      if (!el || !parent) return;
      // scrollWidth/Height reflect the element's own untransformed layout
      // box, so this stays accurate no matter what scale is currently
      // applied -- no need to reset the transform before re-measuring.
      const naturalW = el.scrollWidth;
      const naturalH = el.scrollHeight;
      if (naturalW === 0 || naturalH === 0) return;
      const next = Math.min(1, parent.clientWidth / naturalW, parent.clientHeight / naturalH);
      setScale(Math.max(MIN_SCALE, next));
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, scale };
}
