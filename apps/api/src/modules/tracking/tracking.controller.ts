import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { TrackingService } from './tracking.service';

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':id')
  getShipment(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.trackingService.getShipment(id, user.tenantId);
  }

  @Post(':id/refresh')
  refresh(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.trackingService.refreshTracking(id, user.tenantId);
  }
}
