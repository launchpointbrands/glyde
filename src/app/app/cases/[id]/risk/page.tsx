import { ShieldAlert } from "lucide-react";
import { ModulePlaceholder } from "@/components/module-placeholder";

export default function RiskPage() {
  return (
    <ModulePlaceholder
      eyebrow="Module"
      title="Risk"
      description="The risk dashboard for this client will appear here."
      icon={<ShieldAlert className="h-5 w-5" />}
    />
  );
}
