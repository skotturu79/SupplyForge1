import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CarrierService } from './carriers.service';
import { GenerateLabelSchema } from '@supplyforge/validators';

@Controller('carriers')
@UseGuards(JwtAuthGuard)
export class CarriersController {
  constructor(private readonly carrierService: CarrierService) {}

  @Post(':carrier/labels')
  generateLabel(@Param('carrier') carrier: string, @Body() body: unknown) {
    const dto = GenerateLabelSchema.parse(body);
    return this.carrierService.generateLabel(carrier, dto);
  }

  @Get(':carrier/track/:trackingNumber')
  track(@Param('carrier') carrier: string, @Param('trackingNumber') trackingNumber: string) {
    return this.carrierService.trackShipment(carrier, trackingNumber);
  }
}
