// Severity → unified pill. High / moderate / low map to danger /
// warning / neutral families, sharing the visual vocabulary with the
// status pills used elsewhere.

import { StatusPill } from "@/components/ui/status-pill";

export type Severity = "low" | "moderate" | "high";

export function SeverityPill({ level }: { level: Severity }) {
  return <StatusPill variant={level} />;
}
