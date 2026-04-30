import { DashboardSection } from '@/components/dashboard-section';
import { PageHeader } from '@/components/page-header';

const summaryCards = [
  {
    label: 'Eventos no mes',
    value: '18',
    note: '+4 confirmados nesta semana',
    tone: 'warm',
  },
  {
    label: 'A receber',
    value: 'R$ 7.850',
    note: '6 sinais pendentes de confirmacao',
    tone: 'light',
  },
  {
    label: 'Lucro estimado',
    value: 'R$ 5.420',
    note: 'Margem media de 31% nos fechados',
    tone: 'dark',
  },
  {
    label: 'Orcamentos abertos',
    value: '11',
    note: '3 precisam de retorno hoje',
    tone: 'light',
  },
];

const todayAgenda = [
  {
    time: '08:30',
    title: 'Compra de carnes e reposicao de saladas',
    tag: 'Operacional',
  },
  {
    time: '11:00',
    title: 'Responder orcamento de casamento - 120 pessoas',
    tag: 'Comercial',
  },
  {
    time: '15:30',
    title: 'Conferir ajudantes do evento de sabado',
    tag: 'Equipe',
  },
  {
    time: '19:00',
    title: 'Fechamento financeiro do evento corporativo',
    tag: 'Financeiro',
  },
];

const nextEvents = [
  {
    date: '03 mai',
    title: 'Aniversario - 70 pessoas',
    place: 'Chacara Santa Luzia',
    status: 'Confirmado',
    amount: 'R$ 3.400',
  },
  {
    date: '10 mai',
    title: 'Casamento - 120 pessoas',
    place: 'Espaco Recanto Verde',
    status: 'Sinal pago',
    amount: 'R$ 9.800',
  },
  {
    date: '17 mai',
    title: 'Corporativo - 45 pessoas',
    place: 'Centro da cidade',
    status: 'Aguardando contrato',
    amount: 'R$ 2.950',
  },
];

const pendingBudgets = [
  {
    client: 'Mariana e Felipe',
    people: '120 pessoas',
    type: 'Servico completo',
    deadline: 'Responder hoje',
  },
  {
    client: 'Carlos Henrique',
    people: '35 pessoas',
    type: 'Mao de obra',
    deadline: 'Follow-up amanha',
  },
  {
    client: 'Condominio Primavera',
    people: '80 pessoas',
    type: 'Servico completo',
    deadline: 'Aguardando retorno',
  },
];

const costBreakdown = [
  { name: 'Ingredientes', value: 'R$ 2.180', width: '74%' },
  { name: 'Ajudantes', value: 'R$ 940', width: '52%' },
  { name: 'Gas e carvao', value: 'R$ 560', width: '36%' },
  { name: 'Gasolina', value: 'R$ 210', width: '18%' },
];

const stockAlerts = [
  { item: 'Carvao', level: 'Baixo', note: 'restam 6 sacos' },
  { item: 'Chimichurri', level: 'Critico', note: '1 pote fechado' },
  { item: 'Gas', level: 'Atencao', note: 'prever reposicao ate sexta' },
];

const recentActivity = [
  'Evento "Aniversario da Luiza" marcado como confirmado.',
  'Compra de arroz, alho e oleo registrada no estoque.',
  'Sinal de R$ 1.500 recebido via Pix.',
  'Novo cliente cadastrado: Buffet Corporativo Atlas.',
];

function getCardToneClasses(tone: string) {
  if (tone === 'warm') {
    return 'bg-[#fff3e7]';
  }

  if (tone === 'dark') {
    return 'bg-[#3a2a24] text-[#fff5ee]';
  }

  return 'bg-panel';
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Dashboard operacional"
        title="Visao real do negocio em um unico painel"
        description="Uma dashboard pensada para o uso do dia a dia: compromissos, eventos proximos, orcamentos abertos, custos, estoque e atividade recente."
        actions={['Novo cliente', 'Novo orcamento', 'Novo evento', 'Lancar custo']}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <article
            key={item.label}
            className={`rounded-[24px] border border-border px-5 py-5 shadow-[0_18px_40px_rgba(102,66,46,0.08)] ${getCardToneClasses(
              item.tone,
            )}`}
          >
            <p
              className={`text-sm font-semibold uppercase tracking-[0.16em] ${
                item.tone === 'dark' ? 'text-[#f0c9b1]' : 'text-accent'
              }`}
            >
              {item.label}
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-tight">
              {item.value}
            </p>
            <p
              className={`mt-2 text-sm leading-6 ${
                item.tone === 'dark' ? 'text-[#ecd6c9]' : 'text-muted'
              }`}
            >
              {item.note}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardSection
          eyebrow="Agenda do dia"
          title="Compromissos e rotina de hoje"
          action="Abrir agenda"
        >
          <div className="space-y-4">
            {todayAgenda.map((item) => (
              <article
                key={`${item.time}-${item.title}`}
                className="grid gap-4 rounded-[24px] border border-border bg-white px-4 py-4 sm:grid-cols-[88px_1fr_auto]"
              >
                <div className="rounded-2xl bg-accent-soft px-3 py-4 text-center text-accent">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                    Hora
                  </p>
                  <p className="mt-2 text-xl font-semibold">{item.time}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold tracking-tight">
                    {item.title}
                  </h4>
                </div>

                <div className="flex items-start justify-start sm:justify-end">
                  <span className="rounded-full border border-accent/20 bg-accent-soft px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    {item.tag}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Atividade recente"
          title="O que aconteceu por ultimo"
        >
          <div className="space-y-3">
            {recentActivity.map((entry) => (
              <div
                key={entry}
                className="rounded-2xl border border-border bg-white px-4 py-4 text-sm leading-6 text-muted"
              >
                {entry}
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardSection
          eyebrow="Proximos eventos"
          title="Agenda prioritaria"
          action="Ver todos"
        >
          <div className="space-y-4">
            {nextEvents.map((event) => (
              <article
                key={`${event.title}-${event.date}`}
                className="grid gap-4 rounded-[24px] border border-border bg-white px-4 py-4 lg:grid-cols-[84px_1fr_auto]"
              >
                <div className="rounded-2xl bg-[#f7efe8] px-3 py-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    Data
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    {event.date}
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold tracking-tight">
                    {event.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {event.place}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <span className="rounded-full border border-accent/20 bg-accent-soft px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    {event.status}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {event.amount}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Orcamentos pendentes"
          title="Negociacoes que pedem retorno"
          action="Abrir funil"
        >
          <div className="space-y-4">
            {pendingBudgets.map((budget) => (
              <article
                key={budget.client}
                className="rounded-[24px] border border-border bg-white px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold tracking-tight">
                      {budget.client}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {budget.people} · {budget.type}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#f6ede7] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    {budget.deadline}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardSection
          eyebrow="Resumo de custos"
          title="Composicao do gasto dos eventos"
        >
          <div className="space-y-4">
            {costBreakdown.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="text-muted">{item.value}</span>
                </div>
                <div className="h-3 rounded-full bg-[#ead9cc]">
                  <div
                    className="h-3 rounded-full bg-accent"
                    style={{ width: item.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Estoque"
          title="Itens que pedem atencao"
          action="Ver estoque"
        >
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            {stockAlerts.map((alert) => (
              <article
                key={alert.item}
                className="rounded-[24px] border border-border bg-white px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-lg font-semibold tracking-tight">
                    {alert.item}
                  </h4>
                  <span className="rounded-full border border-accent/20 bg-accent-soft px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    {alert.level}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{alert.note}</p>
              </article>
            ))}
          </div>
        </DashboardSection>
      </div>
    </>
  );
}
