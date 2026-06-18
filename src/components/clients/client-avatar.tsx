"use client";

import { useEffect, useRef, useState } from "react";

// Square avatar with a three-stage logo cascade:
//   clearbit → google favicon → initials.
// Each <img> falls through to the next stage on error. Clearbit returns
// proper logos when the domain is in their index; Google favicons cover
// the long tail (with the occasional generic globe); the initials chip
// is the last-resort branded surface.

type Stage = "clearbit" | "favicon" | "initials";

function nextStage(s: Stage): Stage {
  return s === "clearbit" ? "favicon" : "initials";
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

export function ClientAvatar({
  businessName,
  domain,
  size = 48,
  variant = "neutral",
}: {
  businessName: string;
  domain: string | null;
  size?: number;
  variant?: "neutral" | "brand";
}) {
  const [stage, setStage] = useState<Stage>(domain ? "clearbit" : "initials");
  const isInitials = stage === "initials";
  const imgRef = useRef<HTMLImageElement>(null);

  // An <img> that fails to load *before* React hydrates never fires its
  // onError (the handler attaches too late), which strands a broken logo —
  // common on localhost or for fake/unindexed domains where the request
  // fails near-instantly. On mount and on each stage change, detect an
  // already-failed image and advance the cascade ourselves. The inline
  // onError handlers still cover failures that happen after hydration.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setStage((s) => (s === "initials" ? s : nextStage(s)));
    }
  }, [stage]);

  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-border-subtle",
        isInitials && variant === "brand" ? "bg-green-50" : "bg-bg-hover",
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      {stage === "clearbit" && domain && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={`https://logo.clearbit.com/${encodeURIComponent(domain)}`}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setStage("favicon")}
        />
      )}
      {stage === "favicon" && domain && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
            domain,
          )}&sz=64`}
          alt=""
          className="h-full w-full object-contain p-0.5"
          onError={() => setStage("initials")}
        />
      )}
      {isInitials && (
        <span
          className={[
            "font-medium",
            variant === "brand"
              ? "text-body text-green-800"
              : "text-meta text-text-secondary",
          ].join(" ")}
        >
          {initialsFor(businessName)}
        </span>
      )}
    </div>
  );
}
