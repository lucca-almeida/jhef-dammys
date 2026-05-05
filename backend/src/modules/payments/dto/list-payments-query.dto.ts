import { PaymentMethod, PaymentType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListPaymentsQueryDto {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}
