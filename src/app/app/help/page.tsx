import { LifeBuoy } from "lucide-react";
import { ModulePlaceholder } from "@/components/module-placeholder";

export default function AppHelpPage() {
  return (
    <ModulePlaceholder
      eyebrow="Support"
      title="Help"
      description="Documentation, walkthroughs, and a way to reach the team. Coming soon."
      icon={<LifeBuoy className="h-5 w-5" />}
    />
  );
}
