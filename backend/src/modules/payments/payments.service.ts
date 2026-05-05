import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    await this.ensureEventExists(createPaymentDto.eventId);

    return this.prisma.payment.create({
      data: {
        eventId: createPaymentDto.eventId,
        type: createPaymentDto.type,
        method: createPaymentDto.method,
        amount: new Prisma.Decimal(createPaymentDto.amount),
        paidAt: createPaymentDto.paidAt
          ? new Date(createPaymentDto.paidAt)
          : undefined,
        notes: createPaymentDto.notes,
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

  async findAll(query: ListPaymentsQueryDto) {
    return this.prisma.payment.findMany({
      where: {
        eventId: query.eventId,
        type: query.type,
        method: query.method,
      },
      orderBy: {
        paidAt: 'desc',
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

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    const currentPayment = await this.prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        eventId: true,
      },
    });

    if (!currentPayment) {
      throw new NotFoundException('Pagamento nao encontrado.');
    }

    if (updatePaymentDto.eventId) {
      await this.ensureEventExists(updatePaymentDto.eventId);
    }

    return this.prisma.payment.update({
      where: { id },
      data: {
        eventId: updatePaymentDto.eventId,
        type: updatePaymentDto.type,
        method: updatePaymentDto.method,
        amount: updatePaymentDto.amount
          ? new Prisma.Decimal(updatePaymentDto.amount)
          : undefined,
        paidAt: updatePaymentDto.paidAt
          ? new Date(updatePaymentDto.paidAt)
          : undefined,
        notes: updatePaymentDto.notes,
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
      throw new NotFoundException('Evento nao encontrado para registrar pagamento.');
    }
  }
}
