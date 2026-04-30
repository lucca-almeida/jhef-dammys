import { ReactNode } from 'react';

type DashboardSectionProps = {
  eyebrow: string;
  title: string;
  action?: string;
  children: ReactNode;
};

export function DashboardSection({
  eyebrow,
  title,
  action,
  children,
}: DashboardSectionProps) {
  return (
    <section className="rounded-[28px] border border-border bg-panel px-6 py-6 shadow-[0_20px_50px_rgba(102,66,46,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h3>
        </div>

        {action ? (
          <button className="rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:border-accent/40 hover:text-foreground">
            {action}
          </button>
        ) : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}
