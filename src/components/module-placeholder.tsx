import type { ReactNode } from "react";

export function ModulePlaceholder({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-8 py-16">
      <div className="max-w-sm space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-bg-card text-text-tertiary shadow-card">
          {icon}
        </div>
        {eyebrow && (
          <p className="text-eyebrow uppercase text-text-tertiary">
            {eyebrow}
          </p>
        )}
        <p className="text-section font-semibold text-text-primary">{title}</p>
        {description && (
          <p className="text-body text-text-secondary">{description}</p>
        )}
      </div>
    </div>
  );
}
