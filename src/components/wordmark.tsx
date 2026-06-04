import { cn } from "@/lib/utils";

// WMGR brand mark. Renders the logo as an inline SVG sized by font-size
// (height: 1em), so existing `text-[Npx]` call sites control the size.
//   variant="full" → mark + "WMGR" wordmark
//   variant="icon" → just the circular mark
//   tone="brand"   → green mark with negative-space cuts (for light bg)
//   tone="light"   → white mark with green cuts (for dark bg, e.g. auth panel)
//
// Color comes from the tone (fixed brand fills), not the text color, so the
// mark stays on-brand regardless of the surrounding `text-*` class.

const GREEN = "#395E38";
const WHITE = "#FFFFFF";

// Mark = green base/outline (st1) + three white negative-space cuts (st0).
const MARK_BASE =
  "M75.2.5c46.9-5.1,87.8,29.1,92.8,74.6s-28.6,87.8-74.7,92.8C47.5,173,6,139.9.6,94.1S28,5.7,75.2.5ZM79.7,106.1l-27-57.2h-20.1c-1.2,0-2.7.4-3.5.9s-.7,3.1-.5,4.2l34.5,73.4c.8,1.3,1.8,2.6,2.7,3s3.4-1,3.8-1.9l10.1-22.4ZM111.2,128.2l10-21.7-27-57.3h-22.2c-1.2-.1-3,2.7-2.5,4l35.4,75.4c.4.9,2.7,2.3,3.7,2s2.2-1.5,2.6-2.3ZM124.6,49.7c-6.8,2.2-9.7,9.3-7.5,15.4s9.3,9.3,15.1,7.3,9.5-9.3,7.4-15.4-8.6-9.4-15.1-7.3Z";
const MARK_CUTS = [
  "M79.7,106.1l-10.1,22.4c-.4.9-3,2.3-3.8,1.9s-1.9-1.7-2.7-3L28.5,54c-.2-1.2-.2-3.7.5-4.2s2.3-.8,3.5-.8h20.1c0,0,27,57.1,27,57.1Z",
  "M111.2,128.2c-.4.8-1.8,2-2.6,2.3s-3.2-1.1-3.7-2l-35.4-75.4c-.6-1.2,1.3-4.1,2.5-4.1h22.2c0,.1,27,57.5,27,57.5l-10,21.7Z",
  "M124.6,49.7c6.5-2.1,13,1.2,15.1,7.3s-.8,13.2-7.4,15.4-12.9-1-15.1-7.3.7-13.2,7.5-15.4Z",
];
const LETTERS = [
  "M197.4,51.9h12.6l15.9,49.3,16.3-49.5h9.9l16.3,49.5,15.9-49.3h12.3l-23.2,67h-10.1l-16.3-47.8-16.3,47.8h-10.1l-23.2-67Z",
  "M308.6,51.9h12.5l20.2,31.5,20.2-31.5h12.5v66.5h-11.7v-47.7l-21,31.4h-.4l-20.8-31.2v47.5h-11.5V51.9Z",
  "M388.2,85.4v-.2c0-18.6,14.3-34.4,34.3-34.4s18.7,3.2,25.6,9l-7.4,8.8c-5.1-4.4-10.2-7.1-18.6-7.1-12.3,0-21.6,10.7-21.6,23.5v.2c0,13.7,9,23.8,22.6,23.8s12-2,16.1-5v-12.5h-17v-10.2h28.3v27.9c-6.6,5.6-16,10.4-27.8,10.4-20.8,0-34.5-14.8-34.5-34.2Z",
  "M465.6,51.9h29.7c8.4,0,14.9,2.5,19.2,6.7,3.5,3.6,5.5,8.6,5.5,14.4v.2c0,10.9-6.6,17.5-15.9,20.2l18,25.2h-13.8l-16.3-23.2h-14.6v23.2h-11.7V51.9ZM494.4,84.9c8.4,0,13.7-4.4,13.7-11.1v-.2c0-7.1-5.1-11-13.8-11h-17v22.3h17.1Z",
];

export function Wordmark({
  className,
  variant = "full",
  tone = "brand",
}: {
  className?: string;
  variant?: "full" | "icon";
  tone?: "brand" | "light";
}) {
  const baseFill = tone === "light" ? WHITE : GREEN;
  const cutFill = tone === "light" ? GREEN : WHITE;

  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 168.5 168.5"
        role="img"
        aria-label="WMGR"
        style={{ height: "1em", width: "1em" }}
        className={cn("inline-block align-middle", className)}
      >
        <path fill={baseFill} d={MARK_BASE} />
        {MARK_CUTS.map((d) => (
          <path key={d} fill={cutFill} d={d} />
        ))}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 522.1 168.5"
      role="img"
      aria-label="WMGR"
      style={{ height: "1em", width: "auto" }}
      className={cn("inline-block align-middle", className)}
    >
      <path fill={baseFill} d={MARK_BASE} />
      {MARK_CUTS.map((d) => (
        <path key={d} fill={cutFill} d={d} />
      ))}
      {LETTERS.map((d) => (
        <path key={d} fill={baseFill} d={d} />
      ))}
    </svg>
  );
}
