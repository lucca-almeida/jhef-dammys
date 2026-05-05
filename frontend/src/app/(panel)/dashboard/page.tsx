'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardSection } from '@/components/dashboard-section';
import { PageHeader } from '@/components/page-header';
import { api } from '@/lib/api';

type EventStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
type BudgetStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'CANCELED';

type ApiEvent = {
  id: string;
  title: string;
  eventDate: string;
  eventLocation: string | null;
  guestCount: number;
  finalPrice: string;
  status: EventStatus;
  client: {
    id: string;
    name: string;
  };
};

type ApiBudget = {
  id: string;
  eventDate: string;
  eventLocation: string | null;
  guestCount: number;
  estimatedPrice: string;
  status: BudgetStatus;
  client: {
    id: string;
    name: string;
  };
};

type ApiPayment = {
  id: string;
  eventId: string;
  type: 'DOWN_PAYMENT' | 'PARTIAL' | 'FINAL';
  method: 'PIX' | 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
  amount: string;
  paidAt: string;
  event: {
    id: string;
    title: string;
    client: {
      id: string;
      name: string;
    };
  };
};

type ApiCost = {
  id: string;
  eventId: string;
  category: string;
  description: string;
  amount: string;
  spentAt: string;
  event: {
    id: string;
    title: string;
    client: {
      id: string;
      name: string;
    };
  };
};

type ApiProduct = {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  stockQuantity: string | null;
  minimumStock: string | null;
  isActive: boolean;
};

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function getCardToneClasses(tone: 'warm' | 'light' | 'dark') {
  if (tone === 'warm') {
    return 'bg-[#fff3e7]';
  }

  if (tone === 'dark') {
    return 'bg-[#3a2a24] text-[#fff5ee]';
  }

  return 'bg-panel';
}

function getEventStatusLabel(status: EventStatus) {
  const labels: Record<EventStatus, string> = {
    PENDING: 'Pendente',
    CONFIRMED: 'Confirmado',
    COMPLETED: 'Concluido',
    CANCELED: 'Cancelado',
  };

  return labels[status];
}

