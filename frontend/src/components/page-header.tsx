type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: string[];
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions = [],
}: PageHeaderProps) {
  return (
    <header className="rounded-[28px] border border-border bg-panel px-6 py-6 shadow-[0_20px_60px_rgba(102,66,46,0.10)]">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            {description}
          </p>
        </div>

        {actions.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
            {actions.map((action, index) => (
              <button
                key={action}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-[0_10px_25px_rgba(102,66,46,0.08)] transition hover:-translate-y-0.5 ${
                  index === 0
                    ? 'border-accent bg-accent text-white hover:opacity-95'
                    : 'border-border bg-white text-foreground hover:border-accent/40'
                }`}
              >
                {action}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
