import { cn } from "@/lib/utils";

// Text-based brand wordmark. Renders "CorArc" (or a "C" monogram for the
// collapsed/icon slots) in the body typeface. Size and color are driven
// by the caller via className (font-size + text color).
export function Wordmark({
  className,
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "icon";
}) {
  return (
    <span
      className={cn(
        "select-none font-semibold leading-none tracking-[-0.02em]",
        className,
      )}
    >
      {variant === "icon" ? "C" : "CorArc"}
    </span>
  );
}
