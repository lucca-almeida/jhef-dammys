import { PlaceholderPage } from '@/components/placeholder-page';

export default function CustosPage() {
  return (
    <PlaceholderPage
      eyebrow="Custos"
      title="Lancamento de gastos do evento"
      description="Aqui sera possivel registrar tudo que impacta o resultado do trabalho: ingredientes, ajudante, gasolina, gas, carvao e extras."
      primaryAction="Lancar custo"
      secondaryAction="Ver categorias"
      bullets={[
        'Custos separados por tipo.',
        'Ligacao direta com o evento correspondente.',
        'Base do calculo de lucro real.',
        'Visao clara do que mais pesa no operacional.',
      ]}
    />
  );
}
