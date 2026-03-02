import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PartnersService } from './partners.service';
import { ConnectPartnerSchema } from '@supplyforge/validators';

@Controller('partners')
@UseGuards(JwtAuthGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  getConnections(@CurrentUser() user: JwtPayload) {
    return this.partnersService.getConnections(user.tenantId);
  }

  @Get('search')
  search(@Query('q') q: string, @CurrentUser() user: JwtPayload) {
    return this.partnersService.searchTenants(q, user.tenantId);
  }

  @Post('connect')
  connect(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = ConnectPartnerSchema.parse(body);
    return this.partnersService.requestConnection(user.tenantId, dto);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.partnersService.approveConnection(id, user.tenantId);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { reason?: string },
  ) {
    return this.partnersService.rejectConnection(id, user.tenantId, body.reason);
  }
}
