import { PlaceholderPage } from '@/components/placeholder-page';

export default function EventosPage() {
  return (
    <PlaceholderPage
      eyebrow="Eventos"
      title="Operacao dos eventos fechados"
      description="Aqui vamos concentrar os dados do evento, local, equipe, pagamentos, custos e resultado financeiro final."
      primaryAction="Novo evento"
      secondaryAction="Ver confirmados"
      bullets={[
        'Detalhes completos de cada evento fechado.',
        'Ligacao com cliente, agenda, custos e pagamentos.',
        'Acompanhamento do status operacional.',
        'Base para o lucro real por evento.',
      ]}
    />
  );
}
