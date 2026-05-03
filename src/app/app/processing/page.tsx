"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const MESSAGES = [
  "Analyzing discovery responses...",
  "Modeling business risk factors...",
  "Calculating valuation range...",
  "Building your succession roadmap...",
  "Generating advisor insights...",
  "Your client overview is ready.",
];

const TOTAL_DURATION_MS = 3500;
const MESSAGE_INTERVAL_MS = 700;

export default function ProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get("caseId");

  const [messageIndex, setMessageIndex] = useState(0);
  const [progressFilled, setProgressFilled] = useState(false);

  // Cycle the status copy every 700ms; cap at the final message.
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Drive the progress bar via a single CSS transition from 0 → 100.
  useEffect(() => {
    const t = setTimeout(() => setProgressFilled(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Redirect to the Overview after the animation finishes.
  useEffect(() => {
    if (!caseId) return;
    const t = setTimeout(() => {
      router.push(`/app/cases/${caseId}`);
    }, TOTAL_DURATION_MS);
    return () => clearTimeout(t);
  }, [caseId, router]);

  if (!caseId) {
    // Defensive — if the URL is hit without a caseId, send the advisor
    // home rather than spinning forever.
    if (typeof window !== "undefined") router.push("/app");
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-bg-page px-6">
      <Image
        src="/brand/glyde-wordmark.svg"
        alt="Glyde"
        width={180}
        height={36}
        unoptimized
        priority
        className="h-9 w-auto"
      />

      {/* Icon — outer wrapper rotates, inner pulses, so the two
          animations compose cleanly via two stacked transforms. */}
      <div className="animate-[glyde-spin_3s_linear_infinite]">
        <div className="animate-[glyde-pulse_2s_ease-in-out_infinite]">
          <Image
            src="/brand/glyde-icon.svg"
            alt=""
            width={72}
            height={72}
            unoptimized
            priority
            aria-hidden
            className="h-[72px] w-[72px]"
          />
        </div>
      </div>

      {/* Status messages — crossfade by keeping all 6 in place and only
          rendering the active one. */}
      <p
        key={messageIndex}
        className="animate-[glyde-fadein_300ms_ease-out] text-meta text-text-secondary"
      >
        {MESSAGES[messageIndex]}
      </p>

      <div className="h-[3px] w-[260px] overflow-hidden rounded-[2px] bg-border-subtle">
        <div
          className="h-full rounded-[2px] bg-green-400 transition-[width] ease-out"
          style={{
            width: progressFilled ? "100%" : "0%",
            transitionDuration: `${TOTAL_DURATION_MS}ms`,
          }}
          aria-hidden
        />
      </div>

      <style jsx global>{`
        @keyframes glyde-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes glyde-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes glyde-fadein {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
