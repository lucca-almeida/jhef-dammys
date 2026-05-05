'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { DashboardSection } from '@/components/dashboard-section';
import { PageHeader } from '@/components/page-header';
import { api } from '@/lib/api';

type EventStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
type PaymentType = 'DOWN_PAYMENT' | 'PARTIAL' | 'FINAL';
type PaymentMethod = 'PIX' | 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';

type ApiEvent = {
  id: string;
  title: string;
  eventDate: string;
  eventLocation: string | null;
  guestCount: number;
  finalPrice: string;
  downPayment: string | null;
  status: EventStatus;
  client: {
    id: string;
    name: string;
    phone: string;
  };
};

type ApiPayment = {
  id: string;
  eventId: string;
  type: PaymentType;
  method: PaymentMethod;
  amount: string;
  paidAt: string;
  notes: string | null;
  event: {
    id: string;
    title: string;
    eventDate: string;
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
  notes: string | null;
  event: {
    id: string;
    title: string;
    eventDate: string;
    client: {
      id: string;
      name: string;
    };
  };
};

type EventFinancialCard = {
  id: string;
  title: string;
  eventDate: string;
  eventLocation: string | null;
  clientName: string;
  status: EventStatus;
  finalPrice: number;
  downPayment: number;
  received: number;
  costs: number;
  outstanding: number;
  projectedProfit: number;
  currentCashResult: number;
};

const paymentTypeOptions: { value: PaymentType; label: string }[] = [
  { value: 'DOWN_PAYMENT', label: 'Sinal' },
  { value: 'PARTIAL', label: 'Parcial' },
  { value: 'FINAL', label: 'Final' },
];

const paymentMethodOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'PIX', label: 'Pix' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CARD', label: 'Cartao' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'OTHER', label: 'Outro' },
];

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
    year: 'numeric',
  }).format(new Date(value));
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

function getPaymentTypeLabel(type: PaymentType) {
  return paymentTypeOptions.find((option) => option.value === type)?.label ?? type;
}

function getPaymentMethodLabel(method: PaymentMethod) {
  return (
    paymentMethodOptions.find((option) => option.value === method)?.label ?? method
  );
}

