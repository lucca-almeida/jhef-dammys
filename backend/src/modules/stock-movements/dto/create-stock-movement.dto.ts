import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class CreateStockMovementDto {
  @IsUUID()
  productId: string;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsString()
  quantity: string;

  @IsOptional()
  @IsString()
  unitCost?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  happenedAt?: string;
}
