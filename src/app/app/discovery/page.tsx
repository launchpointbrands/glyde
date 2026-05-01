import { Compass } from "lucide-react";
import { ModulePlaceholder } from "@/components/module-placeholder";

export default function AppDiscoveryPage() {
  return (
    <ModulePlaceholder
      eyebrow="Cross-client"
      title="Discovery"
      description="Aggregate discovery responses across all your clients. Coming soon."
      icon={<Compass className="h-5 w-5" />}
    />
  );
}
