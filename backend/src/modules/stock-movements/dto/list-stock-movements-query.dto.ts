import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ListStockMovementsQueryDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
