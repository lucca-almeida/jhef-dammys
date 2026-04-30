'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardSection } from '@/components/dashboard-section';
import { PageHeader } from '@/components/page-header';

type ApiClient = {
  id: string;
  name: string;
  phone: string;
  instagram: string | null;
  _count: {
    budgets: number;
    events: number;
  };
};

type BudgetType = 'LABOR_ONLY' | 'FULL_SERVICE';

type BudgetStatus =
  | 'DRAFT'
  | 'SENT'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELED';

type ApiBudget = {
  id: string;
  clientId: string;
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
  _count: {
    items: number;
  };
};

type BudgetForm = {
  clientId: string;
  eventDate: string;
  eventLocation: string;
  guestCount: string;
  budgetType: BudgetType;
  estimatedPrice: string;
  downPayment: string;
  notes: string;
};

const initialForm: BudgetForm = {
  clientId: '',
  eventDate: '',
  eventLocation: '',
  guestCount: '',
  budgetType: 'FULL_SERVICE',
  estimatedPrice: '',
  downPayment: '',
  notes: '',
};

const serviceNotes = [
  'Mao de obra: quando o cliente fornece os materiais.',
  'Servico completo: quando o custo do mercado entra na conta.',
  'Deixar sinal registrado ajuda a separar proposta de evento quase fechado.',
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function getBudgetTypeLabel(type: BudgetType) {
  return type === 'FULL_SERVICE' ? 'Servico completo' : 'Mao de obra';
}

function getBudgetStatusLabel(status: BudgetStatus) {
  const labels: Record<BudgetStatus, string> = {
    DRAFT: 'Rascunho',
    SENT: 'Enviado',
    APPROVED: 'Aprovado',
    REJECTED: 'Recusado',
    CANCELED: 'Cancelado',
  };

  return labels[status];
}

function getBudgetStatusTone(status: BudgetStatus) {
  if (status === 'APPROVED') {
    return 'bg-[#e8f4ea] text-[#2d6a3a] border-[#bfdfc5]';
  }

  if (status === 'SENT') {
    return 'bg-accent-soft text-accent border-accent/20';
  }

  if (status === 'REJECTED' || status === 'CANCELED') {
    return 'bg-[#f7e8e8] text-[#8f4242] border-[#e6c0c0]';
  }

  return 'bg-[#eef2f8] text-[#395275] border-[#ccd7e8]';
}

export function BudgetsPage() {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [budgets, setBudgets] = useState<ApiBudget[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<BudgetForm>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);

        const [clientsData, budgetsData] = await Promise.all([
          api<ApiClient[]>('/clients'),
          api<ApiBudget[]>('/budgets'),
        ]);

        if (!isMounted) {
          return;
        }

        setClients(clientsData);
        setBudgets(budgetsData);
        setForm((current) => ({
          ...current,
          clientId: current.clientId || clientsData[0]?.id || '',
        }));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError('Nao foi possivel carregar clientes e orcamentos da API.');
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

  const filteredBudgets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return budgets;
    }

    return budgets.filter((budget) =>
      [
        budget.client.name,
        budget.client.phone,
        budget.eventLocation ?? '',
        getBudgetTypeLabel(budget.budgetType),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [budgets, search]);

  const summary = useMemo(() => {
    const total = budgets.length;
    const approved = budgets.filter((budget) => budget.status === 'APPROVED').length;
    const sent = budgets.filter((budget) => budget.status === 'SENT').length;
    const fullService = budgets.filter(
      (budget) => budget.budgetType === 'FULL_SERVICE',
    ).length;

    return [
      {
        label: 'Orcamentos na base',
        value: String(total),
        note: `${approved} aprovados ate agora`,
      },
      {
        label: 'Aguardando retorno',
        value: String(sent),
        note: 'Propostas enviadas ao cliente',
      },
      {
        label: 'Servico completo',
        value: String(fullService),
        note: 'Pedidos que exigem custo real de material',
      },
    ];
  }, [budgets]);

  async function handleCreateBudget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const createdBudget = await api<ApiBudget>('/budgets', {
        method: 'POST',
        body: JSON.stringify({
          clientId: form.clientId,
          eventDate: form.eventDate,
          eventLocation: form.eventLocation || undefined,
          guestCount: Number(form.guestCount),
          budgetType: form.budgetType,
          estimatedPrice: form.estimatedPrice,
          downPayment: form.downPayment || undefined,
          notes: form.notes || undefined,
        }),
      });

      setBudgets((current) => [createdBudget, ...current]);
      setForm((current) => ({
        ...initialForm,
        clientId: current.clientId,
        budgetType: 'FULL_SERVICE',
      }));
    } catch (submitError) {
      setError('Nao foi possivel criar o orcamento agora.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Orcamentos"
        title="Funil de negociacao e propostas"
        description="Aqui vamos registrar pedidos, montar propostas iniciais e acompanhar quem ainda precisa de retorno antes de virar evento."
        actions={['Novo orcamento', 'Ver aprovados', 'Exportar lista']}
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

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardSection
          eyebrow="Novo orcamento"
          title="Cadastro inicial da proposta"
        >
          <form className="grid gap-4" onSubmit={handleCreateBudget}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Cliente
                </p>
                <select
                  value={form.clientId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, clientId: event.target.value }))
                  }
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                >
                  <option value="">Selecione</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Data do evento
                </p>
                <input
                  type="date"
                  required
                  value={form.eventDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, eventDate: event.target.value }))
                  }
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Quantidade de pessoas
                </p>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.guestCount}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, guestCount: event.target.value }))
                  }
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                />
              </label>

              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Tipo
                </p>
                <select
                  value={form.budgetType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      budgetType: event.target.value as BudgetType,
                    }))
                  }
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                >
                  <option value="FULL_SERVICE">Servico completo</option>
                  <option value="LABOR_ONLY">Mao de obra</option>
                </select>
              </label>
            </div>

            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Local do evento
              </p>
              <input
                value={form.eventLocation}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    eventLocation: event.target.value,
                  }))
                }
                className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Valor estimado
                </p>
                <input
                  required
                  value={form.estimatedPrice}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      estimatedPrice: event.target.value,
                    }))
                  }
                  placeholder="Ex: 3500.00"
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />
              </label>

              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Sinal previsto
                </p>
                <input
                  value={form.downPayment}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      downPayment: event.target.value,
                    }))
                  }
                  placeholder="Ex: 800.00"
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />
              </label>
            </div>

            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Observacoes
              </p>
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                rows={3}
                className="mt-2 w-full resize-none border-0 bg-transparent text-sm text-foreground outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !form.clientId}
              className="rounded-[22px] border border-accent bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar orcamento'}
            </button>
          </form>
        </DashboardSection>

        <DashboardSection eyebrow="Regras importantes" title="Como pensar o orçamento">
          <div className="space-y-3">
            {serviceNotes.map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-border bg-white px-4 py-4 text-sm leading-6 text-muted"
              >
                {note}
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-[#e4b7a0] bg-[#fff1e8] px-5 py-4 text-sm text-[#8a4c30]">
          {error}
        </div>
      ) : null}

      <DashboardSection
        eyebrow="Lista de orcamentos"
        title={isLoading ? 'Carregando propostas...' : `${filteredBudgets.length} proposta(s) na base`}
        action="Atualizado pela API"
      >
        <div className="mb-5 grid gap-4 lg:grid-cols-[1.1fr_auto]">
          <label className="rounded-[22px] border border-border bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Buscar proposta
            </p>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cliente, telefone, tipo ou local"
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
          {isLoading ? (
            <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
              Buscando orcamentos e clientes no backend...
            </div>
          ) : null}

          {!isLoading &&
            filteredBudgets.map((budget) => (
              <article
                key={budget.id}
                className="rounded-[24px] border border-border bg-white px-4 py-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-lg font-semibold tracking-tight">
                        {budget.client.name}
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {budget.client.phone}
                        {budget.eventLocation ? ` - ${budget.eventLocation}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#f6ede7] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                        {getBudgetTypeLabel(budget.budgetType)}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${getBudgetStatusTone(
                          budget.status,
                        )}`}
                      >
                        {getBudgetStatusLabel(budget.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-muted sm:grid-cols-4 lg:w-[440px] lg:text-right">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Data
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatDate(budget.eventDate)}
                      </p>
                    </div>
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
                        R$ {budget.estimatedPrice}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Itens
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {budget._count.items}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}

          {!isLoading && filteredBudgets.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
              Nenhum orcamento encontrado ainda. Crie a primeira proposta pelo
              formulario acima.
            </div>
          ) : null}
        </div>
      </DashboardSection>
    </>
  );
}
