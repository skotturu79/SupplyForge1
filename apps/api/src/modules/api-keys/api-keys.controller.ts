import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeySchema } from '@supplyforge/validators';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.apiKeysService.list(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = CreateApiKeySchema.parse(body);
    return this.apiKeysService.create(user.tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.apiKeysService.revoke(id, user.tenantId);
  }
}
