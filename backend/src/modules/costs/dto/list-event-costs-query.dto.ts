import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ListEventCostsQueryDto {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
