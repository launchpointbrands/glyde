import { FileText } from "lucide-react";
import { ModulePlaceholder } from "@/components/module-placeholder";

export default function AppReportsPage() {
  return (
    <ModulePlaceholder
      eyebrow="Cross-client"
      title="Reports"
      description="Exported PDFs and shared reports across all your clients. Coming soon."
      icon={<FileText className="h-5 w-5" />}
    />
  );
}
