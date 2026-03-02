import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { TrackingPollerProcessor } from './tracking-poller.processor';
import { CarriersModule } from '../carriers/carriers.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'tracking-poll' }), CarriersModule],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingPollerProcessor],
  exports: [TrackingService],
})
export class TrackingModule {}
