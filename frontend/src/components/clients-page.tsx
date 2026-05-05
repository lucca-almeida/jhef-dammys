'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardSection } from '@/components/dashboard-section';
import { PageHeader } from '@/components/page-header';

type ApiClient = {
  id: string;
  name: string;
  phone: string;
  instagram: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    budgets: number;
    events: number;
  };
};

type CreateClientForm = {
  name: string;
  phone: string;
  instagram: string;
  notes: string;
};

const createFormFromClient = (client: ApiClient): CreateClientForm => ({
  name: client.name,
  phone: client.phone,
  instagram: client.instagram ?? '',
  notes: client.notes ?? '',
});

const quickNotes = [
  'Clientes vindos do Instagram costumam precisar de mais acompanhamento ate o fechamento.',
  'Registrar observacoes boas encurta bastante a montagem do proximo orcamento.',
  'Ter telefone e Instagram organizados ajuda a responder mais rapido sem depender do papel.',
];

const initialForm: CreateClientForm = {
  name: '',
  phone: '',
  instagram: '',
  notes: '',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function getOriginLabel(client: ApiClient) {
  return client.instagram ? 'Instagram' : 'Contato direto';
}

function getStatusLabel(client: ApiClient) {
  if (client._count.events > 0) {
    return 'Cliente com evento';
  }

  if (client._count.budgets > 0) {
    return 'Orcamento aberto';
  }

  return 'Novo contato';
}

function getStatusTone(status: string) {
  if (status === 'Cliente com evento') {
    return 'bg-[#e8f4ea] text-[#2d6a3a] border-[#bfdfc5]';
  }

  if (status === 'Orcamento aberto') {
    return 'bg-accent-soft text-accent border-accent/20';
  }

  return 'bg-[#eef2f8] text-[#395275] border-[#ccd7e8]';
}

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateClientForm>(initialForm);
  const [editForm, setEditForm] = useState<CreateClientForm>(initialForm);

  useEffect(() => {
    let isMounted = true;

    async function loadClients() {
      try {
        setIsLoading(true);
        setError(null);

        const query = search.trim()
          ? `/clients?search=${encodeURIComponent(search.trim())}`
          : '/clients';

        const data = await api<ApiClient[]>(query);

        if (!isMounted) {
          return;
        }

        setClients(data);
        setSelectedClientId((current) => {
          if (data.length === 0) {
            return null;
          }

          if (current && data.some((client) => client.id === current)) {
            return current;
          }

          return data[0].id;
        });
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setError('Nao foi possivel carregar os clientes da API.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadClients();

    return () => {
      isMounted = false;
    };
  }, [search]);

  const selectedClient =
    clients.find((client) => client.id === selectedClientId) ?? clients[0] ?? null;

  useEffect(() => {
    if (!selectedClient) {
      return;
    }

    setEditForm(createFormFromClient(selectedClient));
  }, [selectedClient]);

  const summaryCards = useMemo(() => {
    const activeClients = clients.length;
    const clientsWithEvents = clients.filter((client) => client._count.events > 0).length;
    const clientsWithBudgets = clients.filter((client) => client._count.budgets > 0).length;
    const clientsFromInstagram = clients.filter((client) => client.instagram).length;

    return [
      {
        label: 'Clientes ativos',
        value: String(activeClients),
        note: `${clientsWithEvents} com evento registrado`,
      },
      {
        label: 'Com orcamento',
        value: String(clientsWithBudgets),
        note: 'Clientes com historico de negociacao na base',
      },
      {
        label: 'Origem Instagram',
        value: String(clientsFromInstagram),
        note: 'Entraram pela rede social e exigem resposta rapida',
      },
    ];
  }, [clients]);

  async function handleCreateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const createdClient = await api<ApiClient>('/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          instagram: form.instagram || undefined,
          notes: form.notes || undefined,
        }),
      });

      setClients((current) => [createdClient, ...current]);
      setSelectedClientId(createdClient.id);
      setForm(initialForm);
    } catch (createError) {
      setError('Nao foi possivel cadastrar o cliente agora.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedClient) {
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      const updatedClient = await api<Omit<ApiClient, '_count'>>(
        `/clients/${selectedClient.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: editForm.name,
            phone: editForm.phone,
            instagram: editForm.instagram || undefined,
            notes: editForm.notes || undefined,
          }),
        },
      );

      setClients((current) =>
        current.map((client) =>
          client.id === selectedClient.id
            ? {
                ...client,
                ...updatedClient,
              }
            : client,
        ),
      );
    } catch (updateError) {
      setError('Nao foi possivel atualizar o cliente agora.');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Clientes"
        title="Base de clientes e historico de atendimento"
        description="Aqui o objetivo e organizar quem entrou em contato, qual foi a origem, o status da negociacao e o historico de eventos de cada cliente."
        actions={['Novo cliente', 'Novo orcamento', 'Exportar lista']}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {summaryCards.map((item) => (
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
          eyebrow="Busca e filtros"
          title="Encontrar rapido quem entrou em contato"
        >
          <div className="grid gap-4 lg:grid-cols-[1.2fr_auto]">
            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Buscar cliente
              </p>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, telefone ou Instagram"
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
        </DashboardSection>

        <DashboardSection eyebrow="Cadastro rapido" title="Adicionar novo cliente">
          <form className="grid gap-4" onSubmit={handleCreateClient}>
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
                  Telefone
                </p>
                <input
                  required
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                />
              </label>
            </div>

            <label className="rounded-[22px] border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Instagram
              </p>
              <input
                value={form.instagram}
                onChange={(event) =>
                  setForm((current) => ({ ...current, instagram: event.target.value }))
                }
                placeholder="@perfil"
                className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              />
            </label>

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
              disabled={isSubmitting}
              className="rounded-[22px] border border-accent bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar cliente'}
            </button>
          </form>
        </DashboardSection>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-[#e4b7a0] bg-[#fff1e8] px-5 py-4 text-sm text-[#8a4c30]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <DashboardSection
          eyebrow="Lista de clientes"
          title={
            isLoading
              ? 'Carregando clientes...'
              : `${clients.length} cliente(s) encontrado(s)`
          }
          action="Atualizado pela API"
        >
          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
                Buscando clientes no backend...
              </div>
            ) : null}

            {!isLoading &&
              clients.map((client) => {
                const origin = getOriginLabel(client);
                const status = getStatusLabel(client);

                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      client.id === selectedClient?.id
                        ? 'border-accent bg-[#fff6ef] shadow-[0_12px_30px_rgba(102,66,46,0.10)]'
                        : 'border-border bg-white hover:border-accent/40'
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-lg font-semibold tracking-tight">
                            {client.name}
                          </h4>
                          <p className="mt-1 text-sm leading-6 text-muted">
                            {client.phone}
                            {client.instagram ? ` - ${client.instagram}` : ''}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#f6ede7] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                            {origin}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${getStatusTone(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-3 text-sm text-muted sm:grid-cols-3 lg:w-[360px] lg:text-right">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                            Cadastro
                          </p>
                          <p className="mt-2 font-medium text-foreground">
                            {formatDate(client.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                            Eventos
                          </p>
                          <p className="mt-2 font-medium text-foreground">
                            {client._count.events}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                            Orcamentos
                          </p>
                          <p className="mt-2 font-medium text-foreground">
                            {client._count.budgets}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

            {!isLoading && clients.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
                Nenhum cliente encontrado. Cadastre o primeiro pela caixa ao lado.
              </div>
            ) : null}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Cliente em destaque"
          title={selectedClient?.name ?? 'Nenhum cliente selecionado'}
          action="Perfil detalhado"
        >
          {selectedClient ? (
            <div className="space-y-5">
              <div className="rounded-[24px] border border-border bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Contato principal
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {selectedClient.phone}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {selectedClient.notes || 'Sem observacoes registradas ainda.'}
                </p>
              </div>

              <div className="rounded-[24px] border border-border bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Resumo da relacao
                </p>
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl bg-[#faf4ef] px-3 py-3 text-sm leading-6 text-muted">
                    Origem principal: {getOriginLabel(selectedClient)}
                  </div>
                  <div className="rounded-2xl bg-[#faf4ef] px-3 py-3 text-sm leading-6 text-muted">
                    Orcamentos registrados: {selectedClient._count.budgets}
                  </div>
                  <div className="rounded-2xl bg-[#faf4ef] px-3 py-3 text-sm leading-6 text-muted">
                    Eventos registrados: {selectedClient._count.events}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href={`/orcamentos?clientId=${selectedClient.id}`}
                  className="rounded-2xl border border-accent bg-accent px-4 py-3 text-center text-sm font-medium text-white transition hover:opacity-95"
                >
                  Criar orcamento
                </Link>
              </div>

              <form className="grid gap-4" onSubmit={handleUpdateClient}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Nome
                    </p>
                    <input
                      required
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                    />
                  </label>

                  <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Telefone
                    </p>
                    <input
                      required
                      value={editForm.phone}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                    />
                  </label>
                </div>

                <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Instagram
                  </p>
                  <input
                    value={editForm.instagram}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        instagram: event.target.value,
                      }))
                    }
                    className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                  />
                </label>

                <label className="rounded-[22px] border border-border bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Observacoes
                  </p>
                  <textarea
                    value={editForm.notes}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-2 w-full resize-none border-0 bg-transparent text-sm text-foreground outline-none"
                  />
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="rounded-2xl border border-accent bg-accent px-4 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isUpdating ? 'Salvando...' : 'Salvar alteracoes'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      selectedClient && setEditForm(createFormFromClient(selectedClient))
                    }
                    className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent/40"
                  >
                    Restaurar dados
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
              Selecione um cliente para ver os detalhes.
            </div>
          )}
        </DashboardSection>
      </div>

      <DashboardSection eyebrow="Qualidade da base" title="Boas praticas">
        <div className="grid gap-4 md:grid-cols-3">
          {quickNotes.map((note) => (
            <div
              key={note}
              className="rounded-2xl border border-border bg-white px-4 py-4 text-sm leading-6 text-muted"
            >
              {note}
            </div>
          ))}
        </div>
      </DashboardSection>
    </>
  );
}
