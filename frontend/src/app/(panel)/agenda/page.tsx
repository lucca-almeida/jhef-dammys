import { PlaceholderPage } from '@/components/placeholder-page';

export default function AgendaPage() {
  return (
    <PlaceholderPage
      eyebrow="Agenda"
      title="Controle de datas e compromissos"
      description="Aqui vamos montar a visao de calendario com datas ocupadas, eventos confirmados, pendencias e disponibilidade futura."
      primaryAction="Novo evento"
      secondaryAction="Ver mes"
      bullets={[
        'Calendario mensal com status por evento.',
        'Lista do dia com horarios, local e responsavel.',
        'Separacao entre pendente, confirmado, concluido e cancelado.',
        'Consulta rapida para nao perder datas ou criar conflito.',
      ]}
    />
  );
}
