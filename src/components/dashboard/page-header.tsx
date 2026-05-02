export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-8 border-b border-border-subtle pb-6">
      <h1 className="text-page font-semibold text-text-primary">{title}</h1>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-body text-text-secondary">
          {subtitle}
        </p>
      )}
    </header>
  );
}
