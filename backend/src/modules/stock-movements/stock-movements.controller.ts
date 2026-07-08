import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';

@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Post()
  create(@Body() createStockMovementDto: CreateStockMovementDto) {
    return this.stockMovementsService.create(createStockMovementDto);
  }

  @Get()
  findAll(@Query() query: ListStockMovementsQueryDto) {
    return this.stockMovementsService.findAll(query);
  }
}
