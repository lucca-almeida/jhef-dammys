import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ServiceRecipeItemInputDto {
  @IsUUID()
  productId!: string;

  @IsString()
  quantityFor50Person!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  notes?: string;
}
