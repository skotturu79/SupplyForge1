import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('kpis')
  getKpis(@CurrentUser() user: JwtPayload) {
    return this.analytics.getDashboardKPIs(user.tenantId);
  }

  @Get('trends')
  getTrends(@CurrentUser() user: JwtPayload, @Query('days') days: string) {
    return this.analytics.getDocumentTrends(user.tenantId, parseInt(days || '30'));
  }
}
