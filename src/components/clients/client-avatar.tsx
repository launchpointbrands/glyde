"use client";

import { useState } from "react";

// Square avatar with a three-stage logo cascade:
//   clearbit → google favicon → initials.
// Each <img> falls through to the next stage on error. Clearbit returns
// proper logos when the domain is in their index; Google favicons cover
// the long tail (with the occasional generic globe); the initials chip
// is the last-resort branded surface.

type Stage = "clearbit" | "favicon" | "initials";

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
          src={`https://logo.clearbit.com/${encodeURIComponent(domain)}`}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setStage("favicon")}
        />
      )}
      {stage === "favicon" && domain && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
            domain,
          )}&sz=64`}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8"
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
