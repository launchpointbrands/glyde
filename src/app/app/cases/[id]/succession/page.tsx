import { GitBranch } from "lucide-react";
import { ModulePlaceholder } from "@/components/module-placeholder";

export default function SuccessionPage() {
  return (
    <ModulePlaceholder
      eyebrow="Module"
      title="Succession"
      description="The succession and exit plan for this client will appear here."
      icon={<GitBranch className="h-5 w-5" />}
    />
  );
}
