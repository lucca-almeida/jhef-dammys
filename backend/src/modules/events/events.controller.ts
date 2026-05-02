import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ConvertBudgetToEventDto } from './dto/convert-budget-to-event.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Post('from-budget/:budgetId')
  createFromBudget(
    @Param('budgetId') budgetId: string,
    @Body() payload: ConvertBudgetToEventDto,
  ) {
    return this.eventsService.createFromBudget(budgetId, payload);
  }

  @Get()
  findAll(@Query() query: ListEventsQueryDto) {
    return this.eventsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }
}
