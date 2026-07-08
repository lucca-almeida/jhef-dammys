import { DashboardSection } from '@/components/dashboard-section';
import { PageHeader } from '@/components/page-header';

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction?: string;
  secondaryAction?: string;
  bullets: string[];
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  bullets,
}: PlaceholderPageProps) {
  const actions = [primaryAction, secondaryAction].filter(Boolean) as string[];

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
      />

      <DashboardSection eyebrow="Em construcao" title="Base da tela pronta">
        <div className="grid gap-4 md:grid-cols-2">
          {bullets.map((bullet) => (
            <div
              key={bullet}
              className="rounded-[24px] border border-border bg-white px-4 py-4 text-sm leading-6 text-muted sm:px-5 sm:py-5 sm:leading-7"
            >
              {bullet}
            </div>
          ))}
        </div>
      </DashboardSection>
    </>
  );
}
