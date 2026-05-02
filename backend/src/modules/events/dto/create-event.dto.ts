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
import { BudgetType, EventStatus } from '@prisma/client';

export class CreateEventDto {
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  budgetId?: string;

  @IsString()
  @MaxLength(160)
  title: string;

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
  finalPrice: string;

  @IsOptional()
  @IsString()
  downPayment?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
