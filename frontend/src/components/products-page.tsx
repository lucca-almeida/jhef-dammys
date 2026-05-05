'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardSection } from '@/components/dashboard-section';
import { PageHeader } from '@/components/page-header';

type ApiProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  currentCost: string;
  averageCost: string | null;
  stockQuantity: string | null;
  minimumStock: string | null;
  isActive: boolean;
  _count: {
    recipeItems: number;
  };
};

type ProductForm = {
  name: string;
  description: string;
  category: string;
  unit: string;
  currentCost: string;
  averageCost: string;
  stockQuantity: string;
  minimumStock: string;
};

const initialForm: ProductForm = {
  name: '',
  description: '',
  category: '',
  unit: 'kg',
  currentCost: '',
  averageCost: '',
  stockQuantity: '',
  minimumStock: '',
};

const createFormFromProduct = (product: ApiProduct): ProductForm => ({
  name: product.name,
  description: product.description ?? '',
  category: product.category ?? '',
  unit: product.unit,
  currentCost: product.currentCost,
  averageCost: product.averageCost ?? '',
  stockQuantity: product.stockQuantity ?? '',
  minimumStock: product.minimumStock ?? '',
});

const productNotes = [
  'Aqui entram os ingredientes e insumos reais que ele compra no mercado.',
  'O custo atual vai alimentar o calculo automatico do orcamento.',
  'Nao precisa esperar o controle completo de estoque para comecar a usar essa base.',
];

const unitOptions = ['kg', 'g', 'l', 'ml', 'un', 'pacote', 'caixa'];
const quickCategories = [
  'carnes',
  'graos',
  'temperos',
  'saladas',
  'descartaveis',
  'bebidas',
];

