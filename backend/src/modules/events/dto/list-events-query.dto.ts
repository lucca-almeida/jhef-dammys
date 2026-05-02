import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EventStatus } from '@prisma/client';

export class ListEventsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsUUID()
  clientId?: string;
}
