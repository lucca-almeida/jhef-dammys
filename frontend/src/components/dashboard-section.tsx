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
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            {eyebrow}
          </p>
          <h3 className="mt-2 max-w-[18ch] text-2xl font-semibold leading-[1.15] tracking-tight">
            {title}
          </h3>
        </div>

        {action ? (
          <button className="inline-flex min-h-[56px] min-w-[136px] items-center justify-center self-start rounded-full border border-border px-5 py-2 text-center text-sm font-medium leading-5 text-muted transition hover:border-accent/40 hover:text-foreground">
            {action}
          </button>
        ) : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}
