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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-background text-muted-foreground">
          {icon}
        </div>
        {eyebrow && (
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <p className="font-display text-[28px] leading-tight font-medium tracking-tight">
          {title}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
