'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

type ApiService = {
  id: string;
  name: string;
  description: string | null;
  basePrice: string | null;
  isActive: boolean;
  estimatedCostPerPerson: string | null;
  recipeItems?: Array<{
    id: string;
    quantityPerPerson: string;
    notes: string | null;
    product: {
      id: string;
      name: string;
      unit: string;
      currentCost: string;
    };
  }>;
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
  event: {
    id: string;
    status: string;
  } | null;
  _count: {
    items: number;
  };
};

type ApiBudgetDetail = ApiBudget & {
  items: Array<{
    id: string;
    serviceId: string;
    quantity: number;
    unitPrice: string | null;
    notes: string | null;
    service: {
      id: string;
      name: string;
    };
  }>;
};

type ApiCreatedEvent = {
  id: string;
  status: string;
};

type BudgetFormItem = {
  serviceId: string;
  quantity: string;
  unitPrice: string;
  notes: string;
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
  items: BudgetFormItem[];
};

const createEmptyItem = (): BudgetFormItem => ({
  serviceId: '',
  quantity: '1',
  unitPrice: '',
  notes: '',
});

const initialForm: BudgetForm = {
  clientId: '',
  eventDate: '',
  eventLocation: '',
  guestCount: '',
  budgetType: 'FULL_SERVICE',
  estimatedPrice: '',
  downPayment: '',
  notes: '',
  items: [createEmptyItem()],
};

const serviceNotes = [
  'Mao de obra: quando o cliente fornece os materiais.',
  'Servico completo: quando o custo do mercado entra na conta.',
  'Deixar os itens no orcamento ajuda a proposta a virar evento sem retrabalho.',
];

