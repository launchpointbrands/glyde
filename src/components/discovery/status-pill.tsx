// Re-exports the unified status pill so existing imports keep working.
// Variant names match the data states this surface produces.

import { StatusPill as Pill, type StatusVariant } from "@/components/ui/status-pill";

export type PillState = Extract<
  StatusVariant,
  "verified" | "simulated" | "skipped" | "follow_up"
>;

export function StatusPill({ state }: { state: PillState }) {
  return <Pill variant={state} />;
}
