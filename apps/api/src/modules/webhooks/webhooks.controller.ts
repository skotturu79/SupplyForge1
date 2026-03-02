import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookSchema } from '@supplyforge/validators';

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.webhooks.listWebhooks(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = CreateWebhookSchema.parse(body);
    return this.webhooks.createWebhook(user.tenantId, dto as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.webhooks.deleteWebhook(id, user.tenantId);
  }
}
