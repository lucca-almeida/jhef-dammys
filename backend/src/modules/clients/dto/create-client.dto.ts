import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(30)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  instagram?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
