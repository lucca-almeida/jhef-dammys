'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

type ApiPayment = {
  id: string;
  eventId: string;
  amount: string;
};

type ApiCost = {
  id: string;
  eventId: string;
  amount: string;
};

type EventDetail = ApiEvent & {
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string | null;
    notes: string | null;
    service: {
      id: string;
      name: string;
    };
  }>;
  payments: Array<{
    id: string;
    type: 'DOWN_PAYMENT' | 'PARTIAL' | 'FINAL';
    method: 'PIX' | 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
    amount: string;
    paidAt: string;
    notes: string | null;
  }>;
  costs: Array<{
    id: string;
    category: string;
    description: string;
    amount: string;
    spentAt: string;
    notes: string | null;
  }>;
};

type EventCard = ApiEvent & {
  received: number;
  costs: number;
  outstanding: number;
  projectedProfit: number;
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
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [budgets, setBudgets] = useState<ApiBudget[]>([]);
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [costs, setCosts] = useState<ApiCost[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventDetails, setSelectedEventDetails] = useState<EventDetail | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isConvertingId, setIsConvertingId] = useState<string | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preferredEventId = searchParams.get('eventId');

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);

        const [eventsData, budgetsData, paymentsData, costsData] = await Promise.all([
          api<ApiEvent[]>('/events'),
          api<ApiBudget[]>('/budgets'),
          api<ApiPayment[]>('/payments'),
          api<ApiCost[]>('/costs'),
        ]);

        if (!isMounted) {
          return;
        }

        setEvents(eventsData);
        setBudgets(budgetsData);
        setPayments(paymentsData);
        setCosts(costsData);
        setSelectedEventId((current) => {
          if (
            preferredEventId &&
            eventsData.some((event) => event.id === preferredEventId)
          ) {
            return preferredEventId;
          }

          return current || eventsData[0]?.id || '';
        });
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
  }, [preferredEventId]);

  useEffect(() => {
    let isMounted = true;

    async function loadEventDetails() {
      if (!selectedEventId) {
        setSelectedEventDetails(null);
        return;
      }

      try {
        setIsLoadingDetails(true);
        const detail = await api<EventDetail>(`/events/${selectedEventId}`);

        if (!isMounted) {
          return;
        }

        setSelectedEventDetails(detail);
      } catch (loadError) {
        if (isMounted) {
          setError('Nao foi possivel carregar os detalhes do evento selecionado.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      }
    }

    void loadEventDetails();

    return () => {
      isMounted = false;
    };
  }, [selectedEventId]);

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
    const enrichedEvents: EventCard[] = events.map((event) => {
      const received = payments
        .filter((payment) => payment.eventId === event.id)
        .reduce((total, payment) => total + Number(payment.amount), 0);

      const eventCosts = costs
        .filter((costItem) => costItem.eventId === event.id)
        .reduce((total, costItem) => total + Number(costItem.amount), 0);

      const finalPrice = Number(event.finalPrice);

      return {
        ...event,
        received,
        costs: eventCosts,
        outstanding: Math.max(finalPrice - received, 0),
        projectedProfit: finalPrice - eventCosts,
      };
    });

    const activeEvents = enrichedEvents.filter(
      (event) =>
        event.status === 'PENDING' ||
        event.status === 'CONFIRMED',
    );

    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return activeEvents;
    }

    return activeEvents.filter((event) =>
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
  }, [costs, events, payments, search]);

  const summary = useMemo(() => {
    const confirmed = events.filter((event) => event.status === 'CONFIRMED').length;
    const completed = events.filter((event) => event.status === 'COMPLETED').length;
    const totalProjectedProfit = filteredEvents.reduce(
      (total, event) => total + event.projectedProfit,
      0,
    );

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
      {
        label: 'Lucro projetado',
        value: formatCurrency(totalProjectedProfit.toFixed(2)),
        note: 'Valor fechado menos os custos ja lancados',
      },
    ];
  }, [budgetsReady.length, events, filteredEvents]);

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
      setSelectedEventId(createdEvent.id);

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
      setSelectedEventDetails((current) => {
        if (!current || current.id !== event.id) {
          return current;
        }

        if (updatedEvent.status === 'COMPLETED' ||
          updatedEvent.status === 'CANCELED'
        ) {
          return null;
        }
        return {
          ...current,
          ...updatedEvent,
        };
      });
    } catch (updateError) {
      setError('Nao foi possivel atualizar o status do evento.');
    } finally {
      setIsUpdatingId(null);
    }
  }

  const selectedEventMetrics = useMemo(() => {
    if (!selectedEventDetails) {
      return null;
    }

    const received = selectedEventDetails.payments.reduce(
      (total, payment) => total + Number(payment.amount),
      0,
    );
    const eventCosts = selectedEventDetails.costs.reduce(
      (total, costItem) => total + Number(costItem.amount),
      0,
    );
    const finalPrice = Number(selectedEventDetails.finalPrice);

    return {
      received,
      eventCosts,
      outstanding: Math.max(finalPrice - received, 0),
      projectedProfit: finalPrice - eventCosts,
      currentResult: received - eventCosts,
    };
  }, [selectedEventDetails]);

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

      <div className="grid gap-6 xl:grid-cols-[0,0.9fr)_minmax(0,1.1fr)]">
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
                <div className="flex flex-col gap-4 ">
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
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
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
                className={`rounded-[24px] border bg-white px-4 py-4 transition ${selectedEventId === event.id
                  ? 'border-accent shadow-[0_20px_40px_rgba(102,66,46,0.08)]'
                  : 'border-border'
                  }`}
              >
                <div className="flex flex-col gap-4 ">
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
                      <button
                        type="button"
                        onClick={() => setSelectedEventId(event.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${selectedEventId === event.id
                          ? 'border-accent bg-accent text-white'
                          : 'border-border bg-white text-foreground hover:border-accent/40'
                          }`}
                      >
                        Detalhes
                      </button>
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

                  <div className="grid gap-3 text-sm text-muted sm:grid-cols-7 lg:w-[840px] lg:text-right">
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
                        Recebido
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatCurrency(event.received.toFixed(2))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Custos
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatCurrency(event.costs.toFixed(2))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Lucro proj.
                      </p>
                      <p
                        className={`mt-2 font-medium ${event.projectedProfit >= 0 ? 'text-[#2d6a3a]' : 'text-[#8f4242]'
                          }`}
                      >
                        {formatCurrency(event.projectedProfit.toFixed(2))}
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
                          event.status === 'CANCELED' ||
                          new Date(event.eventDate) > new Date()
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
        
        {selectedEventDetails &&
          selectedEventDetails.status !== 'COMPLETED' &&
          selectedEventDetails.status !== 'CANCELED' && (

          
        <DashboardSection
          eyebrow="Painel do evento"

          title= {selectedEventDetails.title}
          
          action= "Visão Completa"
        >
          {isLoadingDetails ? (
            <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
              Carregando detalhes do evento...
            </div>
          ) : null}

          {!isLoadingDetails && !selectedEventDetails ? (
            <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
              Escolha um evento da lista para ver cardapio, pagamentos, custos e resultado.
            </div>
          ) : null}

          {selectedEventMetrics ? (
            <div className="space-y-5">
              <div className="rounded-[24px] border border-border bg-white px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold tracking-tight text-foreground">
                      {selectedEventDetails.client.name}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {formatDate(selectedEventDetails.eventDate)}
                      {selectedEventDetails.eventLocation
                        ? ` - ${selectedEventDetails.eventLocation}`
                        : ''}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${getEventStatusTone(
                      selectedEventDetails.status,
                    )}`}
                  >
                    {getEventStatusLabel(selectedEventDetails.status)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Valor fechado
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {formatCurrency(selectedEventDetails.finalPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Pessoas
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {selectedEventDetails.guestCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Recebido
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {formatCurrency(selectedEventMetrics.received.toFixed(2))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Custos lancados
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {formatCurrency(selectedEventMetrics.eventCosts.toFixed(2))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Falta receber
                    </p>
                    <p className="mt-2 font-medium text-[#8a4c30]">
                      {formatCurrency(selectedEventMetrics.outstanding.toFixed(2))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Resultado atual
                    </p>
                    <p
                      className={`mt-2 font-medium ${selectedEventMetrics.currentResult >= 0
                        ? 'text-[#2d6a3a]'
                        : 'text-[#8f4242]'
                        }`}
                    >
                      {formatCurrency(selectedEventMetrics.currentResult.toFixed(2))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Cardapio do evento
                </p>
                <div className="mt-3 space-y-3">
                  {selectedEventDetails.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[18px] border border-border px-4 py-3 text-sm text-muted"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {item.service.name}
                          </p>
                          {item.notes ? (
                            <p className="mt-1 leading-6">{item.notes}</p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {item.quantity}x
                          </p>
                          <p className="mt-1 text-xs">
                            {item.unitPrice
                              ? formatCurrency(item.unitPrice)
                              : 'Valor nao definido'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedEventDetails.items.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                      Esse evento ainda nao tem itens detalhados.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-[24px] border border-border bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Pagamentos
                    </p>
                    <Link
                      href={`/financeiro?eventId=${selectedEventDetails.id}`}
                      className="rounded-full border border-accent/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent transition hover:border-accent"
                    >
                      Lancar no financeiro
                    </Link>
                  </div>
                  <div className="mt-3 space-y-3">
                    {selectedEventDetails.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-[18px] border border-border px-4 py-3 text-sm text-muted"
                      >
                        <p className="font-medium text-foreground">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="mt-1 leading-6">
                          {payment.type} via {payment.method} em {formatDate(payment.paidAt)}
                        </p>
                      </div>
                    ))}

                    {selectedEventDetails.payments.length === 0 ? (
                      <div className="rounded-[18px] border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                        Nenhum pagamento registrado ainda.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[24px] border border-border bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Custos
                    </p>
                    <Link
                      href={`/custos?eventId=${selectedEventDetails.id}`}
                      className="rounded-full border border-accent/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent transition hover:border-accent"
                    >
                      Lancar em custos
                    </Link>
                  </div>
                  <div className="mt-3 space-y-3">
                    {selectedEventDetails.costs.map((costItem) => (
                      <div
                        key={costItem.id}
                        className="rounded-[18px] border border-border px-4 py-3 text-sm text-muted"
                      >
                        <p className="font-medium text-foreground">
                          {costItem.description}
                        </p>
                        <p className="mt-1 leading-6">
                          {costItem.category} - {formatCurrency(costItem.amount)} em{' '}
                          {formatDate(costItem.spentAt)}
                        </p>
                      </div>
                    ))}

                    {selectedEventDetails.costs.length === 0 ? (
                      <div className="rounded-[18px] border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                        Nenhum custo registrado ainda.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DashboardSection>
      )}

      </div>

      {error ? (
        <div className="rounded-[24px] border border-[#e4b7a0] bg-[#fff1e8] px-5 py-4 text-sm text-[#8a4c30]">
          {error}
        </div>
      ) : null}
    </>
  );
}
