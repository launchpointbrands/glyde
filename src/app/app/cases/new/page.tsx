import { createCase } from "@/lib/cases";

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <form
        action={createCase}
        className="w-full max-w-[480px] rounded-[12px] border border-border-subtle bg-bg-card p-8 shadow-card"
      >
        <h1 className="text-[20px] font-semibold text-text-primary">
          Add a client
        </h1>
        <p className="mt-1.5 text-[13px] text-text-secondary">
          Start with the basics — you can fill in more during discovery.
        </p>

        <p className="mt-7 text-[11px] font-medium tracking-[0.05em] text-text-tertiary uppercase">
          About the client
        </p>

        <div className="mt-3 flex flex-col gap-3">
          <Field
            id="contact_name"
            label="Full name"
            required
            placeholder="Peter Smith"
            autoComplete="name"
          />
          <Field
            id="contact_email"
            label="Email address"
            type="email"
            placeholder="peter@theirbusiness.com"
            autoComplete="email"
          />
          <Field
            id="contact_title"
            label="Title"
            placeholder="Owner, CEO, Managing Partner..."
            autoComplete="organization-title"
          />
        </div>

        <p className="mt-5 text-[11px] font-medium tracking-[0.05em] text-text-tertiary uppercase">
          About the business
        </p>

        <div className="mt-3 flex flex-col gap-3">
          <Field
            id="business_name"
            label="Business name"
            placeholder="Precision Auto Services"
            autoComplete="organization"
          />
          <Field
            id="domain"
            label="Business domain"
            required
            placeholder="precisionauto.com"
            autoComplete="off"
            help="Used to find the company logo and generate an AI business description."
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[13px] text-danger-text"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-6 w-full rounded-[8px] bg-green-400 px-4 py-2.5 text-[14px] font-medium text-text-inverse transition-colors hover:bg-green-600"
        >
          Create client →
        </button>
      </form>
    </main>
  );
}

function Field({
  id,
  label,
  type = "text",
  required,
  placeholder,
  autoComplete,
  help,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  help?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-text-primary"
      >
        {label}
        {required ? null : (
          <span className="ml-1 text-text-tertiary">(optional)</span>
        )}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1.5 block w-full rounded-[8px] border border-border-default bg-bg-input px-3 py-2.5 text-[14px] text-text-primary placeholder:text-text-tertiary transition-shadow focus:border-green-400 focus:ring-[3px] focus:ring-green-50 focus:outline-none"
      />
      {help ? (
        <p className="mt-1.5 text-[12px] text-text-tertiary">{help}</p>
      ) : null}
    </div>
  );
}