function formatCurrency(value: string | null) {
  if (!value) {
    return 'Nao definido';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

function formatQuantity(value: string | null, unit: string) {
  if (!value) {
    return '--';
  }

  return `${Number(value).toLocaleString('pt-BR')} ${unit}`;
}

export function ProductsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setIsLoading(true);
        setError(null);

        const query = search.trim()
          ? `/products?search=${encodeURIComponent(search.trim())}`
          : '/products';

        const data = await api<ApiProduct[]>(query);

        if (isMounted) {
          setProducts(data);
          setSelectedProductId((current) => current || data[0]?.id || '');
        }
      } catch (loadError) {
        if (isMounted) {
          setError('Nao foi possivel carregar os produtos da API.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [search]);

  const summary = useMemo(() => {
    const active = products.filter((product) => product.isActive).length;
    const linked = products.filter((product) => product._count.recipeItems > 0).length;
    const lowStock = products.filter((product) => {
      if (!product.minimumStock || !product.stockQuantity) {
        return false;
      }

      return Number(product.stockQuantity) <= Number(product.minimumStock);
    }).length;

    return [
      {
        label: 'Produtos cadastrados',
        value: String(products.length),
        note: `${active} ativos para orcamento e ficha tecnica`,
      },
      {
        label: 'Ja usados em receitas',
        value: String(linked),
        note: 'Base que ja pode alimentar o calculo automatico',
      },
      {
        label: 'Pendentes de vinculo',
        value: String(products.length - linked),
        note: 'Produtos que ainda nao entraram em nenhum servico',
      },
      {
        label: 'Estoque em alerta',
        value: String(lowStock),
        note: 'Itens no minimo ou abaixo dele',
      },
    ];
  }, [products]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    setForm(createFormFromProduct(selectedProduct));
  }, [selectedProduct]);

  async function handleCreateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const createdProduct = await api<ApiProduct>('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          category: form.category || undefined,
          unit: form.unit,
          currentCost: form.currentCost,
          averageCost: form.averageCost || undefined,
          stockQuantity: form.stockQuantity || undefined,
          minimumStock: form.minimumStock || undefined,
        }),
      });

      setProducts((current) => [createdProduct, ...current]);
      setSelectedProductId(createdProduct.id);
      setForm(initialForm);
    } catch (submitError) {
      setError('Nao foi possivel cadastrar o produto agora.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleProduct(product: ApiProduct) {
    try {
      setError(null);

      const updatedProduct = await api<ApiProduct>(`/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isActive: !product.isActive,
        }),
      });

      setProducts((current) =>
        current.map((item) => (item.id === product.id ? updatedProduct : item)),
      );
    } catch (toggleError) {
      setError('Nao foi possivel atualizar o status do produto.');
    }
  }

  async function handleUpdateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProduct) {
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      const updatedProduct = await api<ApiProduct>(`/products/${selectedProduct.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          category: form.category || undefined,
          unit: form.unit,
          currentCost: form.currentCost,
          averageCost: form.averageCost || undefined,
          stockQuantity: form.stockQuantity || undefined,
          minimumStock: form.minimumStock || undefined,
        }),
      });

      setProducts((current) =>
        current.map((item) => (item.id === selectedProduct.id ? updatedProduct : item)),
      );
      setForm(createFormFromProduct(updatedProduct));
    } catch (updateError) {
      setError('Nao foi possivel atualizar esse produto agora.');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Produtos"
        title="Ingredientes e insumos do negocio"
        description="Aqui entram arroz, carne, alho, cebola, oleo, carvao, gas e todo material que depois vai alimentar a ficha tecnica dos servicos."
        actions={['Novo produto', 'Ver ativos', 'Base de custos']}
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardSection eyebrow="Novo produto" title="Cadastrar ingrediente ou insumo">
          <form className="grid gap-4" onSubmit={handleCreateProduct}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Nome
                </p>
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                />
              </label>

              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Categoria
                </p>
                <input
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value }))
                  }
                  placeholder="Ex: carnes, graos, temperos"
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {quickCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({ ...current, category }))
                      }
                      className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted transition hover:border-accent/40 hover:text-foreground"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Descricao
              </p>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                className="mt-2 w-full resize-none border-0 bg-transparent text-sm text-foreground outline-none"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-4">
              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Unidade
                </p>
                <select
                  required
                  value={form.unit}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, unit: event.target.value }))
                  }
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                >
                  {unitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>

              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Custo atual
                </p>
                <input
                  required
                  value={form.currentCost}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      currentCost: event.target.value,
                    }))
                  }
                  placeholder="6.50"
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                />
              </label>

              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Estoque atual
                </p>
                <input
                  value={form.stockQuantity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      stockQuantity: event.target.value,
                    }))
                  }
                  placeholder="25"
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                />
              </label>

              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Minimo
                </p>
                <input
                  value={form.minimumStock}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      minimumStock: event.target.value,
                    }))
                  }
                  placeholder="5"
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[22px] border border-accent bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar produto'}
            </button>
          </form>
        </DashboardSection>

        <DashboardSection eyebrow="Como pensar essa base" title="O que vale cadastrar primeiro">
          <div className="space-y-3">
            {productNotes.map((note) => (
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

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardSection
          eyebrow="Base de produtos"
          title={isLoading ? 'Carregando insumos...' : `${products.length} item(ns) cadastrados`}
          action="Atualizado pela API"
        >
          <div className="mb-5 grid gap-4 lg:grid-cols-[1.1fr_auto]">
            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Buscar produto
              </p>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, descricao ou categoria"
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
                Buscando produtos no backend...
              </div>
            ) : null}

            {!isLoading &&
              products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedProductId(product.id)}
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    selectedProductId === product.id
                      ? 'border-accent bg-[#fff4eb]'
                      : 'border-border bg-white hover:border-accent/40'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-lg font-semibold tracking-tight">
                          {product.name}
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {product.category ? `${product.category} - ` : ''}
                          {product.description || 'Sem descricao cadastrada.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                            product.isActive
                              ? 'border-[#bfdfc5] bg-[#e8f4ea] text-[#2d6a3a]'
                              : 'border-[#e6c0c0] bg-[#f7e8e8] text-[#8f4242]'
                          }`}
                        >
                          {product.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="rounded-full bg-[#f6ede7] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                          {product.unit}
                        </span>
                        {product.minimumStock &&
                        product.stockQuantity &&
                        Number(product.stockQuantity) <= Number(product.minimumStock) ? (
                          <span className="rounded-full border border-[#eed6a6] bg-[#fff7df] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#946f18]">
                            Estoque baixo
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-muted sm:grid-cols-5 lg:w-[600px] lg:text-right">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                          Custo atual
                        </p>
                        <p className="mt-2 font-medium text-foreground">
                          {formatCurrency(product.currentCost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                          Estoque
                        </p>
                        <p className="mt-2 font-medium text-foreground">
                          {formatQuantity(product.stockQuantity, product.unit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                          Minimo
                        </p>
                        <p className="mt-2 font-medium text-foreground">
                          {formatQuantity(product.minimumStock, product.unit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                          Em receitas
                        </p>
                        <p className="mt-2 font-medium text-foreground">
                          {product._count.recipeItems}
                        </p>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleToggleProduct(product);
                          }}
                          className="mt-2 rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-accent/40"
                        >
                          {product.isActive ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

            {!isLoading && products.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
                Nenhum produto cadastrado ainda. Comece pelos ingredientes de uso mais frequente.
              </div>
            ) : null}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Edicao rapida"
          title={selectedProduct ? selectedProduct.name : 'Escolha um produto'}
          action="Atualizar base"
        >
          {!selectedProduct ? (
            <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
              Selecione um produto da lista para atualizar custo, estoque e minimo.
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={handleUpdateProduct}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Nome
                  </p>
                  <input
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                  />
                </label>

                <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Categoria
                  </p>
                  <input
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, category: event.target.value }))
                    }
                    className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                  />
                </label>
              </div>

              <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Descricao
                </p>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-2 w-full resize-none border-0 bg-transparent text-sm text-foreground outline-none"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-4">
                <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Unidade
                  </p>
                  <select
                    value={form.unit}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, unit: event.target.value }))
                    }
                    className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                  >
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Custo atual
                  </p>
                  <input
                    required
                    value={form.currentCost}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        currentCost: event.target.value,
                      }))
                    }
                    className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                  />
                </label>

                <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Estoque
                  </p>
                  <input
                    value={form.stockQuantity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        stockQuantity: event.target.value,
                      }))
                    }
                    className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                  />
                </label>

                <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Minimo
                  </p>
                  <input
                    value={form.minimumStock}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        minimumStock: event.target.value,
                      }))
                    }
                    className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                  />
                </label>
              </div>

              <div className="rounded-[22px] border border-border bg-white px-4 py-4 text-sm text-muted">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Em receitas
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {selectedProduct._count.recipeItems}
                    </p>
                  </div>
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
                      Estoque atual
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {formatQuantity(selectedProduct.stockQuantity, selectedProduct.unit)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-[22px] border border-accent bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isUpdating ? 'Atualizando...' : 'Salvar alteracoes'}
                </button>

                <button
                  type="button"
                  onClick={() => setForm(createFormFromProduct(selectedProduct))}
                  className="rounded-[22px] border border-border bg-white px-5 py-3 text-sm font-medium text-foreground transition hover:border-accent/40"
                >
                  Restaurar dados
                </button>
              </div>
            </form>
          )}
        </DashboardSection>
      </div>
    </>
  );
}
