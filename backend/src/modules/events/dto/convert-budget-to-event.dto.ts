import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConvertBudgetToEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  finalPrice?: string;

  @IsOptional()
  @IsString()
  downPayment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
