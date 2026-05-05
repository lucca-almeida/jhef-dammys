'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardSection } from '@/components/dashboard-section';
import { PageHeader } from '@/components/page-header';

type ApiProduct = {
  id: string;
  name: string;
  unit: string;
  currentCost: string;
  isActive: boolean;
};

type ApiServiceRecipeItem = {
  id: string;
  productId: string;
  quantityPerPerson: string;
  notes: string | null;
  product: ApiProduct;
};

type ApiService = {
  id: string;
  name: string;
  description: string | null;
  basePrice: string | null;
  isActive: boolean;
  estimatedCostPerPerson: string | null;
  recipeItems: ApiServiceRecipeItem[];
  _count: {
    budgetItems: number;
    eventItems: number;
  };
};

type ServiceForm = {
  name: string;
  description: string;
  basePrice: string;
};

type RecipeFormItem = {
  productId: string;
  quantityPerPerson: string;
  notes: string;
};

const initialForm: ServiceForm = {
  name: '',
  description: '',
  basePrice: '',
};

const createEmptyRecipeItem = (): RecipeFormItem => ({
  productId: '',
  quantityPerPerson: '',
  notes: '',
});

const serviceNotes = [
  'Servico e o que ele vende. Produto e o ingrediente que entra na composicao.',
  'Quanto mais fiel ficar a ficha tecnica, melhor o orcamento automatico vai responder.',
  'Nessa primeira versao, a conta usa quantidade por pessoa e custo atual do produto.',
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

export function ServicesPage() {
  const [services, setServices] = useState<ApiService[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [recipeItems, setRecipeItems] = useState<RecipeFormItem[]>([
    createEmptyRecipeItem(),
  ]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<ServiceForm>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      try {
        setIsLoading(true);
        setError(null);

        const serviceQuery = search.trim()
          ? `/services?search=${encodeURIComponent(search.trim())}`
          : '/services';

        const [servicesData, productsData] = await Promise.all([
          api<ApiService[]>(serviceQuery),
          api<ApiProduct[]>('/products?onlyActive=true'),
        ]);

        if (!isMounted) {
          return;
        }

        setServices(servicesData);
        setProducts(productsData);
        setSelectedServiceId((current) => current || servicesData[0]?.id || '');
      } catch (loadError) {
        if (isMounted) {
          setError('Nao foi possivel carregar os servicos e produtos da API.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadServices();

    return () => {
      isMounted = false;
    };
  }, [search]);

  const summary = useMemo(() => {
    const total = services.length;
    const active = services.filter((service) => service.isActive).length;
    const withRecipe = services.filter((service) => service.recipeItems.length > 0).length;

    return [
      {
        label: 'Servicos cadastrados',
        value: String(total),
        note: `${active} ativos para uso no sistema`,
      },
      {
        label: 'Com ficha tecnica',
        value: String(withRecipe),
        note: 'Prontos para alimentar o calculo automatico',
      },
      {
        label: 'Em catalogo',
        value: String(active),
        note: 'Base comercial pronta para novos orcamentos',
      },
    ];
  }, [services]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, services],
  );

  const recipePreview = useMemo(() => {
    if (!selectedService?.estimatedCostPerPerson) {
      return {
        cost50: null,
        cost100: null,
      };
    }

    const perPerson = Number(selectedService.estimatedCostPerPerson);

    return {
      cost50: (perPerson * 50).toFixed(2),
      cost100: (perPerson * 100).toFixed(2),
    };
  }, [selectedService]);

  useEffect(() => {
    if (!selectedService) {
      setRecipeItems([createEmptyRecipeItem()]);
      return;
    }

    if (selectedService.recipeItems.length === 0) {
      setRecipeItems([createEmptyRecipeItem()]);
      return;
    }

    setRecipeItems(
      selectedService.recipeItems.map((item) => ({
        productId: item.productId,
        quantityPerPerson: item.quantityPerPerson,
        notes: item.notes ?? '',
      })),
    );
  }, [selectedService]);

  async function handleCreateService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const createdService = await api<ApiService>('/services', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          basePrice: form.basePrice || undefined,
        }),
      });

      setServices((current) => [createdService, ...current]);
      setSelectedServiceId(createdService.id);
      setForm(initialForm);
    } catch (submitError) {
      setError('Nao foi possivel cadastrar o servico agora.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleService(service: ApiService) {
    try {
      setError(null);

      const updatedService = await api<ApiService>(`/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isActive: !service.isActive,
        }),
      });

      setServices((current) =>
        current.map((item) => (item.id === service.id ? updatedService : item)),
      );
    } catch (toggleError) {
      setError('Nao foi possivel atualizar o status do servico.');
    }
  }

  function updateRecipeItem(
    index: number,
    field: keyof RecipeFormItem,
    value: string,
  ) {
    setRecipeItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addRecipeItem() {
    setRecipeItems((current) => [...current, createEmptyRecipeItem()]);
  }

  function removeRecipeItem(index: number) {
    setRecipeItems((current) =>
      current.length === 1
        ? [createEmptyRecipeItem()]
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function handleSaveRecipe() {
    if (!selectedService) {
      return;
    }

    try {
      setIsSavingRecipe(true);
      setError(null);

      const normalizedItems = recipeItems
        .filter((item) => item.productId && item.quantityPerPerson)
        .map((item) => ({
          productId: item.productId,
          quantityPerPerson: item.quantityPerPerson,
          notes: item.notes || undefined,
        }));

      const updatedService = await api<ApiService>(
        `/services/${selectedService.id}/recipe`,
        {
          method: 'PUT',
          body: JSON.stringify({
            items: normalizedItems,
          }),
        },
      );

      setServices((current) =>
        current.map((item) => (item.id === selectedService.id ? updatedService : item)),
      );
    } catch (saveError) {
      setError('Nao foi possivel salvar a ficha tecnica desse servico.');
    } finally {
      setIsSavingRecipe(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Servicos"
        title="Cardapio base e servicos do negocio"
        description="Aqui entram os servicos e pratos que vao alimentar os orcamentos: churrasco, torresmo, baiao de dois, buffet de saladas, combos e o que mais fizer sentido."
        actions={['Novo servico', 'Ver ativos', 'Organizar catalogo']}
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
        <DashboardSection eyebrow="Novo servico" title="Adicionar item ao catalogo">
          <form className="grid gap-4" onSubmit={handleCreateService}>
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

            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Valor base
              </p>
              <input
                value={form.basePrice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    basePrice: event.target.value,
                  }))
                }
                placeholder="Ex: 2500.00"
                className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[22px] border border-accent bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar servico'}
            </button>
          </form>
        </DashboardSection>

        <DashboardSection eyebrow="Como usar" title="Boas praticas do catalogo">
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

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardSection
          eyebrow="Lista de servicos"
          title={isLoading ? 'Carregando catalogo...' : `${services.length} item(ns) no catalogo`}
          action="Atualizado pela API"
        >
          <div className="mb-5 grid gap-4 lg:grid-cols-[1.1fr_auto]">
            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Buscar servico
              </p>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome ou descricao"
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
                Buscando servicos no backend...
              </div>
            ) : null}

            {!isLoading &&
              services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`w-full rounded-[24px] border px-4 py-4 text-left ${
                    selectedServiceId === service.id
                      ? 'border-accent bg-[#fff4eb]'
                      : 'border-border bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-lg font-semibold tracking-tight">
                          {service.name}
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {service.description || 'Sem descricao cadastrada.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                            service.isActive
                              ? 'border-[#bfdfc5] bg-[#e8f4ea] text-[#2d6a3a]'
                              : 'border-[#e6c0c0] bg-[#f7e8e8] text-[#8f4242]'
                          }`}
                        >
                          {service.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="rounded-full bg-[#f6ede7] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                          {service.recipeItems.length > 0
                            ? `${service.recipeItems.length} ingrediente(s)`
                            : 'Sem ficha tecnica'}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-muted sm:grid-cols-4 lg:w-[500px] lg:text-right">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                          Valor base
                        </p>
                        <p className="mt-2 font-medium text-foreground">
                          {formatCurrency(service.basePrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                          Custo/pessoa
                        </p>
                        <p className="mt-2 font-medium text-foreground">
                          {formatCurrency(service.estimatedCostPerPerson)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                          Em orcamentos
                        </p>
                        <p className="mt-2 font-medium text-foreground">
                          {service._count.budgetItems}
                        </p>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleToggleService(service);
                          }}
                          className="mt-2 rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-accent/40"
                        >
                          {service.isActive ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

            {!isLoading && services.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
                Nenhum servico cadastrado ainda. Crie o primeiro item do catalogo
                pelo formulario acima.
              </div>
            ) : null}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Ficha tecnica"
          title={
            selectedService
              ? `Ingredientes de ${selectedService.name}`
              : 'Escolha um servico'
          }
          action="Base do calculo"
        >
          {!selectedService ? (
            <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
              Selecione um servico na lista para montar a composicao dele.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[22px] border border-border bg-white px-4 py-4 text-sm leading-6 text-muted">
                <p className="font-medium text-foreground">
                  Custo estimado por pessoa:
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {formatCurrency(selectedService.estimatedCostPerPerson)}
                </p>
                <p className="mt-2">
                  O sistema usa a soma de `quantidade por pessoa x custo atual do
                  produto`.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-border bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Custo estimado para 50 pessoas
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {formatCurrency(recipePreview.cost50)}
                  </p>
                </div>

                <div className="rounded-[22px] border border-border bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Custo estimado para 100 pessoas
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {formatCurrency(recipePreview.cost100)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {recipeItems.map((item, index) => (
                  <div
                    key={`${index}-${item.productId || 'novo'}`}
                    className="rounded-[22px] border border-border bg-white p-4"
                  >
                    <div className="grid gap-4 lg:grid-cols-[1.2fr_160px_auto]">
                      <label className="rounded-[18px] border border-border bg-[#fcf8f4] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                          Produto
                        </p>
                        <select
                          value={item.productId}
                          onChange={(event) =>
                            updateRecipeItem(index, 'productId', event.target.value)
                          }
                          className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                        >
                          <option value="">Selecione</option>
                          {products
                            .filter((product) => product.isActive)
                            .map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.unit})
                              </option>
                            ))}
                        </select>
                        {item.productId ? (
                          <p className="mt-2 text-xs leading-5 text-muted">
                            {(() => {
                              const selectedProduct = products.find(
                                (product) => product.id === item.productId,
                              );

                              if (!selectedProduct) {
                                return 'Produto nao encontrado na base ativa.';
                              }

                              return `Custo atual: ${formatCurrency(
                                selectedProduct.currentCost,
                              )} por ${selectedProduct.unit}`;
                            })()}
                          </p>
                        ) : null}
                      </label>

                      <label className="rounded-[18px] border border-border bg-[#fcf8f4] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                          Qtd por pessoa
                        </p>
                        <input
                          value={item.quantityPerPerson}
                          onChange={(event) =>
                            updateRecipeItem(
                              index,
                              'quantityPerPerson',
                              event.target.value,
                            )
                          }
                          placeholder="Ex: 0.16"
                          className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                        />
                        {item.productId && item.quantityPerPerson ? (
                          <p className="mt-2 text-xs leading-5 text-muted">
                            {(() => {
                              const selectedProduct = products.find(
                                (product) => product.id === item.productId,
                              );

                              if (!selectedProduct) {
                                return 'Sem base de produto.';
                              }

                              return `Consumo previsto: ${formatQuantity(
                                item.quantityPerPerson,
                                selectedProduct.unit,
                              )} por pessoa`;
                            })()}
                          </p>
                        ) : null}
                      </label>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeRecipeItem(index)}
                          className="w-full rounded-[18px] border border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-accent/40"
                        >
                          Remover
                        </button>
                      </div>
                    </div>

                    <label className="mt-4 block rounded-[18px] border border-border bg-[#fcf8f4] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Observacao
                      </p>
                      <input
                        value={item.notes}
                        onChange={(event) =>
                          updateRecipeItem(index, 'notes', event.target.value)
                        }
                        placeholder="Ex: considerar margem para perda"
                        className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={addRecipeItem}
                  className="rounded-[22px] border border-border bg-white px-5 py-3 text-sm font-medium text-foreground transition hover:border-accent/40"
                >
                  Adicionar ingrediente
                </button>

                <button
                  type="button"
                  onClick={() => void handleSaveRecipe()}
                  disabled={isSavingRecipe}
                  className="rounded-[22px] border border-accent bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingRecipe ? 'Salvando...' : 'Salvar ficha tecnica'}
                </button>
              </div>
            </div>
          )}
        </DashboardSection>
      </div>
    </>
  );
}
