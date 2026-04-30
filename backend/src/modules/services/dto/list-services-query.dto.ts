import { IsBooleanString, IsOptional, IsString } from 'class-validator';

export class ListServicesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBooleanString()
  onlyActive?: string;
}
