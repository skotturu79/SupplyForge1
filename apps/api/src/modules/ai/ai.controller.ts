import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('invoice/:id/suggest-match')
  suggestMatch(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ai.suggestInvoiceMatch(id, user.tenantId);
  }

  @Post('document/:id/analyze')
  analyze(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: { question: string }) {
    return this.ai.analyzeDocument(id, user.tenantId, body.question);
  }
}
