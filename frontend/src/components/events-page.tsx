'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardSection } from '@/components/dashboard-section';
import { PageHeader } from '@/components/page-header';

type EventStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
type BudgetStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'CANCELED';
type BudgetType = 'LABOR_ONLY' | 'FULL_SERVICE';

type ApiEvent = {
  id: string;
  title: string;
  eventDate: string;
  eventLocation: string | null;
  guestCount: number;
  budgetType: BudgetType;
  finalPrice: string;
  downPayment: string | null;
  status: EventStatus;
  notes: string | null;
  client: {
    id: string;
    name: string;
    phone: string;
  };
  budget: {
    id: string;
    status: BudgetStatus;
  } | null;
  _count: {
    items: number;
    payments: number;
    costs: number;
  };
};

type ApiBudget = {
  id: string;
  eventDate: string;
  eventLocation: string | null;
  guestCount: number;
  budgetType: BudgetType;
  estimatedPrice: string;
  downPayment: string | null;
  status: BudgetStatus;
  notes: string | null;
  client: {
    id: string;
    name: string;
    phone: string;
  };
  event: {
    id: string;
    status: EventStatus;
  } | null;
  _count: {
    items: number;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatCurrency(value: string | null) {
  if (!value) {
    return 'Nao definido';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
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

function getBudgetTypeLabel(type: BudgetType) {
  return type === 'FULL_SERVICE' ? 'Servico completo' : 'Mao de obra';
}

function getEventStatusTone(status: EventStatus) {
  if (status === 'COMPLETED') {
    return 'border-[#bfdfc5] bg-[#e8f4ea] text-[#2d6a3a]';
  }

  if (status === 'CONFIRMED') {
    return 'border-[#d9c0ae] bg-[#f7ede6] text-[#8b5636]';
  }

  if (status === 'CANCELED') {
    return 'border-[#e6c0c0] bg-[#f7e8e8] text-[#8f4242]';
  }

  return 'border-[#ccd7e8] bg-[#eef2f8] text-[#395275]';
}

export function EventsPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [budgets, setBudgets] = useState<ApiBudget[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConvertingId, setIsConvertingId] = useState<string | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);

        const [eventsData, budgetsData] = await Promise.all([
          api<ApiEvent[]>('/events'),
          api<ApiBudget[]>('/budgets'),
        ]);

        if (!isMounted) {
          return;
        }

        setEvents(eventsData);
        setBudgets(budgetsData);
      } catch (loadError) {
        if (isMounted) {
          setError('Nao foi possivel carregar eventos e orcamentos da API.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const budgetsReady = useMemo(
    () =>
      budgets.filter(
        (budget) =>
          !budget.event?.id &&
          budget.status !== 'REJECTED' &&
          budget.status !== 'CANCELED',
      ),
    [budgets],
  );

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return events;
    }

    return events.filter((event) =>
      [
        event.title,
        event.client.name,
        event.client.phone,
        event.eventLocation ?? '',
        getBudgetTypeLabel(event.budgetType),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [events, search]);

  const summary = useMemo(() => {
    const confirmed = events.filter((event) => event.status === 'CONFIRMED').length;
    const completed = events.filter((event) => event.status === 'COMPLETED').length;

    return [
      {
        label: 'Eventos na agenda',
        value: String(events.length),
        note: `${confirmed} confirmados e ${completed} concluidos`,
      },
      {
        label: 'Prontos para fechar',
        value: String(budgetsReady.length),
        note: 'Orcamentos que ja podem virar evento',
      },
      {
        label: 'Com cardapio definido',
        value: String(events.filter((event) => event._count.items > 0).length),
        note: 'Eventos que ja carregam itens do orcamento',
      },
    ];
  }, [budgetsReady.length, events]);

  async function handleConvertBudget(budget: ApiBudget) {
    try {
      setIsConvertingId(budget.id);
      setError(null);

      const createdEvent = await api<ApiEvent>(`/events/from-budget/${budget.id}`, {
        method: 'POST',
        body: JSON.stringify({
          title: `Evento ${budget.client.name}${budget.eventLocation ? ` - ${budget.eventLocation}` : ''}`,
        }),
      });

      setEvents((current) => {
        const next = [...current, createdEvent];
        return next.sort(
          (left, right) =>
            new Date(left.eventDate).getTime() - new Date(right.eventDate).getTime(),
        );
      });

      setBudgets((current) =>
        current.map((item) =>
          item.id === budget.id
            ? {
                ...item,
                status: 'APPROVED',
                event: {
                  id: createdEvent.id,
                  status: createdEvent.status,
                },
              }
            : item,
        ),
      );
    } catch (convertError) {
      setError('Nao foi possivel transformar o orcamento em evento agora.');
    } finally {
      setIsConvertingId(null);
    }
  }

  async function handleAdvanceStatus(event: ApiEvent) {
    const nextStatus: Record<EventStatus, EventStatus> = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'COMPLETED',
      COMPLETED: 'COMPLETED',
      CANCELED: 'CANCELED',
    };

    if (event.status === 'COMPLETED' || event.status === 'CANCELED') {
      return;
    }

    try {
      setIsUpdatingId(event.id);
      setError(null);

      const updatedEvent = await api<ApiEvent>(`/events/${event.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus[event.status],
        }),
      });

      setEvents((current) =>
        current.map((item) => (item.id === event.id ? updatedEvent : item)),
      );
    } catch (updateError) {
      setError('Nao foi possivel atualizar o status do evento.');
    } finally {
      setIsUpdatingId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Eventos"
        title="Operacao dos eventos fechados"
        description="Aqui a proposta comeca a virar entrega real: o orcamento aprovado entra na agenda, ganha status e passa a concentrar tudo que vai acontecer no evento."
        actions={['Ver agenda', 'Filtrar confirmados', 'Acompanhar proximos']}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {summary.map((item) => (
          <article
            key={item.label}
            className="rounded-[24px] border border-border bg-panel px-5 py-5 shadow-[0_18px_40px_rgba(102,66,46,0.08)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              {item.label}
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-tight">
              {item.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">{item.note}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardSection
          eyebrow="Orcamentos prontos"
          title={`${budgetsReady.length} proposta(s) esperando virar evento`}
          action="Fluxo comercial"
        >
          <div className="space-y-4">
            {budgetsReady.slice(0, 5).map((budget) => (
              <article
                key={budget.id}
                className="rounded-[24px] border border-border bg-white px-4 py-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold tracking-tight">
                      {budget.client.name}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {formatDate(budget.eventDate)}
                      {budget.eventLocation ? ` - ${budget.eventLocation}` : ''}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#f6ede7] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                        {getBudgetTypeLabel(budget.budgetType)}
                      </span>
                      <span className="rounded-full bg-[#eef2f8] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#395275]">
                        {budget._count.items} item(ns)
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-muted sm:grid-cols-3 lg:w-[320px] lg:text-right">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Pessoas
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {budget.guestCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Estimado
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatCurrency(budget.estimatedPrice)}
                      </p>
                    </div>
                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => void handleConvertBudget(budget)}
                        disabled={isConvertingId === budget.id}
                        className="rounded-full border border-accent bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isConvertingId === budget.id ? 'Fechando...' : 'Virar evento'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {!isLoading && budgetsReady.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
                Nenhum orcamento pronto para virar evento agora.
              </div>
            ) : null}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Eventos ativos"
          title={isLoading ? 'Carregando agenda...' : `${filteredEvents.length} evento(s) na base`}
          action="Atualizado pela API"
        >
          <div className="mb-5 grid gap-4 lg:grid-cols-[1.1fr_auto]">
            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Buscar evento
              </p>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cliente, titulo, local ou tipo"
                className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              />
            </label>

            <button
              type="button"
              onClick={() => setSearch('')}
              className="rounded-[22px] border border-accent bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-95"
            >
              Limpar
            </button>
          </div>

          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-[24px] border border-border bg-white px-4 py-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-lg font-semibold tracking-tight">
                        {event.title}
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {event.client.name}
                        {event.eventLocation ? ` - ${event.eventLocation}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#f6ede7] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                        {getBudgetTypeLabel(event.budgetType)}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${getEventStatusTone(
                          event.status,
                        )}`}
                      >
                        {getEventStatusLabel(event.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-muted sm:grid-cols-5 lg:w-[560px] lg:text-right">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Data
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatDate(event.eventDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Pessoas
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {event.guestCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Valor
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatCurrency(event.finalPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Itens
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {event._count.items}
                      </p>
                    </div>
                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => void handleAdvanceStatus(event)}
                        disabled={
                          isUpdatingId === event.id ||
                          event.status === 'COMPLETED' ||
                          event.status === 'CANCELED'
                        }
                        className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdatingId === event.id
                          ? 'Atualizando...'
                          : event.status === 'PENDING'
                            ? 'Confirmar'
                            : event.status === 'CONFIRMED'
                              ? 'Concluir'
                              : 'Fechado'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {!isLoading && filteredEvents.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
                Nenhum evento fechado ainda. Converta um orcamento e ele aparece aqui.
              </div>
            ) : null}
          </div>
        </DashboardSection>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-[#e4b7a0] bg-[#fff1e8] px-5 py-4 text-sm text-[#8a4c30]">
          {error}
        </div>
      ) : null}
    </>
  );
}
