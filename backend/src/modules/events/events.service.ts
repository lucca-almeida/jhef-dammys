import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BudgetStatus, EventStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConvertBudgetToEventDto } from './dto/convert-budget-to-event.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        clientId: createEventDto.clientId,
        budgetId: createEventDto.budgetId,
        title: createEventDto.title,
        eventDate: new Date(createEventDto.eventDate),
        eventLocation: createEventDto.eventLocation,
        guestCount: createEventDto.guestCount,
        budgetType: createEventDto.budgetType,
        finalPrice: new Prisma.Decimal(createEventDto.finalPrice),
        downPayment: createEventDto.downPayment
          ? new Prisma.Decimal(createEventDto.downPayment)
          : undefined,
        status: createEventDto.status ?? EventStatus.PENDING,
        notes: createEventDto.notes,
      },
      include: {
        client: true,
        budget: {
          select: {
            id: true,
            status: true,
          },
        },
        items: {
          include: {
            service: true,
          },
        },
        _count: {
          select: {
            items: true,
            payments: true,
            costs: true,
          },
        },
      },
    });
  }

  async findAll(query: ListEventsQueryDto) {
    const search = query.search?.trim();

    return this.prisma.event.findMany({
      where: {
        status: query.status,
        clientId: query.clientId,
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  client: {
                    name: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  eventLocation: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        eventDate: 'asc',
      },
      include: {
        client: true,
        budget: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            items: true,
            payments: true,
            costs: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        client: true,
        budget: {
          select: {
            id: true,
            status: true,
          },
        },
        items: {
          include: {
            service: true,
          },
        },
        payments: {
          orderBy: {
            paidAt: 'desc',
          },
        },
        costs: {
          orderBy: {
            spentAt: 'desc',
          },
        },
        _count: {
          select: {
            items: true,
            payments: true,
            costs: true,
          },
        },
      },
    });
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    return this.prisma.event.update({
      where: { id },
      data: {
        clientId: updateEventDto.clientId,
        budgetId: updateEventDto.budgetId,
        title: updateEventDto.title,
        eventDate: updateEventDto.eventDate
          ? new Date(updateEventDto.eventDate)
          : undefined,
        eventLocation: updateEventDto.eventLocation,
        guestCount: updateEventDto.guestCount,
        budgetType: updateEventDto.budgetType,
        finalPrice: updateEventDto.finalPrice
          ? new Prisma.Decimal(updateEventDto.finalPrice)
          : undefined,
        downPayment: updateEventDto.downPayment
          ? new Prisma.Decimal(updateEventDto.downPayment)
          : undefined,
        status: updateEventDto.status,
        notes: updateEventDto.notes,
      },
      include: {
        client: true,
        budget: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            items: true,
            payments: true,
            costs: true,
          },
        },
      },
    });
  }

  async createFromBudget(budgetId: string, payload: ConvertBudgetToEventDto) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        client: true,
        items: true,
        event: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!budget) {
      throw new NotFoundException('Orcamento nao encontrado.');
    }

    if (budget.event?.id) {
      throw new BadRequestException('Esse orcamento ja foi transformado em evento.');
    }

    const title =
      payload.title?.trim() ||
      `Evento ${budget.client.name}${budget.eventLocation ? ` - ${budget.eventLocation}` : ''}`;

    return this.prisma.$transaction(async (transaction) => {
      const event = await transaction.event.create({
        data: {
          clientId: budget.clientId,
          budgetId: budget.id,
          title,
          eventDate: budget.eventDate,
          eventLocation: budget.eventLocation,
          guestCount: budget.guestCount,
          budgetType: budget.budgetType,
          finalPrice: payload.finalPrice
            ? new Prisma.Decimal(payload.finalPrice)
            : budget.estimatedPrice,
          downPayment: payload.downPayment
            ? new Prisma.Decimal(payload.downPayment)
            : budget.downPayment,
          notes: payload.notes ?? budget.notes,
          status: EventStatus.PENDING,
          items: budget.items.length
            ? {
                create: budget.items.map((item) => ({
                  serviceId: item.serviceId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  notes: item.notes,
                })),
              }
            : undefined,
        },
        include: {
          client: true,
          budget: {
            select: {
              id: true,
              status: true,
            },
          },
          items: {
            include: {
              service: true,
            },
          },
          _count: {
            select: {
              items: true,
              payments: true,
              costs: true,
            },
          },
        },
      });

      await transaction.budget.update({
        where: { id: budget.id },
        data: {
          status: BudgetStatus.APPROVED,
        },
      });

      return event;
    });
  }
}
