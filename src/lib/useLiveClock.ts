"use client";

import { useEffect, useReducer } from "react";

// One shared 1-second interval for all subscribers (cheap live countdowns).
let timer: ReturnType<typeof setInterval> | null = null;
let now = Date.now();
const listeners = new Set<() => void>();

function ensureTimer() {
  if (timer) return;
  timer = setInterval(() => {
    now = Date.now();
    listeners.forEach((l) => l());
  }, 1000);
}

/** Returns the current time in ms, re-rendering the caller every second. */
export function useLiveClock(): number {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    ensureTimer();
    listeners.add(force);
    return () => {
      listeners.delete(force);
      if (listeners.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);
  return now;
}
