import { PlaceholderPage } from '@/components/placeholder-page';

export default function FinanceiroPage() {
  return (
    <PlaceholderPage
      eyebrow="Financeiro"
      title="Recebimentos, pendencias e lucro"
      description="Esta area vai mostrar o que entrou, o que falta receber e qual foi o resultado financeiro do trabalho por evento e por periodo."
      primaryAction="Registrar pagamento"
      secondaryAction="Ver relatorio"
      bullets={[
        'Controle de sinal, parcial e pagamento final.',
        'Saldo a receber por evento.',
        'Resumo por mes e por periodo.',
        'Ligacao direta com custos para calcular lucro.',
      ]}
    />
  );
}
