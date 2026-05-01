import { Compass } from "lucide-react";
import { ModulePlaceholder } from "@/components/module-placeholder";

export default function DiscoveryPage() {
  return (
    <ModulePlaceholder
      eyebrow="Module"
      title="Discovery"
      description="The discovery answers captured for this client will appear here."
      icon={<Compass className="h-5 w-5" />}
    />
  );
}
