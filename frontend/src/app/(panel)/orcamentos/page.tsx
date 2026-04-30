import { PlaceholderPage } from '@/components/placeholder-page';

export default function OrcamentosPage() {
  return (
    <PlaceholderPage
      eyebrow="Orcamentos"
      title="Funil de negociacao e propostas"
      description="Esta area sera usada para registrar pedidos, montar propostas e acompanhar o status ate a aprovacao ou cancelamento."
      primaryAction="Novo orcamento"
      secondaryAction="Filtrar status"
      bullets={[
        'Tipo do atendimento: mao de obra ou servico completo.',
        'Itens do cardapio ligados ao pedido.',
        'Status como rascunho, enviado, aprovado e recusado.',
        'Conversao direta de orcamento aprovado em evento.',
      ]}
    />
  );
}
