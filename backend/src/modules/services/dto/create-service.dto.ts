import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsString()
  basePrice?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
