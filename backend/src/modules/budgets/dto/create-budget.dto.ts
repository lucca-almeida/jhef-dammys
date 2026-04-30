import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BudgetStatus, BudgetType } from '@prisma/client';
import { BudgetItemInputDto } from './budget-item-input.dto';

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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => BudgetItemInputDto)
  items?: BudgetItemInputDto[];
}
