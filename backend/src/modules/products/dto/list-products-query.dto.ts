import { IsBooleanString, IsOptional, IsString } from 'class-validator';

export class ListProductsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBooleanString()
  onlyActive?: string;
}
