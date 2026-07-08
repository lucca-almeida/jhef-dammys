import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ListServicesQueryDto } from './dto/list-services-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateServiceRecipeDto } from './dto/update-service-recipe.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateRecipeCostFor50People(
    recipeItems?: Array<{
      quantityFor50Person: Prisma.Decimal | string;
      product: { currentCost: Prisma.Decimal | string };
    }>,
  ) {
    if (!recipeItems?.length) {
      return null;
    }

    const total = recipeItems.reduce((sum, item) => {
      const quantity = Number(item.quantityFor50Person);
      const cost = Number(item.product.currentCost);
      return sum + quantity * cost;
    }, 0);

    return total.toFixed(2);
  }

  private enrichServiceWithRecipeCost<T extends { recipeItems?: Array<{
    quantityFor50Person: Prisma.Decimal | string;
    product: { currentCost: Prisma.Decimal | string };
  }> }>(service: T) {
    const estimatedCostFor50People = this.calculateRecipeCostFor50People(
      service.recipeItems,
    );

    return {
      ...service,
      estimatedCostFor50People,
      estimatedCostPerPerson: estimatedCostFor50People
        ? (Number(estimatedCostFor50People) / 50).toFixed(2)
        : null,
    };
  }

  async create(createServiceDto: CreateServiceDto) {
    const service = await this.prisma.service.create({
      data: {
        name: createServiceDto.name,
        description: createServiceDto.description,
        basePrice: createServiceDto.basePrice
          ? new Prisma.Decimal(createServiceDto.basePrice)
          : undefined,
        isActive: createServiceDto.isActive ?? true,
      },
      include: {
        recipeItems: {
          include: {
            product: true,
          },
        },
        _count: {
          select: {
            budgetItems: true,
            eventItems: true,
          },
        },
      },
    });

    return this.enrichServiceWithRecipeCost(service);
  }

  async findAll(query: ListServicesQueryDto) {
    const search = query.search?.trim();
    const onlyActive = query.onlyActive === 'true';

    const services = await this.prisma.service.findMany({
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
        recipeItems: {
          include: {
            product: true,
          },
        },
        _count: {
          select: {
            budgetItems: true,
            eventItems: true,
          },
        },
      },
    });

    return services.map((service) => this.enrichServiceWithRecipeCost(service));
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        recipeItems: {
          include: {
            product: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            budgetItems: true,
            eventItems: true,
          },
        },
      },
    });

    if (!service) {
      return service;
    }

    return this.enrichServiceWithRecipeCost(service);
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    const service = await this.prisma.service.update({
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
        recipeItems: {
          include: {
            product: true,
          },
        },
        _count: {
          select: {
            budgetItems: true,
            eventItems: true,
          },
        },
      },
    });

    return this.enrichServiceWithRecipeCost(service);
  }

  async updateRecipe(id: string, updateServiceRecipeDto: UpdateServiceRecipeDto) {
    const recipeItems = updateServiceRecipeDto.items.map((item) => ({
      productId: item.productId,
      quantityFor50Person: new Prisma.Decimal(item.quantityFor50Person),
      notes: item.notes,
    }));

    const service = await this.prisma.service.update({
      where: { id },
      data: {
        recipeItems: {
          deleteMany: {},
          create: recipeItems,
        },
      },
      include: {
        recipeItems: {
          include: {
            product: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            budgetItems: true,
            eventItems: true,
            recipeItems: true,
          },
        },
      },
    });

    return this.enrichServiceWithRecipeCost(service);
  }
}
