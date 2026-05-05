'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardSection } from '@/components/dashboard-section';
import { PageHeader } from '@/components/page-header';

type EventStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
type BudgetType = 'LABOR_ONLY' | 'FULL_SERVICE';

type ApiEvent = {
  id: string;
  title: string;
  eventDate: string;
  eventLocation: string | null;
  guestCount: number;
  budgetType: BudgetType;
  finalPrice: string;
  status: EventStatus;
  client: {
    id: string;
    name: string;
    phone: string;
  };
  _count: {
    items: number;
    payments: number;
    costs: number;
  };
};

type CalendarDay = {
  key: string;
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  events: ApiEvent[];
};

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

function getStatusLabel(status: EventStatus) {
  const labels: Record<EventStatus, string> = {
    PENDING: 'Pendente',
    CONFIRMED: 'Confirmado',
    COMPLETED: 'Concluido',
    CANCELED: 'Cancelado',
  };

  return labels[status];
}

function getStatusTone(status: EventStatus) {
  if (status === 'CONFIRMED') {
    return 'border-[#d9c0ae] bg-[#f7ede6] text-[#8b5636]';
  }

  if (status === 'COMPLETED') {
    return 'border-[#bfdfc5] bg-[#e8f4ea] text-[#2d6a3a]';
  }

  if (status === 'CANCELED') {
    return 'border-[#e6c0c0] bg-[#f7e8e8] text-[#8f4242]';
  }

  return 'border-[#ccd7e8] bg-[#eef2f8] text-[#395275]';
}

function getBudgetTypeLabel(type: BudgetType) {
  return type === 'FULL_SERVICE' ? 'Servico completo' : 'Mao de obra';
}

function buildCalendarDays(referenceDate: Date, events: ApiEvent[]) {
  const monthStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    1,
  );
  const monthEnd = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
  );

  const startDate = new Date(monthStart);
  startDate.setDate(monthStart.getDate() - monthStart.getDay());

  const endDate = new Date(monthEnd);
  endDate.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

  const days: CalendarDay[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const currentDate = normalizeDate(cursor);
    const dayEvents = events.filter((event) =>
      isSameDay(new Date(event.eventDate), currentDate),
    );

    days.push({
      key: currentDate.toISOString(),
      date: currentDate,
      dayNumber: currentDate.getDate(),
      isCurrentMonth: currentDate.getMonth() === referenceDate.getMonth(),
      events: dayEvents,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function AgendaPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date>(() => normalizeDate(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await api<ApiEvent[]>('/events');

        if (!isMounted) {
          return;
        }

        setEvents(data);

        if (data.length > 0) {
          const firstEventDate = normalizeDate(new Date(data[0].eventDate));
          setSelectedDate(firstEventDate);
          setCurrentMonth(
            new Date(firstEventDate.getFullYear(), firstEventDate.getMonth(), 1),
          );
        }
      } catch (loadError) {
        if (isMounted) {
          setError('Nao foi possivel carregar os eventos da agenda.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const calendarDays = useMemo(
    () => buildCalendarDays(currentMonth, events),
    [currentMonth, events],
  );

  const selectedDayEvents = useMemo(
    () =>
      events.filter((event) =>
        isSameDay(new Date(event.eventDate), selectedDate),
      ),
    [events, selectedDate],
  );

  const summary = useMemo(() => {
    const monthEvents = events.filter((event) => {
      const eventDate = new Date(event.eventDate);

      return (
        eventDate.getMonth() === currentMonth.getMonth() &&
        eventDate.getFullYear() === currentMonth.getFullYear()
      );
    });

    const confirmed = monthEvents.filter((event) => event.status === 'CONFIRMED').length;
    const pending = monthEvents.filter((event) => event.status === 'PENDING').length;

    return [
      {
        label: 'Eventos no mes',
        value: String(monthEvents.length),
        note: 'Volume do calendario atual',
      },
      {
        label: 'Confirmados',
        value: String(confirmed),
        note: 'Ja tratados como fechados',
      },
      {
        label: 'Pendentes',
        value: String(pending),
        note: 'Ainda pedem alinhamento',
      },
    ];
  }, [currentMonth, events]);

  function goToPreviousMonth() {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  function goToNextMonth() {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Agenda"
        title="Controle de datas e compromissos"
        description="Essa tela precisa virar o lugar onde ele bate o olho para ver datas ocupadas, confirmar disponibilidade e nao se perder no mes."
        actions={['Mes atual', 'Ver confirmados', 'Datas livres']}
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
          eyebrow="Calendario"
          title={getMonthLabel(currentMonth)}
          action="Agenda real"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-accent/40"
            >
              Mes anterior
            </button>

            <p className="text-sm font-medium capitalize text-muted">
              {getMonthLabel(currentMonth)}
            </p>

            <button
              type="button"
              onClick={goToNextMonth}
              className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-accent/40"
            >
              Proximo mes
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="rounded-2xl bg-[#f2e7dd] px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted"
              >
                {day}
              </div>
            ))}

            {calendarDays.map((day) => {
              const isSelected = isSameDay(day.date, selectedDate);

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`min-h-[132px] rounded-[24px] border px-3 py-3 text-left transition ${
                    isSelected
                      ? 'border-accent bg-[#fff4eb]'
                      : 'border-border bg-white hover:border-accent/30'
                  } ${day.isCurrentMonth ? '' : 'opacity-45'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      {day.dayNumber}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
                      {day.events.length > 0 ? `${day.events.length} evt` : ''}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {day.events.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`rounded-2xl border px-2.5 py-2 text-[11px] leading-5 ${getStatusTone(
                          event.status,
                        )}`}
                      >
                        <p className="font-semibold">{event.client.name}</p>
                        <p className="opacity-80">{event.title}</p>
                      </div>
                    ))}

                    {day.events.length > 2 ? (
                      <div className="text-[11px] font-medium text-muted">
                        + {day.events.length - 2} evento(s)
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Dia selecionado"
          title={formatDate(selectedDate)}
          action="Detalhes"
        >
          {error ? (
            <div className="rounded-[24px] border border-[#e4b7a0] bg-[#fff1e8] px-5 py-4 text-sm text-[#8a4c30]">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
              Carregando agenda...
            </div>
          ) : null}

          {!isLoading && selectedDayEvents.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
              Nenhum evento nesse dia. Isso ajuda ele a ver rapido quando a data esta livre.
            </div>
          ) : null}

          <div className="space-y-4">
            {selectedDayEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-[24px] border border-border bg-white px-4 py-4"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold tracking-tight">
                        {event.title}
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {event.client.name}
                        {event.eventLocation ? ` - ${event.eventLocation}` : ''}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${getStatusTone(
                        event.status,
                      )}`}
                    >
                      {getStatusLabel(event.status)}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm text-muted sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Tipo
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {getBudgetTypeLabel(event.budgetType)}
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
                        Itens no evento
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {event._count.items}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/eventos?eventId=${event.id}`}
                      className="rounded-full border border-accent bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:opacity-95"
                    >
                      Abrir evento
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </DashboardSection>
      </div>
    </>
  );
}