export default function DashboardPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [budgets, setBudgets] = useState<ApiBudget[]>([]);
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [costs, setCosts] = useState<ApiCost[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setError(null);

        const [eventsData, budgetsData, paymentsData, costsData, productsData] =
          await Promise.all([
            api<ApiEvent[]>('/events'),
            api<ApiBudget[]>('/budgets'),
            api<ApiPayment[]>('/payments'),
            api<ApiCost[]>('/costs'),
            api<ApiProduct[]>('/products?onlyActive=true'),
          ]);

        if (!isMounted) {
          return;
        }

        setEvents(eventsData);
        setBudgets(budgetsData);
        setPayments(paymentsData);
        setCosts(costsData);
        setProducts(productsData);
      } catch (loadError) {
        if (isMounted) {
          setError('Nao foi possivel carregar os dados reais da dashboard.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const financialByEvent = useMemo(() => {
    return events.map((event) => {
      const received = payments
        .filter((payment) => payment.eventId === event.id)
        .reduce((total, payment) => total + Number(payment.amount), 0);
      const eventCosts = costs
        .filter((cost) => cost.eventId === event.id)
        .reduce((total, cost) => total + Number(cost.amount), 0);
      const finalPrice = Number(event.finalPrice);

      return {
        ...event,
        received,
        eventCosts,
        outstanding: Math.max(finalPrice - received, 0),
        projectedProfit: finalPrice - eventCosts,
      };
    });
  }, [costs, events, payments]);

  const summaryCards = useMemo(() => {
    const confirmedThisWeek = events.filter((event) => event.status === 'CONFIRMED').length;
    const toReceive = financialByEvent.reduce(
      (total, event) => total + event.outstanding,
      0,
    );
    const projectedProfit = financialByEvent.reduce(
      (total, event) => total + event.projectedProfit,
      0,
    );
    const openBudgets = budgets.filter(
      (budget) => !['APPROVED', 'REJECTED', 'CANCELED'].includes(budget.status),
    ).length;

    return [
      {
        label: 'Eventos na base',
        value: String(events.length),
        note: `${confirmedThisWeek} confirmados no momento`,
        tone: 'warm' as const,
      },
      {
        label: 'A receber',
        value: formatCurrency(toReceive),
        note: 'Saldo aberto dos eventos ja cadastrados',
        tone: 'light' as const,
      },
      {
        label: 'Lucro projetado',
        value: formatCurrency(projectedProfit),
        note: 'Valor fechado menos custos ja lancados',
        tone: 'dark' as const,
      },
      {
        label: 'Orcamentos abertos',
        value: String(openBudgets),
        note: 'Negociacoes ainda em andamento',
        tone: 'light' as const,
      },
    ];
  }, [budgets, events, financialByEvent]);

  const todayAgenda = useMemo(() => {
    return events
      .filter((event) => event.eventDate.slice(0, 10) === todayKey)
      .sort(
        (left, right) =>
          new Date(left.eventDate).getTime() - new Date(right.eventDate).getTime(),
      )
      .slice(0, 5);
  }, [events, todayKey]);

  const nextEvents = useMemo(() => {
    return financialByEvent
      .filter((event) => new Date(event.eventDate).getTime() >= new Date(todayKey).getTime())
      .sort(
        (left, right) =>
          new Date(left.eventDate).getTime() - new Date(right.eventDate).getTime(),
      )
      .slice(0, 4);
  }, [financialByEvent, todayKey]);

  const pendingBudgets = useMemo(() => {
    return budgets
      .filter((budget) => !['APPROVED', 'REJECTED', 'CANCELED'].includes(budget.status))
      .sort(
        (left, right) =>
          new Date(left.eventDate).getTime() - new Date(right.eventDate).getTime(),
      )
      .slice(0, 4);
  }, [budgets]);

  const costBreakdown = useMemo(() => {
    const grouped = costs.reduce<Record<string, number>>((accumulator, cost) => {
      accumulator[cost.category] = (accumulator[cost.category] ?? 0) + Number(cost.amount);
      return accumulator;
    }, {});

    const total = Object.values(grouped).reduce((sum, value) => sum + value, 0);

    return Object.entries(grouped)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([name, value]) => ({
        name,
        value: formatCurrency(value),
        width: total > 0 ? `${Math.max((value / total) * 100, 8)}%` : '8%',
      }));
  }, [costs]);

  const stockAlerts = useMemo(() => {
    return products
      .filter((product) => {
        const stock = Number(product.stockQuantity ?? 0);
        const minimum = Number(product.minimumStock ?? 0);
        return minimum > 0 && stock <= minimum;
      })
      .slice(0, 4)
      .map((product) => ({
        item: product.name,
        level:
          Number(product.stockQuantity ?? 0) === 0
            ? 'Critico'
            : Number(product.stockQuantity ?? 0) <= Number(product.minimumStock ?? 0) / 2
              ? 'Baixo'
              : 'Atencao',
        note: `restam ${Number(product.stockQuantity ?? 0).toFixed(2)} ${product.unit}`,
      }));
  }, [products]);

  const recentActivity = useMemo(() => {
    const paymentEntries = payments.slice(0, 2).map(
      (payment) =>
        `${payment.event.client.name} registrou ${formatCurrency(payment.amount)} via ${payment.method.toLowerCase()}.`,
    );
    const costEntries = costs.slice(0, 2).map(
      (cost) =>
        `${cost.event.client.name} teve custo de ${formatCurrency(cost.amount)} em ${cost.category}.`,
    );

    return [...paymentEntries, ...costEntries].slice(0, 4);
  }, [costs, payments]);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard operacional"
        title="Visao real do negocio em um unico painel"
        description="Um painel de entrada para ele bater o olho no que vai acontecer, no que falta receber e em como os eventos estao se comportando financeiramente."
        actions={['Novo cliente', 'Novo orcamento', 'Novo evento', 'Lancar custo']}
      />

      {error ? (
        <div className="rounded-[24px] border border-[#e4b7a0] bg-[#fff1e8] px-5 py-4 text-sm text-[#8a4c30]">
          {error}
        </div>
      ) : null}

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
              {isLoading ? '...' : item.value}
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
          title="Compromissos e eventos de hoje"
          action="Abrir agenda"
        >
          <div className="space-y-4">
            {todayAgenda.map((item) => (
              <article
                key={`${item.id}-${item.eventDate}`}
                className="grid gap-4 rounded-[24px] border border-border bg-white px-4 py-4 sm:grid-cols-[88px_1fr_auto]"
              >
                <div className="rounded-2xl bg-accent-soft px-3 py-4 text-center text-accent">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                    Data
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {formatDate(item.eventDate)}
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold tracking-tight">{item.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {item.client.name}
                    {item.eventLocation ? ` - ${item.eventLocation}` : ''}
                  </p>
                </div>

                <div className="flex items-start justify-start sm:justify-end">
                  <span className="rounded-full border border-accent/20 bg-accent-soft px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    {getEventStatusLabel(item.status)}
                  </span>
                </div>
              </article>
            ))}

            {!isLoading && todayAgenda.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
                Nenhum evento marcado para hoje.
              </div>
            ) : null}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Atividade recente"
          title="Ultimos sinais do sistema"
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

            {!isLoading && recentActivity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-6 text-sm leading-6 text-muted">
                Ainda nao ha atividade suficiente para preencher esse bloco.
              </div>
            ) : null}
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardSection
          eyebrow="Proximos eventos"
          title="Agenda prioritaria"
          action="Ver eventos"
        >
          <div className="space-y-4">
            {nextEvents.map((event) => (
              <article
                key={`${event.id}-${event.eventDate}`}
                className="grid gap-4 rounded-[24px] border border-border bg-white px-4 py-4 lg:grid-cols-[84px_1fr_auto]"
              >
                <div className="rounded-2xl bg-[#f7efe8] px-3 py-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    Data
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    {formatDate(event.eventDate)}
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold tracking-tight">{event.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {event.client.name}
                    {event.eventLocation ? ` - ${event.eventLocation}` : ''}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <span className="rounded-full border border-accent/20 bg-accent-soft px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    {getEventStatusLabel(event.status)}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(event.finalPrice)}
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
                key={budget.id}
                className="rounded-[24px] border border-border bg-white px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold tracking-tight">
                      {budget.client.name}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {budget.guestCount} pessoas
                      {budget.eventLocation ? ` - ${budget.eventLocation}` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#f6ede7] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    {formatDate(budget.eventDate)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">
                  {formatCurrency(budget.estimatedPrice)}
                </p>
              </article>
            ))}
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardSection
          eyebrow="Resumo de custos"
          title="Composicao real do gasto"
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

            {!isLoading && costBreakdown.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
                Ainda nao existem custos suficientes para montar esse resumo.
              </div>
            ) : null}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Estoque"
          title="Itens que pedem atencao"
          action="Ver produtos"
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

            {!isLoading && stockAlerts.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
                Nenhum produto em alerta agora.
              </div>
            ) : null}
          </div>
        </DashboardSection>
      </div>
    </>
  );
}
