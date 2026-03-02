import { Module } from '@nestjs/common';
import { CarriersController } from './carriers.controller';
import { FedexAdapter } from './adapters/fedex.adapter';
import { UpsAdapter } from './adapters/ups.adapter';
import { CarrierService } from './carriers.service';

@Module({
  controllers: [CarriersController],
  providers: [CarrierService, FedexAdapter, UpsAdapter],
  exports: [CarrierService],
})
export class CarriersModule {}
