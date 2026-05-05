import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsString()
  @MaxLength(20)
  unit: string;

  @IsString()
  currentCost: string;

  @IsOptional()
  @IsString()
  averageCost?: string;

  @IsOptional()
  @IsString()
  stockQuantity?: string;

  @IsOptional()
  @IsString()
  minimumStock?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
