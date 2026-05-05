'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardSection } from '@/components/dashboard-section';
import { PageHeader } from '@/components/page-header';
import { api } from '@/lib/api';

type EventStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';

type ApiEvent = {
  id: string;
  title: string;
  eventDate: string;
  eventLocation: string | null;
  finalPrice: string;
  status: EventStatus;
  client: {
    id: string;
    name: string;
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

const quickCategories = [
  'ingredientes',
  'ajudante',
  'gasolina',
  'gas',
  'carvao',
  'descartaveis',
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

function getStatusTone(status: EventStatus) {
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

export function CostsPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [costs, setCosts] = useState<ApiCost[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [category, setCategory] = useState('ingredientes');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [spentAt, setSpentAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCostsData() {
      try {
        setIsLoading(true);
        setError(null);

        const [eventsData, costsData] = await Promise.all([
          api<ApiEvent[]>('/events'),
          api<ApiCost[]>('/costs'),
        ]);

        if (!isMounted) {
          return;
        }

        setEvents(eventsData);
        setCosts(costsData);
        setSelectedEventId((current) => current || eventsData[0]?.id || '');
      } catch (loadError) {
        if (isMounted) {
          setError('Nao foi possivel carregar os custos agora.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCostsData();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const totalCosts = costs.reduce((total, cost) => total + Number(cost.amount), 0);
    const eventIdsWithCosts = new Set(costs.map((cost) => cost.eventId));

    const topCategory =
      Object.entries(
        costs.reduce<Record<string, number>>((accumulator, cost) => {
          accumulator[cost.category] = (accumulator[cost.category] ?? 0) + Number(cost.amount);
          return accumulator;
        }, {}),
      ).sort((left, right) => right[1] - left[1])[0] ?? null;

    return [
      {
        label: 'Custos registrados',
        value: formatCurrency(totalCosts),
        note: 'Soma dos gastos ja lancados',
      },
      {
        label: 'Eventos com custo',
        value: String(eventIdsWithCosts.size),
        note: 'Eventos que ja entraram no radar operacional',
      },
      {
        label: 'Categoria mais pesada',
        value: topCategory ? topCategory[0] : 'Sem dados',
        note: topCategory ? formatCurrency(topCategory[1]) : 'Aguardando lancamentos',
      },
    ];
  }, [costs]);

  const filteredCosts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return costs;
    }

    return costs.filter((cost) =>
      [cost.category, cost.description, cost.event.client.name, cost.event.title]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [costs, search]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const selectedEventCosts = useMemo(
    () => costs.filter((cost) => cost.eventId === selectedEventId),
    [costs, selectedEventId],
  );

  async function handleCreateCost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEventId || !description.trim() || !amount.trim()) {
      setError('Escolha um evento, descreva o custo e informe o valor.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const createdCost = await api<ApiCost>('/costs', {
        method: 'POST',
        body: JSON.stringify({
          eventId: selectedEventId,
          category,
          description,
          amount,
          spentAt,
          notes: notes.trim() || undefined,
        }),
      });

      setCosts((current) => [createdCost, ...current]);
      setDescription('');
      setAmount('');
      setNotes('');
      setCategory('ingredientes');
    } catch (submitError) {
      setError('Nao foi possivel registrar esse custo agora.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Custos"
        title="Lancamento de gastos por evento"
        description="Essa area comeca a virar o lugar onde ele entende o quanto cada trabalho realmente consumiu em ingredientes, apoio e operacao."
        actions={['Lancar custo', 'Ver categorias', 'Revisar eventos']}
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

      <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <DashboardSection
          eyebrow="Novo custo"
          title={selectedEvent ? selectedEvent.title : 'Escolha um evento'}
          action="Operacao"
        >
          <form className="space-y-4" onSubmit={handleCreateCost}>
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

            <div className="flex flex-wrap gap-2">
              {quickCategories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    category === item
                      ? 'bg-accent text-white'
                      : 'border border-border bg-white text-muted'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Categoria
                </p>
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                />
              </label>

              <label className="block rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Valor
                </p>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Ex: 280"
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />
              </label>
            </div>

            <label className="block rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Descricao
              </p>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ex: compra de carne, pagamento do ajudante, combustivel..."
                className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              />
            </label>

            <label className="block rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Data do gasto
              </p>
              <input
                type="date"
                value={spentAt}
                onChange={(event) => setSpentAt(event.target.value)}
                className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
              />
            </label>

            <label className="block rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Observacoes
              </p>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Detalhes do gasto, fornecedor, combinados..."
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
                      Status
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${getStatusTone(
                        selectedEvent.status,
                      )}`}
                    >
                      {selectedEvent.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-[22px] border border-accent bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Salvando custo...' : 'Registrar custo'}
            </button>
          </form>
        </DashboardSection>

        <DashboardSection
          eyebrow="Historico de custos"
          title={isLoading ? 'Carregando custos...' : `${filteredCosts.length} custo(s) registrados`}
          action="Resumo"
        >
          <div className="mb-5 grid gap-4 lg:grid-cols-[1.1fr_auto]">
            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Buscar custo
              </p>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Categoria, descricao, cliente ou evento"
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
            {filteredCosts.map((cost) => (
              <article
                key={cost.id}
                className="rounded-[24px] border border-border bg-white px-4 py-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-lg font-semibold tracking-tight">
                        {cost.description}
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {cost.event.client.name} - {cost.event.title}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#f6ede7] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                        {cost.category}
                      </span>
                      <span className="rounded-full bg-[#eef2f8] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#395275]">
                        {formatDate(cost.spentAt)}
                      </span>
                    </div>

                    {cost.notes ? (
                      <p className="text-sm leading-6 text-muted">{cost.notes}</p>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Valor
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {formatCurrency(cost.amount)}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            {!isLoading && filteredCosts.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
                Nenhum custo registrado ainda.
              </div>
            ) : null}
          </div>
        </DashboardSection>
      </div>
    </>
  );
}
