import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BudgetStatus } from '@prisma/client';

export class ListBudgetsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @IsOptional()
  @IsUUID()
  clientId?: string;
}
