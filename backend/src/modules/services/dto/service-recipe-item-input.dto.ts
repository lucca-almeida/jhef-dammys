import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ServiceRecipeItemInputDto {
  @IsUUID()
  productId: string;

  @IsString()
  quantityPerPerson: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  notes?: string;
}
