import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { BudgetStatus, BudgetType } from '@prisma/client';

export class CreateBudgetDto {
  @IsUUID()
  clientId: string;

  @IsDateString()
  eventDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  eventLocation?: string;

  @IsInt()
  @Min(1)
  guestCount: number;

  @IsEnum(BudgetType)
  budgetType: BudgetType;

  @IsString()
  estimatedPrice: string;

  @IsOptional()
  @IsString()
  downPayment?: string;

  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
