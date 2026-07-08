import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';

@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createStockMovementDto: CreateStockMovementDto) {
    const parsedQuantity = new Prisma.Decimal(createStockMovementDto.quantity);
    const movementQuantity =
      createStockMovementDto.type === StockMovementType.ADJUSTMENT
        ? parsedQuantity
        : parsedQuantity.abs();
    const absoluteQuantity = movementQuantity.abs();

    if (absoluteQuantity.lte(0)) {
      throw new BadRequestException('A quantidade do movimento deve ser maior que zero.');
    }

    return this.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({
        where: { id: createStockMovementDto.productId },
      });

      if (!product) {
        throw new NotFoundException('Produto nao encontrado para movimentar estoque.');
      }

      const stockBefore = product.stockQuantity ?? new Prisma.Decimal(0);
      const delta = this.getSignedDelta(
        createStockMovementDto.type,
        movementQuantity,
      );
      const stockAfter = stockBefore.add(delta);

      if (stockAfter.lt(0)) {
        throw new BadRequestException(
          'Esse movimento deixaria o estoque negativo. Ajuste a quantidade antes de salvar.',
        );
      }

      const quantityForRecord =
        createStockMovementDto.type === StockMovementType.EXIT
          ? absoluteQuantity.negated()
          : delta;

      const unitCost = createStockMovementDto.unitCost
        ? new Prisma.Decimal(createStockMovementDto.unitCost)
        : undefined;

      const nextCostData = this.getNextCostData({
        product,
        movementType: createStockMovementDto.type,
        quantity: absoluteQuantity,
        unitCost,
      });

      const movement = await transaction.stockMovement.create({
        data: {
          productId: createStockMovementDto.productId,
          type: createStockMovementDto.type,
          quantity: quantityForRecord,
          stockBefore,
          stockAfter,
          unitCost,
          notes: createStockMovementDto.notes,
          happenedAt: createStockMovementDto.happenedAt
            ? new Date(createStockMovementDto.happenedAt)
            : undefined,
        },
      });

      await transaction.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: stockAfter,
          ...nextCostData,
        },
      });

      return transaction.stockMovement.findUniqueOrThrow({
        where: { id: movement.id },
        include: {
          product: true,
        },
      });
    });
  }

  async findAll(query: ListStockMovementsQueryDto) {
    const search = query.search?.trim();

    return this.prisma.stockMovement.findMany({
      where: {
        productId: query.productId,
        ...(query.type ? { type: query.type as StockMovementType } : {}),
        ...(search
          ? {
              OR: [
                {
                  notes: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  product: {
                    name: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  product: {
                    category: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ happenedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        product: true,
      },
    });
  }

  private getSignedDelta(
    type: StockMovementType,
    quantity: Prisma.Decimal,
  ) {
    if (type === StockMovementType.EXIT) {
      return quantity.abs().negated();
    }

    return quantity;
  }

  private getNextCostData(options: {
    product: {
      currentCost: Prisma.Decimal;
      averageCost: Prisma.Decimal | null;
      stockQuantity: Prisma.Decimal | null;
    };
    movementType: StockMovementType;
    quantity: Prisma.Decimal;
    unitCost?: Prisma.Decimal;
  }) {
    const { movementType, product, quantity, unitCost } = options;

    if (movementType !== StockMovementType.ENTRY || !unitCost) {
      return {};
    }

    const currentStock = product.stockQuantity ?? new Prisma.Decimal(0);
    const currentCost = product.currentCost;
    const totalStockAfterEntry = currentStock.add(quantity);

    if (totalStockAfterEntry.lte(0)) {
      return {
        currentCost: unitCost,
        averageCost: unitCost,
      };
    }

    const weightedCurrent = currentStock.mul(currentCost);
    const weightedIncoming = quantity.mul(unitCost);
    const averageCost = weightedCurrent
      .add(weightedIncoming)
      .div(totalStockAfterEntry);

    return {
      currentCost: unitCost,
      averageCost,
    };
  }
}