type IngredientBreakdownItem = {
  productId: string;
  name: string;
  unit: string;
  currentCost: number;
  totalQuantity: number;
  totalCost: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function formatCurrency(value: number | string | null) {
  if (value === null || value === '') {
    return 'Nao definido';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
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
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [budgets, setBudgets] = useState<ApiBudget[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<BudgetForm>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);
  const [isEditingBudgetId, setIsEditingBudgetId] = useState<string | null>(null);
  const [isLoadingBudgetId, setIsLoadingBudgetId] = useState<string | null>(null);
  const [isConvertingBudgetId, setIsConvertingBudgetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAutoEstimate, setLastAutoEstimate] = useState('');
  const [operationalExtra, setOperationalExtra] = useState('0');
  const [desiredMarginPercent, setDesiredMarginPercent] = useState('0');
  const preferredClientId = searchParams.get('clientId');

  function getPreferredClientId(options?: {
    clientsList?: ApiClient[];
    fallbackClientId?: string;
  }) {
    const clientsList = options?.clientsList ?? clients;

    if (
      preferredClientId &&
      clientsList.some((client) => client.id === preferredClientId)
    ) {
      return preferredClientId;
    }

    if (
      options?.fallbackClientId &&
      clientsList.some((client) => client.id === options.fallbackClientId)
    ) {
      return options.fallbackClientId;
    }

    return clientsList[0]?.id ?? '';
  }

  function resetBudgetForm(fallbackClientId?: string) {
    setForm({
      ...initialForm,
      clientId: getPreferredClientId({ fallbackClientId }),
      budgetType: 'FULL_SERVICE',
      items: [createEmptyItem()],
    });
    setIsEditingBudgetId(null);
    setLastAutoEstimate('');
    setOperationalExtra('0');
    setDesiredMarginPercent('0');
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);

        const [clientsData, budgetsData, servicesData] = await Promise.all([
          api<ApiClient[]>('/clients'),
          api<ApiBudget[]>('/budgets'),
          api<ApiService[]>('/services?onlyActive=true'),
        ]);

        if (!isMounted) {
          return;
        }

        setClients(clientsData);
        setBudgets(budgetsData);
        setServices(servicesData);
        setForm((current) => {
          const nextClientId =
            current.clientId ||
            getPreferredClientId({
              clientsList: clientsData,
            });

          if (current.clientId === nextClientId) {
            return current;
          }

          return {
            ...current,
            clientId: nextClientId,
          };
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError('Nao foi possivel carregar clientes, servicos e orcamentos da API.');
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
  }, [preferredClientId]);

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
    const withItems = budgets.filter((budget) => budget._count.items > 0).length;

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
        label: 'Com itens definidos',
        value: String(withItems),
        note: 'Propostas que ja tem cardapio montado',
      },
    ];
  }, [budgets]);

  const activeServices = useMemo(
    () => services.filter((service) => service.isActive),
    [services],
  );

  const ingredientCostEstimate = useMemo(() => {
    const guestCount = Number(form.guestCount);

    if (!guestCount || guestCount <= 0 || form.budgetType !== 'FULL_SERVICE') {
      return 0;
    }

    return form.items.reduce((sum, item) => {
      const service = activeServices.find(
        (serviceOption) => serviceOption.id === item.serviceId,
      );

      if (!service?.estimatedCostPerPerson) {
        return sum;
      }

      const quantity = Number(item.quantity) || 1;
      return sum + Number(service.estimatedCostPerPerson) * guestCount * quantity;
    }, 0);
  }, [activeServices, form.budgetType, form.guestCount, form.items]);

  const ingredientBreakdown = useMemo<IngredientBreakdownItem[]>(() => {
    const guestCount = Number(form.guestCount);

    if (!guestCount || guestCount <= 0 || form.budgetType !== 'FULL_SERVICE') {
      return [];
    }

    const breakdownMap = new Map<string, IngredientBreakdownItem>();

    form.items.forEach((item) => {
      if (!item.serviceId) {
        return;
      }

      const service = activeServices.find(
        (serviceOption) => serviceOption.id === item.serviceId,
      );

      if (!service?.recipeItems?.length) {
        return;
      }

      const itemQuantity = Number(item.quantity) || 1;

      service.recipeItems.forEach((recipeItem) => {
        const quantityPerPerson = Number(recipeItem.quantityPerPerson);
        const currentCost = Number(recipeItem.product.currentCost);
        const totalQuantity = quantityPerPerson * guestCount * itemQuantity;
        const totalCost = totalQuantity * currentCost;
        const existing = breakdownMap.get(recipeItem.product.id);

        if (existing) {
          existing.totalQuantity += totalQuantity;
          existing.totalCost += totalCost;
          return;
        }

        breakdownMap.set(recipeItem.product.id, {
          productId: recipeItem.product.id,
          name: recipeItem.product.name,
          unit: recipeItem.product.unit,
          currentCost,
          totalQuantity,
          totalCost,
        });
      });
    });

    return Array.from(breakdownMap.values()).sort(
      (left, right) => right.totalCost - left.totalCost,
    );
  }, [activeServices, form.budgetType, form.guestCount, form.items]);

  const servicesWithoutRecipeCount = useMemo(
    () =>
      form.items.filter((item) => {
        if (!item.serviceId) {
          return false;
        }

        const service = activeServices.find(
          (serviceOption) => serviceOption.id === item.serviceId,
        );

        return !service?.estimatedCostPerPerson;
      }).length,
    [activeServices, form.items],
  );

  const currentEstimatedPrice = Number(form.estimatedPrice || 0);
  const operationalExtraValue = Number(operationalExtra || 0);
  const desiredMarginValue = Number(desiredMarginPercent || 0);
  const suggestedQuoteValue = useMemo(() => {
    if (form.budgetType !== 'FULL_SERVICE') {
      return 0;
    }

    const subtotal = ingredientCostEstimate + operationalExtraValue;

    if (subtotal <= 0) {
      return 0;
    }

    return subtotal * (1 + desiredMarginValue / 100);
  }, [
    desiredMarginValue,
    form.budgetType,
    ingredientCostEstimate,
    operationalExtraValue,
  ]);
  const estimatedMargin =
    form.budgetType === 'FULL_SERVICE'
      ? currentEstimatedPrice - ingredientCostEstimate - operationalExtraValue
      : 0;

  useEffect(() => {
    if (form.budgetType !== 'FULL_SERVICE') {
      return;
    }

    if (!suggestedQuoteValue) {
      return;
    }

    const nextValue = suggestedQuoteValue.toFixed(2);

    setForm((current) => {
      if (
        current.estimatedPrice &&
        current.estimatedPrice !== lastAutoEstimate
      ) {
        return current;
      }

      if (current.estimatedPrice === nextValue) {
        return current;
      }

      return {
        ...current,
        estimatedPrice: nextValue,
      };
    });

    setLastAutoEstimate(nextValue);
  }, [form.budgetType, lastAutoEstimate, suggestedQuoteValue]);

  function updateFormItem(
    index: number,
    field: keyof BudgetFormItem,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addFormItem() {
    setForm((current) => ({
      ...current,
      items: [...current.items, createEmptyItem()],
    }));
  }

  function removeFormItem(index: number) {
    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? [createEmptyItem()]
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleEditBudget(budgetId: string) {
    try {
      setIsLoadingBudgetId(budgetId);
      setError(null);

      const budget = await api<ApiBudgetDetail>(`/budgets/${budgetId}`);

      setForm({
        clientId: budget.clientId,
        eventDate: budget.eventDate.split('T')[0] ?? '',
        eventLocation: budget.eventLocation ?? '',
        guestCount: String(budget.guestCount),
        budgetType: budget.budgetType,
        estimatedPrice: budget.estimatedPrice,
        downPayment: budget.downPayment ?? '',
        notes: budget.notes ?? '',
        items: budget.items.length
          ? budget.items.map((item) => ({
              serviceId: item.serviceId,
              quantity: String(item.quantity),
              unitPrice: item.unitPrice ?? '',
              notes: item.notes ?? '',
            }))
          : [createEmptyItem()],
      });
      setIsEditingBudgetId(budget.id);
      setLastAutoEstimate('');
      setOperationalExtra('0');
      setDesiredMarginPercent('0');
    } catch (loadError) {
      setError('Nao foi possivel abrir esse orcamento para edicao agora.');
    } finally {
      setIsLoadingBudgetId(null);
    }
  }

  async function handleSubmitBudget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const normalizedItems = form.items
        .filter((item) => item.serviceId)
        .map((item) => ({
          serviceId: item.serviceId,
          quantity: Number(item.quantity) || 1,
          unitPrice: item.unitPrice || undefined,
          notes: item.notes || undefined,
        }));

      const budgetPayload = {
        clientId: form.clientId,
        eventDate: form.eventDate,
        eventLocation: form.eventLocation || undefined,
        guestCount: Number(form.guestCount),
        budgetType: form.budgetType,
        estimatedPrice: form.estimatedPrice,
        downPayment: form.downPayment || undefined,
        notes: form.notes || undefined,
        items: normalizedItems,
      };

      const savedBudget = await api<ApiBudget>(
        isEditingBudgetId ? `/budgets/${isEditingBudgetId}` : '/budgets',
        {
          method: isEditingBudgetId ? 'PATCH' : 'POST',
          body: JSON.stringify(budgetPayload),
        },
      );

      setBudgets((current) =>
        isEditingBudgetId
          ? current.map((budget) =>
              budget.id === isEditingBudgetId ? savedBudget : budget,
            )
          : [savedBudget, ...current],
      );
      resetBudgetForm(form.clientId);
    } catch (submitError) {
      setError(
        isEditingBudgetId
          ? 'Nao foi possivel atualizar o orcamento agora.'
          : 'Nao foi possivel criar o orcamento agora.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateBudgetStatus(
    budgetId: string,
    status: BudgetStatus,
  ) {
    try {
      setIsUpdatingStatusId(budgetId);
      setError(null);

      const updatedBudget = await api<ApiBudget>(`/budgets/${budgetId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      setBudgets((current) =>
        current.map((budget) => (budget.id === budgetId ? updatedBudget : budget)),
      );
    } catch (updateError) {
      setError('Nao foi possivel atualizar o status desse orcamento agora.');
    } finally {
      setIsUpdatingStatusId(null);
    }
  }

  async function handleConvertBudgetToEvent(budget: ApiBudget) {
    try {
      setIsConvertingBudgetId(budget.id);
      setError(null);

      const createdEvent = await api<ApiCreatedEvent>(
        `/events/from-budget/${budget.id}`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        },
      );

      setBudgets((current) =>
        current.map((currentBudget) =>
          currentBudget.id === budget.id
            ? {
                ...currentBudget,
                status: 'APPROVED',
                event: {
                  id: createdEvent.id,
                  status: createdEvent.status,
                },
              }
            : currentBudget,
        ),
      );
    } catch (convertError) {
      setError('Nao foi possivel transformar esse orcamento em evento agora.');
    } finally {
      setIsConvertingBudgetId(null);
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardSection
          eyebrow={isEditingBudgetId ? 'Editar orcamento' : 'Novo orcamento'}
          title={
            isEditingBudgetId
              ? 'Ajuste a proposta sem montar tudo de novo'
              : 'Cadastro inicial da proposta'
          }
        >
          <form className="grid gap-4" onSubmit={handleSubmitBudget}>
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
              {form.budgetType === 'FULL_SERVICE' && ingredientCostEstimate > 0 ? (
                <p className="mt-2 text-xs leading-5 text-muted">
                  Preenchido com base no custo estimado atual dos ingredientes.
                </p>
              ) : null}
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

            <div className="rounded-[24px] border border-border bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Itens do orcamento
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Monte a proposta com os servicos do catalogo para ela ficar
                    mais proxima do pedido real.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addFormItem}
                  className="rounded-full border border-accent/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent transition hover:border-accent"
                >
                  Adicionar item
                </button>
              </div>

              {form.budgetType === 'FULL_SERVICE' ? (
                <div className="mt-4 grid gap-3 rounded-[22px] border border-[#e8d7ca] bg-[#fcf5ef] p-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Custo estimado dos ingredientes
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                      {formatCurrency(ingredientCostEstimate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Extra operacional
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                      {formatCurrency(operationalExtraValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Sugestao de orcamento
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                      {formatCurrency(suggestedQuoteValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Valor para o cliente
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                      {formatCurrency(currentEstimatedPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Margem prevista
                    </p>
                    <p
                      className={`mt-2 text-2xl font-semibold tracking-tight ${
                        estimatedMargin >= 0 ? 'text-[#2d6a3a]' : 'text-[#8f4242]'
                      }`}
                    >
                      {formatCurrency(estimatedMargin)}
                    </p>
                  </div>
                </div>
              ) : null}

              {form.budgetType === 'FULL_SERVICE' ? (
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <label className="rounded-[22px] border border-[#ead9cb] bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Extra operacional
                    </p>
                    <input
                      value={operationalExtra}
                      onChange={(event) => setOperationalExtra(event.target.value)}
                      placeholder="Ex: 300"
                      className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                    />
                    <p className="mt-2 text-xs leading-5 text-muted">
                      Aqui ele pode somar gas, gasolina, ajudante ou alguma folga operacional.
                    </p>
                  </label>

                  <label className="rounded-[22px] border border-[#ead9cb] bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Margem desejada (%)
                    </p>
                    <input
                      value={desiredMarginPercent}
                      onChange={(event) => setDesiredMarginPercent(event.target.value)}
                      placeholder="Ex: 25"
                      className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                    />
                    <p className="mt-2 text-xs leading-5 text-muted">
                      A sugestao usa `ingredientes + extra operacional` e aplica essa margem por cima.
                    </p>
                  </label>
                </div>
              ) : null}

              {form.budgetType === 'FULL_SERVICE' ? (
                <div className="mt-3 rounded-[22px] border border-[#ead9cb] bg-white px-4 py-4 text-sm leading-6 text-muted">
                  A conta usa `quantidade de pessoas x custo por pessoa` de cada
                  servico que ja tenha ficha tecnica montada.
                  {servicesWithoutRecipeCount > 0 ? (
                    <p className="mt-2 text-[#8a4c30]">
                      {servicesWithoutRecipeCount} item(ns) ainda sem ficha tecnica,
                      entao esse custo pode estar incompleto.
                    </p>
                  ) : null}
                  {ingredientCostEstimate > 0 && estimatedMargin < 0 ? (
                    <p className="mt-2 text-[#8f4242]">
                      O valor estimado esta abaixo do custo dos ingredientes somado ao operacional informado.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {form.budgetType === 'FULL_SERVICE' && ingredientBreakdown.length > 0 ? (
                <div className="mt-4 rounded-[22px] border border-border bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Composicao do custo
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        Esse bloco ajuda ele a entender quanto de cada ingrediente entra na conta antes de mandar o valor.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextValue = suggestedQuoteValue.toFixed(2);
                        setForm((current) => ({
                          ...current,
                          estimatedPrice: nextValue,
                        }));
                        setLastAutoEstimate(nextValue);
                      }}
                      className="rounded-full border border-accent/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent transition hover:border-accent"
                    >
                      Usar sugestao no valor
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {ingredientBreakdown.map((ingredient) => (
                      <div
                        key={ingredient.productId}
                        className="grid gap-3 rounded-[18px] border border-border px-4 py-3 text-sm text-muted md:grid-cols-[1.1fr_140px_140px_160px]"
                      >
                        <div>
                          <p className="font-medium text-foreground">{ingredient.name}</p>
                          <p className="mt-1 text-xs leading-5 text-muted">
                            {formatCurrency(ingredient.currentCost)} por {ingredient.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                            Quantidade total
                          </p>
                          <p className="mt-2 font-medium text-foreground">
                            {ingredient.totalQuantity.toFixed(2)} {ingredient.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                            Custo total
                          </p>
                          <p className="mt-2 font-medium text-foreground">
                            {formatCurrency(ingredient.totalCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                            Peso no orcamento
                          </p>
                          <p className="mt-2 font-medium text-foreground">
                            {ingredientCostEstimate > 0
                              ? `${((ingredient.totalCost / ingredientCostEstimate) * 100).toFixed(1)}%`
                              : '0%'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 space-y-4">
                {form.items.map((item, index) => (
                  <div
                    key={`${index}-${item.serviceId || 'novo'}`}
                    className="rounded-[22px] border border-border bg-[#fcf8f4] p-4"
                  >
                    <div className="grid gap-4 lg:grid-cols-[1.4fr_110px_150px_auto]">
                      <label className="rounded-[18px] border border-border bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                          Servico
                        </p>
                        <select
                          value={item.serviceId}
                          onChange={(event) =>
                            updateFormItem(index, 'serviceId', event.target.value)
                          }
                          className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                        >
                          <option value="">Selecione</option>
                          {activeServices.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                        {item.serviceId ? (
                          <p className="mt-2 text-xs leading-5 text-muted">
                            Custo por pessoa:{' '}
                            {(() => {
                              const selected = activeServices.find(
                                (service) => service.id === item.serviceId,
                              );

                              return selected?.estimatedCostPerPerson
                                ? formatCurrency(selected.estimatedCostPerPerson)
                                : 'nao definido';
                            })()}
                          </p>
                        ) : null}
                      </label>

                      <label className="rounded-[18px] border border-border bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                          Qtd.
                        </p>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) =>
                            updateFormItem(index, 'quantity', event.target.value)
                          }
                          className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                        />
                      </label>

                      <label className="rounded-[18px] border border-border bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                          Valor unit.
                        </p>
                        <input
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateFormItem(index, 'unitPrice', event.target.value)
                          }
                          placeholder="Opcional"
                          className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                        />
                      </label>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeFormItem(index)}
                          className="w-full rounded-[18px] border border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-accent/40"
                        >
                          Remover
                        </button>
                      </div>
                    </div>

                    <label className="mt-4 block rounded-[18px] border border-border bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Observacao do item
                      </p>
                      <input
                        value={item.notes}
                        onChange={(event) =>
                          updateFormItem(index, 'notes', event.target.value)
                        }
                        placeholder="Ex: incluir buffet de saladas completo"
                        className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !form.clientId}
              className="rounded-[22px] border border-accent bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? 'Salvando...'
                : isEditingBudgetId
                  ? 'Salvar alteracoes'
                  : 'Salvar orcamento'}
            </button>
            {isEditingBudgetId ? (
              <button
                type="button"
                onClick={() => resetBudgetForm(form.clientId)}
                className="rounded-[22px] border border-border bg-white px-5 py-3 text-sm font-medium text-foreground transition hover:border-accent/40"
              >
                Cancelar edicao
              </button>
            ) : null}
          </form>
        </DashboardSection>

        <DashboardSection eyebrow="Regras importantes" title="Como pensar o orcamento">
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
        title={
          isLoading
            ? 'Carregando propostas...'
            : `${filteredBudgets.length} proposta(s) na base`
        }
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
                      {budget.event ? (
                        <span className="rounded-full border border-[#bfdfc5] bg-[#e8f4ea] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#2d6a3a]">
                          Ja virou evento
                        </span>
                      ) : null}
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

                <div className="mt-4 flex flex-wrap gap-2">
                  {budget.event ? (
                    <Link
                      href={`/eventos?eventId=${budget.event.id}`}
                      className="rounded-full border border-[#bfdfc5] bg-[#e8f4ea] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2d6a3a] transition hover:border-[#2d6a3a]"
                    >
                      Abrir evento
                    </Link>
                  ) : null}
                  {!budget.event ? (
                    <button
                      type="button"
                      onClick={() => void handleConvertBudgetToEvent(budget)}
                      disabled={isConvertingBudgetId === budget.id}
                      className="rounded-full border border-[#bfdfc5] bg-[#e8f4ea] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2d6a3a] transition hover:border-[#2d6a3a] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isConvertingBudgetId === budget.id
                        ? 'Virando evento...'
                        : 'Virar evento'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleEditBudget(budget.id)}
                    disabled={isLoadingBudgetId === budget.id}
                    className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoadingBudgetId === budget.id ? 'Abrindo...' : 'Editar'}
                  </button>
                  {(
                    [
                      ['DRAFT', 'Rascunho'],
                      ['SENT', 'Enviado'],
                      ['APPROVED', 'Aprovado'],
                      ['REJECTED', 'Recusado'],
                    ] as Array<[BudgetStatus, string]>
                  ).map(([statusValue, label]) => (
                    <button
                      key={`${budget.id}-${statusValue}`}
                      type="button"
                      onClick={() => void handleUpdateBudgetStatus(budget.id, statusValue)}
                      disabled={
                        isUpdatingStatusId === budget.id || budget.status === statusValue
                      }
                      className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                        budget.status === statusValue
                          ? 'border-accent bg-accent text-white'
                          : 'border-border bg-white text-foreground hover:border-accent/40'
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      {isUpdatingStatusId === budget.id && budget.status !== statusValue
                        ? 'Atualizando...'
                        : label}
                    </button>
                  ))}
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
