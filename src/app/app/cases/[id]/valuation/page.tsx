import { TrendingUp } from "lucide-react";
import { ModulePlaceholder } from "@/components/module-placeholder";

export default function ValuationPage() {
  return (
    <ModulePlaceholder
      eyebrow="Module"
      title="Valuation"
      description="The valuation dashboard for this client will appear here."
      icon={<TrendingUp className="h-5 w-5" />}
    />
  );
}
