import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { VendorRegisterSchema } from '@supplyforge/validators';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Public()
  @Post('register')
  register(@Body() body: unknown) {
    const dto = VendorRegisterSchema.parse(body);
    return this.vendorsService.register(dto);
  }

  @Public()
  @Get('directory')
  directory(@Query('q') q?: string) {
    return this.vendorsService.getVendorDirectory(q);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  getFeed(@CurrentUser() user: JwtPayload, @Query('vendorId') vendorId: string) {
    return this.vendorsService.getDataFeed(vendorId, user.tenantId);
  }
}
