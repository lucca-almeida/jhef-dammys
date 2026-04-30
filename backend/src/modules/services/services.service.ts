import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ListServicesQueryDto } from './dto/list-services-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        name: createServiceDto.name,
        description: createServiceDto.description,
        basePrice: createServiceDto.basePrice
          ? new Prisma.Decimal(createServiceDto.basePrice)
          : undefined,
        isActive: createServiceDto.isActive ?? true,
      },
      include: {
        _count: {
          select: {
            budgetItems: true,
            eventItems: true,
          },
        },
      },
    });
  }

  async findAll(query: ListServicesQueryDto) {
    const search = query.search?.trim();
    const onlyActive = query.onlyActive === 'true';

    return this.prisma.service.findMany({
      where: {
        ...(query.onlyActive ? { isActive: onlyActive } : {}),
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
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
        _count: {
          select: {
            budgetItems: true,
            eventItems: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            budgetItems: true,
            eventItems: true,
          },
        },
      },
    });
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    return this.prisma.service.update({
      where: { id },
      data: {
        name: updateServiceDto.name,
        description: updateServiceDto.description,
        basePrice: updateServiceDto.basePrice
          ? new Prisma.Decimal(updateServiceDto.basePrice)
          : undefined,
        isActive: updateServiceDto.isActive,
      },
      include: {
        _count: {
          select: {
            budgetItems: true,
            eventItems: true,
          },
        },
      },
    });
  }
}
