import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { TenantsService } from './tenants.service';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.tenantsService.getProfile(user.tenantId);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.tenantsService.updateProfile(user.tenantId, body);
  }

  @Get('me/usage')
  getUsage(@CurrentUser() user: JwtPayload) {
    return this.tenantsService.getUsage(user.tenantId);
  }
}
