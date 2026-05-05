import { PartialType } from '@nestjs/mapped-types';
import { CreateEventCostDto } from './create-event-cost.dto';

export class UpdateEventCostDto extends PartialType(CreateEventCostDto) {}
