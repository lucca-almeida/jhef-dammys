import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateEventCostDto {
  @IsUUID()
  eventId: string;

  @IsString()
  category: string;

  @IsString()
  description: string;

  @IsString()
  amount: string;

  @IsOptional()
  @IsString()
  spentAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
