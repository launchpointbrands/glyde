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
          <h1 className="text-page font-semibold text-text-primary">
            Start with a client.
          </h1>
          <p className="text-meta text-text-secondary">
            Domain is enough to begin. Everything else can be filled in later.
          </p>
        </div>

        <form
          action={createCase}
          className="space-y-4 rounded-[10px] border border-border-subtle bg-bg-card px-6 py-6 shadow-card"
        >
          <div className="space-y-2">
            <label
              htmlFor="domain"
              className="text-meta font-medium text-text-primary"
            >
              Business domain
            </label>
            <input
              id="domain"
              name="domain"
              type="text"
              required
              autoComplete="off"
              placeholder="precisionauto.com"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="business_name"
              className="text-meta font-medium text-text-primary"
            >
              Business name{" "}
              <span className="text-text-tertiary">(optional)</span>
            </label>
            <input
              id="business_name"
              name="business_name"
              type="text"
              autoComplete="off"
              placeholder="Precision Auto Services"
              className={inputClass}
            />
          </div>

          {error && (
            <p
              className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-meta text-danger-fg"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-green-400 px-3 py-2 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600"
          >
            Create case
          </button>
        </form>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-md border border-border-default bg-bg-input px-3 py-2 text-meta text-text-primary placeholder:text-text-tertiary transition-shadow focus:border-green-400 focus:outline-none focus:ring-[3px] focus:ring-green-50";
