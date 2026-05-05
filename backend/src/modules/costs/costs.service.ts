import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEventCostDto } from './dto/create-event-cost.dto';
import { ListEventCostsQueryDto } from './dto/list-event-costs-query.dto';
import { UpdateEventCostDto } from './dto/update-event-cost.dto';

@Injectable()
export class CostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEventCostDto: CreateEventCostDto) {
    await this.ensureEventExists(createEventCostDto.eventId);

    return this.prisma.eventCost.create({
      data: {
        eventId: createEventCostDto.eventId,
        category: createEventCostDto.category,
        description: createEventCostDto.description,
        amount: new Prisma.Decimal(createEventCostDto.amount),
        spentAt: createEventCostDto.spentAt
          ? new Date(createEventCostDto.spentAt)
          : undefined,
        notes: createEventCostDto.notes,
      },
      include: {
        event: {
          include: {
            client: true,
          },
        },
      },
    });
  }

  async findAll(query: ListEventCostsQueryDto) {
    return this.prisma.eventCost.findMany({
      where: {
        eventId: query.eventId,
        category: query.category,
      },
      orderBy: {
        spentAt: 'desc',
      },
      include: {
        event: {
          include: {
            client: true,
          },
        },
      },
    });
  }

  async update(id: string, updateEventCostDto: UpdateEventCostDto) {
    const currentCost = await this.prisma.eventCost.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!currentCost) {
      throw new NotFoundException('Custo nao encontrado.');
    }

    if (updateEventCostDto.eventId) {
      await this.ensureEventExists(updateEventCostDto.eventId);
    }

    return this.prisma.eventCost.update({
      where: { id },
      data: {
        eventId: updateEventCostDto.eventId,
        category: updateEventCostDto.category,
        description: updateEventCostDto.description,
        amount: updateEventCostDto.amount
          ? new Prisma.Decimal(updateEventCostDto.amount)
          : undefined,
        spentAt: updateEventCostDto.spentAt
          ? new Date(updateEventCostDto.spentAt)
          : undefined,
        notes: updateEventCostDto.notes,
      },
      include: {
        event: {
          include: {
            client: true,
          },
        },
      },
    });
  }

  private async ensureEventExists(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Evento nao encontrado para registrar custo.');
    }
  }
}
