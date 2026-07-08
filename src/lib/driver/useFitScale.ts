"use client";

import { useEffect, useState } from "react";

/**
 * Scales the fixed 1280×720 infotainment canvas down to fit any viewport
 * (in-car display, laptop, phone) while preserving aspect ratio.
 */
export function useFitScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let raf = 0;
    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (!w || !h) {
        raf = requestAnimationFrame(fit);
        return;
      }
      const s = Math.min(w / 1340, h / 800, 1);
      setScale(s > 0 ? s : 1);
    };
    raf = requestAnimationFrame(fit);
    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, []);

  return scale;
}
