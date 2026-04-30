import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class BudgetItemInputDto {
  @IsUUID()
  serviceId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  unitPrice?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
