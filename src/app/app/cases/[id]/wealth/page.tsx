import { Wallet } from "lucide-react";
import { ModulePlaceholder } from "@/components/module-placeholder";

export default function WealthPage() {
  return (
    <ModulePlaceholder
      eyebrow="Module"
      title="Wealth"
      description="The wealth blueprint for this client will appear here."
      icon={<Wallet className="h-5 w-5" />}
    />
  );
}
