import Link from "next/link";

export function DashboardEmptyState({
  caseId,
  reportName,
}: {
  caseId: string;
  reportName: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-8 py-24">
      <div className="max-w-md space-y-5 text-center">
        <p className="text-eyebrow uppercase text-text-tertiary">Not yet</p>
        <p className="text-section font-semibold text-text-primary">
          This view comes alive once the engagement has structure to read.
        </p>
        <p className="text-body text-text-secondary">
          Continue discovery to generate the {reportName} report for this
          client.
        </p>
        <div className="pt-2">
          <Link
            href={`/app/cases/${caseId}/discovery`}
            className="inline-flex items-center rounded-md bg-green-400 px-4 py-2 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600"
          >
            Go to discovery
          </Link>
        </div>
      </div>
    </div>
  );
}
