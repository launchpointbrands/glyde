import { createCase } from "@/lib/cases";

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium">Start with a client.</h1>
          <p className="text-sm text-muted-foreground">
            Domain is enough to begin. Everything else can be filled in later.
          </p>
        </div>

        <form action={createCase} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="domain" className="text-sm">
              Business domain
            </label>
            <input
              id="domain"
              name="domain"
              type="text"
              required
              autoComplete="off"
              placeholder="precisionauto.com"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="business_name" className="text-sm">
              Business name{" "}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="business_name"
              name="business_name"
              type="text"
              autoComplete="off"
              placeholder="Precision Auto Services"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Create case
          </button>
        </form>
      </div>
    </main>
  );
}
