import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CostsService } from './costs.service';
import { CreateEventCostDto } from './dto/create-event-cost.dto';
import { ListEventCostsQueryDto } from './dto/list-event-costs-query.dto';
import { UpdateEventCostDto } from './dto/update-event-cost.dto';

@Controller('costs')
export class CostsController {
  constructor(private readonly costsService: CostsService) {}

  @Post()
  create(@Body() createEventCostDto: CreateEventCostDto) {
    return this.costsService.create(createEventCostDto);
  }

  @Get()
  findAll(@Query() query: ListEventCostsQueryDto) {
    return this.costsService.findAll(query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventCostDto: UpdateEventCostDto) {
    return this.costsService.update(id, updateEventCostDto);
  }
}
