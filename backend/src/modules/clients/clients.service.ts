import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    return this.prisma.client.create({
      data: createClientDto,
      include: {
        _count: {
          select: {
            budgets: true,
            events: true,
          },
        },
      },
    });
  }

  async findAll(query: ListClientsQueryDto) {
    const search = query.search?.trim();

    const where: Prisma.ClientWhereInput | undefined = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              phone: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              instagram: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : undefined;

    return this.prisma.client.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            budgets: true,
            events: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.client.findUnique({
      where: { id },
      include: {
        budgets: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        events: {
          orderBy: {
            eventDate: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            budgets: true,
            events: true,
          },
        },
      },
    });
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }
}
