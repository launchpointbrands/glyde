"use client";

import { useState } from "react";

// 48px square avatar — favicon-first, initials fallback. Falls back on
// network error or 404 (Google's favicon endpoint returns a globe icon
// when the site has none; that case isn't pixel-detectable from the
// client, so we live with the occasional generic globe).

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

export function ClientAvatar({
  businessName,
  domain,
  size = 48,
}: {
  businessName: string;
  domain: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showFavicon = !!domain && !failed;

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-subtle bg-bg-hover"
      style={{ width: size, height: size }}
    >
      {showFavicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
            domain!,
          )}&sz=64`}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-meta font-medium text-text-secondary">
          {initialsFor(businessName)}
        </span>
      )}
    </div>
  );
}
