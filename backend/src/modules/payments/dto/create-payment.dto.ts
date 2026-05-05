import { PaymentMethod, PaymentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  eventId: string;

  @IsEnum(PaymentType)
  type: PaymentType;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsString()
  amount: string;

  @IsOptional()
  @IsString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
