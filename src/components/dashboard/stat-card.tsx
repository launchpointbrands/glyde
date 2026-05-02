// Standard card surface — white, subtle border, soft shadow per DESIGN.md.
// Used as the base for module summary cards, top stat tiles, and any
// other contained block of dashboard content.

export function StatCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[10px] border border-border-subtle bg-bg-card px-6 py-6 shadow-card",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function StatCardHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-section font-semibold text-text-primary">{children}</h3>
  );
}
