import { Injectable } from '@nestjs/common';
import { BudgetStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { ListBudgetsQueryDto } from './dto/list-budgets-query.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBudgetDto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        clientId: createBudgetDto.clientId,
        eventDate: new Date(createBudgetDto.eventDate),
        eventLocation: createBudgetDto.eventLocation,
        guestCount: createBudgetDto.guestCount,
        budgetType: createBudgetDto.budgetType,
        estimatedPrice: new Prisma.Decimal(createBudgetDto.estimatedPrice),
        downPayment: createBudgetDto.downPayment
          ? new Prisma.Decimal(createBudgetDto.downPayment)
          : undefined,
        status: createBudgetDto.status ?? BudgetStatus.DRAFT,
        notes: createBudgetDto.notes,
      },
      include: {
        client: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
    });
  }

  async findAll(query: ListBudgetsQueryDto) {
    const search = query.search?.trim();

    return this.prisma.budget.findMany({
      where: {
        status: query.status,
        clientId: query.clientId,
        ...(search
          ? {
              OR: [
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
        createdAt: 'desc',
      },
      include: {
        client: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.budget.findUnique({
      where: { id },
      include: {
        client: true,
        items: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  async update(id: string, updateBudgetDto: UpdateBudgetDto) {
    return this.prisma.budget.update({
      where: { id },
      data: {
        clientId: updateBudgetDto.clientId,
        eventDate: updateBudgetDto.eventDate
          ? new Date(updateBudgetDto.eventDate)
          : undefined,
        eventLocation: updateBudgetDto.eventLocation,
        guestCount: updateBudgetDto.guestCount,
        budgetType: updateBudgetDto.budgetType,
        estimatedPrice: updateBudgetDto.estimatedPrice
          ? new Prisma.Decimal(updateBudgetDto.estimatedPrice)
          : undefined,
        downPayment: updateBudgetDto.downPayment
          ? new Prisma.Decimal(updateBudgetDto.downPayment)
          : undefined,
        status: updateBudgetDto.status,
        notes: updateBudgetDto.notes,
      },
      include: {
        client: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
    });
  }
}
