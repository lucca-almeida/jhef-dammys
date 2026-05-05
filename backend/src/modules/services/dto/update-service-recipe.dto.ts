import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceRecipeItemInputDto } from './service-recipe-item-input.dto';

export class UpdateServiceRecipeDto {
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ServiceRecipeItemInputDto)
  items: ServiceRecipeItemInputDto[];
}
