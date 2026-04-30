'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardSection } from '@/components/dashboard-section';
import { PageHeader } from '@/components/page-header';

type ApiService = {
  id: string;
  name: string;
  description: string | null;
  basePrice: string | null;
  isActive: boolean;
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

const initialForm: ServiceForm = {
  name: '',
  description: '',
  basePrice: '',
};

const serviceNotes = [
  'Os servicos daqui vao alimentar o orcamento e, depois, os eventos.',
  'Mesmo que o valor mude na pratica, ter um valor base acelera muito a proposta.',
  'Combos podem nascer como servicos separados em um primeiro momento.',
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

export function ServicesPage() {
  const [services, setServices] = useState<ApiService[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<ServiceForm>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      try {
        setIsLoading(true);
        setError(null);

        const query = search.trim()
          ? `/services?search=${encodeURIComponent(search.trim())}`
          : '/services';

        const data = await api<ApiService[]>(query);

        if (isMounted) {
          setServices(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError('Nao foi possivel carregar os servicos da API.');
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
    const usedInBudgets = services.filter((service) => service._count.budgetItems > 0).length;

    return [
      {
        label: 'Servicos cadastrados',
        value: String(total),
        note: `${active} ativos para uso no sistema`,
      },
      {
        label: 'Ja usados em orcamento',
        value: String(usedInBudgets),
        note: 'Base que ja comecou a entrar no fluxo comercial',
      },
      {
        label: 'Em catalogo',
        value: String(active),
        note: 'Prontos para montar novas propostas',
      },
    ];
  }, [services]);

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
              <article
                key={service.id}
                className="rounded-[24px] border border-border bg-white px-4 py-4"
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
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-muted sm:grid-cols-4 lg:w-[460px] lg:text-right">
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
                        Em orcamentos
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {service._count.budgetItems}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Em eventos
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {service._count.eventItems}
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => void handleToggleService(service)}
                        className="mt-2 rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-accent/40"
                      >
                        {service.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}

          {!isLoading && services.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
              Nenhum servico cadastrado ainda. Crie o primeiro item do catalogo
              pelo formulario acima.
            </div>
          ) : null}
        </div>
      </DashboardSection>
    </>
  );
}
