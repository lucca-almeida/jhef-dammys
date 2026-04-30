import { PlaceholderPage } from '@/components/placeholder-page';

export default function EstoquePage() {
  return (
    <PlaceholderPage
      eyebrow="Estoque"
      title="Controle de insumos e materiais"
      description="Esta tela vai reunir saldo atual, alertas de reposicao, historico de entrada e saida e relacao entre compra e uso no evento."
      primaryAction="Novo item"
      secondaryAction="Registrar entrada"
      bullets={[
        'Itens como arroz, carne, carvao, gas e descartaveis.',
        'Quantidade atual, unidade e estoque minimo.',
        'Alertas visuais para reposicao.',
        'Historico de movimentacao por item.',
      ]}
    />
  );
}