export function FinancePage() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [costs, setCosts] = useState<ApiCost[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>('DOWN_PAYMENT');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preferredEventId = searchParams.get('eventId');

  function resetPaymentForm(nextEventId?: string) {
    setSelectedEventId(nextEventId ?? selectedEventId);
    setEditingPaymentId(null);
    setPaymentType('DOWN_PAYMENT');
    setPaymentMethod('PIX');
    setAmount('');
    setPaidAt(new Date().toISOString().slice(0, 10));
    setNotes('');
  }

  useEffect(() => {
    let isMounted = true;

    async function loadFinanceData() {
      try {
        setIsLoading(true);
        setError(null);

        const [eventsData, paymentsData, costsData] = await Promise.all([
          api<ApiEvent[]>('/events'),
          api<ApiPayment[]>('/payments'),
          api<ApiCost[]>('/costs'),
        ]);

        if (!isMounted) {
          return;
        }

        setEvents(eventsData);
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
          setError('Nao foi possivel carregar os dados do financeiro.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFinanceData();

    return () => {
      isMounted = false;
    };
  }, [preferredEventId]);

  const eventCards = useMemo<EventFinancialCard[]>(() => {
    return events.map((event) => {
      const received = payments
        .filter((payment) => payment.eventId === event.id)
        .reduce((total, payment) => total + Number(payment.amount), 0);
      const costsTotal = costs
        .filter((cost) => cost.eventId === event.id)
        .reduce((total, cost) => total + Number(cost.amount), 0);

      const finalPrice = Number(event.finalPrice);
      const downPayment = Number(event.downPayment ?? 0);

      return {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        eventLocation: event.eventLocation,
        clientName: event.client.name,
        status: event.status,
        finalPrice,
        downPayment,
        received,
        costs: costsTotal,
        outstanding: Math.max(finalPrice - received, 0),
        projectedProfit: finalPrice - costsTotal,
        currentCashResult: received - costsTotal,
      };
    });
  }, [costs, events, payments]);

  const filteredCards = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return eventCards;
    }

    return eventCards.filter((card) =>
      [card.title, card.clientName, card.eventLocation ?? '']
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [eventCards, search]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const selectedEventPayments = useMemo(
    () => payments.filter((payment) => payment.eventId === selectedEventId),
    [payments, selectedEventId],
  );

  const selectedEventCosts = useMemo(
    () => costs.filter((cost) => cost.eventId === selectedEventId),
    [costs, selectedEventId],
  );

  const summary = useMemo(() => {
    const expected = eventCards.reduce((total, event) => total + event.finalPrice, 0);
    const received = eventCards.reduce((total, event) => total + event.received, 0);
    const launchedCosts = eventCards.reduce((total, event) => total + event.costs, 0);
    const outstanding = Math.max(expected - received, 0);
    const projectedProfit = expected - launchedCosts;

    return [
      {
        label: 'Previsto em eventos',
        value: formatCurrency(expected),
        note: 'Soma do valor fechado dos eventos',
      },
      {
        label: 'Recebido registrado',
        value: formatCurrency(received),
        note: 'Pagamentos lancados no sistema',
      },
      {
        label: 'Custos lancados',
        value: formatCurrency(launchedCosts),
        note: 'Tudo que ja foi registrado como gasto',
      },
      {
        label: 'Lucro projetado',
        value: formatCurrency(projectedProfit),
        note: 'Valor fechado menos os custos ja lancados',
      },
      {
        label: 'Ainda falta receber',
        value: formatCurrency(outstanding),
        note: 'Saldo aberto considerando os eventos atuais',
      },
    ];
  }, [eventCards]);

  function handleEditPayment(payment: ApiPayment) {
    setSelectedEventId(payment.eventId);
    setEditingPaymentId(payment.id);
    setPaymentType(payment.type);
    setPaymentMethod(payment.method);
    setAmount(payment.amount);
    setPaidAt(payment.paidAt.slice(0, 10));
    setNotes(payment.notes ?? '');
  }

  async function handleSubmitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEventId || !amount.trim()) {
      setError('Escolha um evento e informe o valor recebido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const paymentPayload = {
        eventId: selectedEventId,
        type: paymentType,
        method: paymentMethod,
        amount,
        paidAt,
        notes: notes.trim() || undefined,
      };

      const savedPayment = await api<ApiPayment>(
        editingPaymentId ? `/payments/${editingPaymentId}` : '/payments',
        {
          method: editingPaymentId ? 'PATCH' : 'POST',
          body: JSON.stringify(paymentPayload),
        },
      );

      setPayments((current) =>
        editingPaymentId
          ? current.map((payment) =>
              payment.id === editingPaymentId ? savedPayment : payment,
            )
          : [savedPayment, ...current],
      );
      resetPaymentForm(selectedEventId);
    } catch (submitError) {
      setError(
        editingPaymentId
          ? 'Nao foi possivel atualizar esse pagamento agora.'
          : 'Nao foi possivel registrar esse pagamento agora.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Financeiro"
        title="Recebimentos, custos e resultado por evento"
        description="Essa area junta o que entrou, o que ja foi gasto e o quanto ainda falta receber para ele finalmente enxergar o resultado real de cada trabalho."
        actions={['Registrar recebimento', 'Ver pendencias', 'Filtrar quitados']}
      />

      <div className="grid gap-4 xl:grid-cols-4">
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

      <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <DashboardSection
          eyebrow="Novo pagamento"
          title={
            editingPaymentId
              ? 'Ajustar pagamento lancado'
              : selectedEvent
                ? selectedEvent.title
                : 'Escolha um evento'
          }
          action="Recebimentos"
        >
          <form className="space-y-4" onSubmit={handleSubmitPayment}>
            <label className="block rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Evento
              </p>
              <select
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
              >
                <option value="">Selecione um evento</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.client.name} - {event.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Tipo
                </p>
                <select
                  value={paymentType}
                  onChange={(event) => setPaymentType(event.target.value as PaymentType)}
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                >
                  {paymentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Forma de pagamento
                </p>
                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value as PaymentMethod)
                  }
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                >
                  {paymentMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Valor recebido
                </p>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Ex: 1200"
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />
              </label>

              <label className="block rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Data do pagamento
                </p>
                <input
                  type="date"
                  value={paidAt}
                  onChange={(event) => setPaidAt(event.target.value)}
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                />
              </label>
            </div>

            <label className="block rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Observacoes
              </p>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Pix do sinal, pagamento em duas partes, observacoes combinadas..."
                className="mt-2 w-full resize-none border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              />
            </label>

            {selectedEvent ? (
              <div className="rounded-[24px] border border-border bg-white px-4 py-4 text-sm text-muted">
                <p className="font-medium text-foreground">{selectedEvent.client.name}</p>
                <p className="mt-1 leading-6">
                  Evento em {formatDate(selectedEvent.eventDate)}
                  {selectedEvent.eventLocation
                    ? ` - ${selectedEvent.eventLocation}`
                    : ''}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Valor fechado
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {formatCurrency(selectedEvent.finalPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Sinal combinado
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {selectedEvent.downPayment
                        ? formatCurrency(selectedEvent.downPayment)
                        : 'Nao definido'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Ja registrado
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {formatCurrency(
                        selectedEventPayments.reduce(
                          (total, payment) => total + Number(payment.amount),
                          0,
                        ),
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Custos lancados
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {formatCurrency(
                        selectedEventCosts.reduce(
                          (total, cost) => total + Number(cost.amount),
                          0,
                        ),
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Resultado atual
                    </p>
                    <p
                      className={`mt-2 font-medium ${
                        selectedEventPayments.reduce(
                          (total, payment) => total + Number(payment.amount),
                          0,
                        ) -
                          selectedEventCosts.reduce(
                            (total, cost) => total + Number(cost.amount),
                            0,
                          ) >=
                        0
                          ? 'text-[#2d6a3a]'
                          : 'text-[#8f4242]'
                      }`}
                    >
                      {formatCurrency(
                        selectedEventPayments.reduce(
                          (total, payment) => total + Number(payment.amount),
                          0,
                        ) -
                          selectedEventCosts.reduce(
                            (total, cost) => total + Number(cost.amount),
                            0,
                          ),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-[22px] border border-accent bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? 'Salvando pagamento...'
                : editingPaymentId
                  ? 'Salvar alteracoes'
                  : 'Registrar pagamento'}
            </button>
            {editingPaymentId ? (
              <button
                type="button"
                onClick={() => resetPaymentForm(selectedEventId)}
                className="w-full rounded-[22px] border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40"
              >
                Cancelar edicao
              </button>
            ) : null}
          </form>
        </DashboardSection>

        <DashboardSection
          eyebrow="Resultado por evento"
          title={isLoading ? 'Carregando financeiro...' : `${filteredCards.length} evento(s) monitorados`}
          action="Resumo"
        >
          <div className="mb-5 grid gap-4 lg:grid-cols-[1.1fr_auto]">
            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Buscar evento
              </p>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cliente, evento ou local"
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

          {error ? (
            <div className="mb-4 rounded-[24px] border border-[#e4b7a0] bg-[#fff1e8] px-5 py-4 text-sm text-[#8a4c30]">
              {error}
            </div>
          ) : null}

          <div className="space-y-4">
            {filteredCards.map((card) => (
              <article
                key={card.id}
                className="rounded-[24px] border border-border bg-white px-4 py-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-lg font-semibold tracking-tight">
                        {card.title}
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {card.clientName}
                        {card.eventLocation ? ` - ${card.eventLocation}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${getEventStatusTone(
                          card.status,
                        )}`}
                      >
                        {getEventStatusLabel(card.status)}
                      </span>
                      <span className="rounded-full bg-[#eef2f8] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#395275]">
                        {formatDate(card.eventDate)}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-muted sm:grid-cols-6 lg:w-[760px] lg:text-right">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Valor fechado
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatCurrency(card.finalPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Sinal
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {card.downPayment > 0
                          ? formatCurrency(card.downPayment)
                          : 'Nao definido'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Recebido
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatCurrency(card.received)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Custos
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatCurrency(card.costs)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Falta receber
                      </p>
                      <p
                        className={`mt-2 font-medium ${
                          card.outstanding > 0 ? 'text-[#8a4c30]' : 'text-[#2d6a3a]'
                        }`}
                      >
                        {formatCurrency(card.outstanding)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Resultado atual
                      </p>
                      <p
                        className={`mt-2 font-medium ${
                          card.currentCashResult >= 0
                            ? 'text-[#2d6a3a]'
                            : 'text-[#8f4242]'
                        }`}
                      >
                        {formatCurrency(card.currentCashResult)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Lucro projetado
                      </p>
                      <p
                        className={`mt-2 font-medium ${
                          card.projectedProfit >= 0
                            ? 'text-[#2d6a3a]'
                            : 'text-[#8f4242]'
                        }`}
                      >
                        {formatCurrency(card.projectedProfit)}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {!isLoading && filteredCards.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
                Nenhum evento encontrado no financeiro ainda.
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded-[24px] border border-border bg-white px-4 py-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
              Ultimos pagamentos registrados
            </p>
            <div className="mt-4 space-y-3">
              {payments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-3 rounded-[20px] border border-border px-4 py-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {payment.event.client.name} - {payment.event.title}
                    </p>
                    <p className="mt-1 leading-6">
                      {getPaymentTypeLabel(payment.type)} via{' '}
                      {getPaymentMethodLabel(payment.method)} em{' '}
                      {formatDate(payment.paidAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleEditPayment(payment)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-accent/40"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}

              {!isLoading && payments.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                  Ainda nao ha pagamentos registrados. Assim que ele lancar o primeiro, a visao financeira comeca a ganhar forma.
                </div>
              ) : null}
            </div>
          </div>
        </DashboardSection>
      </div>
    </>
  );
}
