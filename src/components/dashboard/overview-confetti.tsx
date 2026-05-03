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
        const colors = [
          "#5CA85C",
          "#3D7A3D",
          "#A8D8A8",
          "#1F4A1F",
          "#D4EDD4",
        ];

        // Left side burst
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors,
          ticks: 200,
          gravity: 0.8,
        });

        // Right side burst
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors,
          ticks: 200,
          gravity: 0.8,
        });

        // Center bottom burst
        confetti({
          particleCount: 80,
          angle: 90,
          spread: 70,
          origin: { x: 0.5, y: 1 },
          colors,
          ticks: 200,
          gravity: 0.7,
        });
      } catch (e) {
        console.error("confetti failed to load", e);
      }
    }, 400);
    return () => clearTimeout(t);
  }, []);

  return null;
}
