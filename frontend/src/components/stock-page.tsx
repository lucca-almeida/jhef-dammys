'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DashboardSection } from '@/components/dashboard-section';
import { PageHeader } from '@/components/page-header';
import { api } from '@/lib/api';

type ApiProduct = {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  currentCost: string;
  averageCost: string | null;
  stockQuantity: string | null;
  minimumStock: string | null;
  isActive: boolean;
};

type StockMovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT';

type ApiStockMovement = {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: string;
  stockBefore: string;
  stockAfter: string;
  unitCost: string | null;
  notes: string | null;
  happenedAt: string;
  product: ApiProduct;
};

type StockForm = {
  productId: string;
  type: StockMovementType;
  quantity: string;
  countedStock: string;
  unitCost: string;
  notes: string;
};

const initialForm: StockForm = {
  productId: '',
  type: 'ENTRY',
  quantity: '',
  countedStock: '',
  unitCost: '',
  notes: '',
};

const movementTypeOptions: Array<{ value: StockMovementType; label: string }> = [
  { value: 'ENTRY', label: 'Entrada' },
  { value: 'EXIT', label: 'Saida' },
  { value: 'ADJUSTMENT', label: 'Ajuste' },
];

function formatCurrency(value: string | number | null) {
  if (value === null || value === '') {
    return 'Nao definido';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

function formatQuantity(value: string | number | null, unit: string) {
  if (value === null || value === '') {
    return `0 ${unit}`;
  }

  return `${Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} ${unit}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getMovementLabel(type: StockMovementType) {
  return movementTypeOptions.find((option) => option.value === type)?.label ?? type;
}

function getMovementTone(type: StockMovementType) {
  if (type === 'ENTRY') {
    return 'border-[#bfdfc5] bg-[#e8f4ea] text-[#2d6a3a]';
  }

  if (type === 'EXIT') {
    return 'border-[#e6c0c0] bg-[#f7e8e8] text-[#8f4242]';
  }

  return 'border-[#d9c0ae] bg-[#f7ede6] text-[#8b5636]';
}

export function StockPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [movements, setMovements] = useState<ApiStockMovement[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [form, setForm] = useState<StockForm>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStockData() {
      try {
        setIsLoading(true);
        setError(null);

        const [productsData, movementsData] = await Promise.all([
          api<ApiProduct[]>('/products'),
          api<ApiStockMovement[]>('/stock-movements'),
        ]);

        if (!isMounted) {
          return;
        }

        setProducts(productsData);
        setMovements(movementsData);
        setSelectedProductId((current) => current || productsData[0]?.id || '');
        setForm((current) => ({
          ...current,
          productId: current.productId || productsData[0]?.id || '',
        }));
      } catch {
        if (!isMounted) {
          return;
        }

        setError('Nao foi possivel carregar a base de estoque agora.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStockData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const filteredMovements = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return movements.filter((movement) => {
      const matchesProduct = selectedProductId
        ? movement.productId === selectedProductId
        : true;

      const matchesSearch = normalizedSearch
        ? [
            movement.product.name,
            movement.product.category ?? '',
            movement.notes ?? '',
            getMovementLabel(movement.type),
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch)
        : true;

      return matchesProduct && matchesSearch;
    });
  }, [movements, search, selectedProductId]);

  const summary = useMemo(() => {
    const lowStock = products.filter((product) => {
      const minimum = Number(product.minimumStock ?? 0);
      const stock = Number(product.stockQuantity ?? 0);

      return minimum > 0 && stock <= minimum;
    }).length;

    const totalActive = products.filter((product) => product.isActive).length;
    const recentEntries = movements.filter((movement) => movement.type === 'ENTRY').length;
    const recentExits = movements.filter((movement) => movement.type === 'EXIT').length;

    return [
      {
        label: 'Produtos no estoque',
        value: String(totalActive),
        note: 'Itens ativos acompanhados na operacao',
      },
      {
        label: 'Estoque em alerta',
        value: String(lowStock),
        note: 'Produtos no minimo ou abaixo dele',
      },
      {
        label: 'Entradas lancadas',
        value: String(recentEntries),
        note: 'Movimentos de reposicao registrados',
      },
      {
        label: 'Saidas lancadas',
        value: String(recentExits),
        note: 'Baixas e consumos anotados na base',
      },
    ];
  }, [movements, products]);

  const movementPreview = useMemo(() => {
    const product = products.find((item) => item.id === form.productId);

    if (!product) {
      return null;
    }

    const currentStock = Number(product.stockQuantity ?? 0);

    if (form.type === 'ADJUSTMENT') {
      const countedStock = Number(form.countedStock || 0);
      const delta = countedStock - currentStock;

      return {
        currentStock,
        nextStock: countedStock,
        delta,
      };
    }

    const quantity = Number(form.quantity || 0);
    const delta = form.type === 'EXIT' ? -quantity : quantity;

    return {
      currentStock,
      nextStock: currentStock + delta,
      delta,
    };
  }, [form.countedStock, form.productId, form.quantity, form.type, products]);

  async function handleSubmitMovement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const product = products.find((item) => item.id === form.productId);

    if (!product) {
      setError('Escolha um produto antes de salvar a movimentacao.');
      return;
    }

    let quantity = form.quantity;

    if (form.type === 'ADJUSTMENT') {
      const currentStock = Number(product.stockQuantity ?? 0);
      const countedStock = Number(form.countedStock || 0);
      const delta = countedStock - currentStock;

      if (delta === 0) {
        setError('Nao houve diferenca no estoque para registrar ajuste.');
        return;
      }

      quantity = delta.toFixed(3);
    }

    if (!quantity) {
      setError('Informe a quantidade do movimento antes de salvar.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const createdMovement = await api<ApiStockMovement>('/stock-movements', {
        method: 'POST',
        body: JSON.stringify({
          productId: form.productId,
          type: form.type,
          quantity,
          unitCost: form.type === 'ENTRY' && form.unitCost ? form.unitCost : undefined,
          notes: form.notes || undefined,
        }),
      });

      setMovements((current) => [createdMovement, ...current]);
      setProducts((current) =>
        current.map((item) =>
          item.id === createdMovement.product.id ? createdMovement.product : item,
        ),
      );
      setSelectedProductId(createdMovement.product.id);
      setForm({
        ...initialForm,
        productId: createdMovement.product.id,
        type: 'ENTRY',
      });
    } catch {
      setError('Nao foi possivel salvar essa movimentacao agora.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Estoque"
        title="Entradas, saídas e ajustes dos insumos"
        description="Aqui ele registra o que entrou, o que saiu e o que foi ajustado no estoque. Isso ajuda a enxergar melhor consumo, reposicao e alertas do dia a dia."
        actions={['Nova entrada', 'Registrar saida', 'Ver alertas']}
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
            <p className="mt-4 text-3xl font-semibold tracking-tight">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{item.note}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardSection eyebrow="Movimentacao" title="Registrar entrada, saida ou ajuste">
          <form className="grid gap-4" onSubmit={handleSubmitMovement}>
            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Produto
              </p>
              <select
                value={form.productId}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    productId: event.target.value,
                  }));
                  setSelectedProductId(event.target.value);
                }}
                className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
              >
                <option value="">Selecione</option>
                {products
                  .filter((product) => product.isActive)
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
              </select>
            </label>

            <div className="grid gap-2 sm:grid-cols-3">
              {movementTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      type: option.value,
                    }))
                  }
                  className={`min-h-[52px] rounded-[20px] border px-4 py-3 text-sm font-medium transition ${
                    form.type === option.value
                      ? 'border-accent bg-accent text-white'
                      : 'border-border bg-white text-foreground hover:border-accent/40'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {form.type === 'ADJUSTMENT' ? (
              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Estoque contado agora
                </p>
                <input
                  value={form.countedStock}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      countedStock: event.target.value,
                    }))
                  }
                  placeholder="Ex: 12.5"
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />
              </label>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Quantidade
                  </p>
                  <input
                    value={form.quantity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    placeholder="Ex: 5"
                    className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                  />
                </label>

                <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Custo unitario
                  </p>
                  <input
                    value={form.unitCost}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        unitCost: event.target.value,
                      }))
                    }
                    placeholder={form.type === 'ENTRY' ? 'Opcional, mas ajuda bastante' : 'Nao obrigatorio'}
                    className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                  />
                </label>
              </div>
            )}

            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Observacoes
              </p>
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Ex: compra da semana, reposicao do arroz, acerto depois da contagem..."
                className="mt-2 w-full resize-none border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              />
            </label>

            {selectedProduct ? (
              <div className="rounded-[24px] border border-border bg-white px-4 py-4 text-sm text-muted">
                <p className="font-medium text-foreground">{selectedProduct.name}</p>
                <p className="mt-1 leading-6">
                  Estoque atual: {formatQuantity(selectedProduct.stockQuantity, selectedProduct.unit)}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Custo atual
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {formatCurrency(selectedProduct.currentCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Estoque depois do lancamento
                    </p>
                    <p
                      className={`mt-2 font-medium ${
                        movementPreview && movementPreview.nextStock < 0
                          ? 'text-[#8f4242]'
                          : 'text-foreground'
                      }`}
                    >
                      {movementPreview
                        ? formatQuantity(movementPreview.nextStock, selectedProduct.unit)
                        : formatQuantity(selectedProduct.stockQuantity, selectedProduct.unit)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !form.productId}
              className="min-h-[52px] rounded-[22px] border border-accent bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Salvando movimentacao...' : 'Salvar movimentacao'}
            </button>
          </form>
        </DashboardSection>

        <DashboardSection eyebrow="Leitura rapida" title="Como esse controle ajuda na operacao">
          <div className="space-y-3">
            {[
              'Entrada ajuda a registrar reposicao e atualizar o custo mais recente do item.',
              'Saida comeca a mostrar o que esta sendo consumido no dia a dia e no evento.',
              'Ajuste manual serve para acertar a contagem quando o numero real nao bate com o sistema.',
            ].map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-border bg-white px-4 py-4 text-sm leading-6 text-muted"
              >
                {note}
              </div>
            ))}
            <Link
              href="/produtos"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[22px] border border-border bg-white px-5 py-3 text-sm font-medium text-foreground transition hover:border-accent/40"
            >
              Abrir cadastro de produtos
            </Link>
          </div>
        </DashboardSection>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-[#e4b7a0] bg-[#fff1e8] px-5 py-4 text-sm text-[#8a4c30]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardSection
          eyebrow="Produtos no radar"
          title={isLoading ? 'Carregando base...' : `${products.length} produto(s) acompanhados`}
          action="Atualizado pela API"
        >
          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
                Buscando produtos e estoque no backend...
              </div>
            ) : null}

            {!isLoading &&
              products.map((product) => {
                const minimum = Number(product.minimumStock ?? 0);
                const stock = Number(product.stockQuantity ?? 0);
                const isLow = minimum > 0 && stock <= minimum;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(product.id);
                      setForm((current) => ({
                        ...current,
                        productId: product.id,
                      }));
                    }}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      selectedProductId === product.id
                        ? 'border-accent bg-[#fff4eb]'
                        : 'border-border bg-white hover:border-accent/40'
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="text-lg font-semibold tracking-tight">{product.name}</h4>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {product.category ? `${product.category} - ` : ''}
                          {formatCurrency(product.currentCost)} por {product.unit}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                            isLow
                              ? 'border-[#eed6a6] bg-[#fff7df] text-[#946f18]'
                              : 'border-[#bfdfc5] bg-[#e8f4ea] text-[#2d6a3a]'
                          }`}
                        >
                          {isLow ? 'Pede reposicao' : 'Em nivel seguro'}
                        </span>
                        <span className="rounded-full bg-[#f6ede7] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                          {formatQuantity(product.stockQuantity, product.unit)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Historico de movimentos"
          title={selectedProduct ? selectedProduct.name : 'Tudo que mexeu no estoque'}
          action="Linha do tempo"
        >
          <div className="mb-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Buscar movimento
              </p>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Produto, observacao ou tipo"
                className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              />
            </label>
            <button
              type="button"
              onClick={() => setSearch('')}
              className="min-h-[52px] rounded-[22px] border border-accent bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-95"
            >
              Limpar
            </button>
          </div>

          <div className="space-y-4">
            {filteredMovements.map((movement) => (
              <article
                key={movement.id}
                className="rounded-[24px] border border-border bg-white px-4 py-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-lg font-semibold tracking-tight">
                        {movement.product.name}
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {movement.notes || 'Sem observacao registrada.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${getMovementTone(
                          movement.type,
                        )}`}
                      >
                        {getMovementLabel(movement.type)}
                      </span>
                      <span className="rounded-full bg-[#eef2f8] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#395275]">
                        {formatDate(movement.happenedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-muted sm:grid-cols-2 lg:max-w-[380px] lg:grid-cols-3 lg:text-right">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Movimento
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatQuantity(movement.quantity, movement.product.unit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Antes
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatQuantity(movement.stockBefore, movement.product.unit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Depois
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatQuantity(movement.stockAfter, movement.product.unit)}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {!isLoading && filteredMovements.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
                Nenhuma movimentacao encontrada ainda. Quando ele comecar a lancar entradas e saidas, o historico aparece aqui.
              </div>
            ) : null}
          </div>
        </DashboardSection>
      </div>
    </>
  );
}
