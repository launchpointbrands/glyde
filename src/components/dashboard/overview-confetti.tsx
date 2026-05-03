"use client";

import { useEffect } from "react";

// Fires once, 400ms after mount. Dynamic-imported so canvas-confetti
// only loads on the client when this component actually renders.
// Mounted by the Overview page only when first_viewed_at was just set.

export function OverviewConfetti() {
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#5CA85C", "#3D7A3D", "#A8D8A8", "#1F4A1F", "#D4EDD4"],
          ticks: 200,
          gravity: 0.8,
          scalar: 1.1,
        });
      } catch (e) {
        console.error("confetti failed to load", e);
      }
    }, 400);
    return () => clearTimeout(t);
  }, []);

  return null;
}
