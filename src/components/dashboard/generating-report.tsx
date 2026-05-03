import { PageHeader } from "@/components/dashboard/page-header";

// Renders when a dashboard's underlying snapshot row is null at request
// time — should be vanishingly rare after migration 0009 + the
// ensureFinancials self-heal in financials.ts. Keeps the page chrome
// consistent so layout doesn't jump on subsequent loads.

export function GeneratingReport({ title }: { title: string }) {
  return (
    <main className="flex flex-1 flex-col px-5 pt-8 pb-12 md:px-10 md:pt-10 md:pb-16">
      <div className="mx-auto w-full max-w-[1100px]">
        <PageHeader title={title} />
        <div className="rounded-[10px] border border-border-subtle bg-bg-card px-7 py-16 text-center shadow-card">
          <div
            role="status"
            aria-label="Generating"
            className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-border-default border-t-green-400"
          />
          <p className="mt-4 text-meta text-text-secondary">
            Generating your report…
          </p>
        </div>
      </div>
    </main>
  );
}
