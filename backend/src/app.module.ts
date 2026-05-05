import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { ClientsModule } from './modules/clients/clients.module';
import { CostsModule } from './modules/costs/costs.module';
import { EventsModule } from './modules/events/events.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProductsModule } from './modules/products/products.module';
import { ServicesModule } from './modules/services/services.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ClientsModule,
    BudgetsModule,
    CostsModule,
    EventsModule,
    PaymentsModule,
    ProductsModule,
    ServicesModule,
  ],
})
export class AppModule {}
