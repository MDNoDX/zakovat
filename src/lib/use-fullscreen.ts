"use client";

import { useCallback, useEffect, useState } from "react";

export function useFullscreen(target?: React.RefObject<HTMLElement>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const enter = useCallback(async () => {
    const el = target?.current ?? document.documentElement;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked by browser policy; presentation still works windowed.
    }
  }, [target]);

  const exit = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      exit();
    } else {
      enter();
    }
  }, [enter, exit]);

  return { isFullscreen, enter, exit, toggle };
}
