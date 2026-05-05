import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private toDecimal(value?: string) {
    return value ? new Prisma.Decimal(value) : undefined;
  }

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        category: createProductDto.category,
        unit: createProductDto.unit,
        currentCost: new Prisma.Decimal(createProductDto.currentCost),
        averageCost: this.toDecimal(createProductDto.averageCost),
        stockQuantity: this.toDecimal(createProductDto.stockQuantity),
        minimumStock: this.toDecimal(createProductDto.minimumStock),
        isActive: createProductDto.isActive ?? true,
      },
      include: {
        _count: {
          select: {
            recipeItems: true,
          },
        },
      },
    });
  }

  async findAll(query: ListProductsQueryDto) {
    const search = query.search?.trim();
    const onlyActive = query.onlyActive === 'true';

    return this.prisma.product.findMany({
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
                {
                  category: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            recipeItems: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        recipeItems: {
          include: {
            service: true,
          },
        },
        _count: {
          select: {
            recipeItems: true,
          },
        },
      },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: {
        name: updateProductDto.name,
        description: updateProductDto.description,
        category: updateProductDto.category,
        unit: updateProductDto.unit,
        currentCost: this.toDecimal(updateProductDto.currentCost),
        averageCost: this.toDecimal(updateProductDto.averageCost),
        stockQuantity: this.toDecimal(updateProductDto.stockQuantity),
        minimumStock: this.toDecimal(updateProductDto.minimumStock),
        isActive: updateProductDto.isActive,
      },
      include: {
        _count: {
          select: {
            recipeItems: true,
          },
        },
      },
    });
  }
}
