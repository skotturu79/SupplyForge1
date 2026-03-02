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
import { DocumentsService } from './documents.service';
import { PurchaseOrdersService } from './purchase-orders.service';
import { InvoicesService } from './invoices.service';
import { AsnService } from './asn.service';
import {
  DocumentSearchSchema,
  CreatePOSchema,
  CreateInvoiceSchema,
  CreateASNSchema,
  RejectDocumentSchema,
  AcknowledgeDocumentSchema,
} from '@supplyforge/validators';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(
    private readonly docsService: DocumentsService,
    private readonly poService: PurchaseOrdersService,
    private readonly invoicesService: InvoicesService,
    private readonly asnService: AsnService,
  ) {}

  // ── General Document Endpoints ────────────────────────────────

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: Record<string, string>) {
    const parsed = DocumentSearchSchema.parse(query);
    return this.docsService.findAll(user.tenantId, parsed);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.docsService.findById(id, user.tenantId);
  }

  @Get(':id/events')
  getEvents(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.docsService.getDocumentEvents(id, user.tenantId);
  }

  @Patch(':id/acknowledge')
  @HttpCode(HttpStatus.OK)
  acknowledge(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, string>,
  ) {
    const parsed = AcknowledgeDocumentSchema.parse(body);
    return this.docsService.updateStatus(id, user.tenantId, 'ACKNOWLEDGED', parsed.comment);
  }

  @Patch(':id/accept')
  @HttpCode(HttpStatus.OK)
  accept(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.docsService.updateStatus(id, user.tenantId, 'ACCEPTED');
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, string>,
  ) {
    const parsed = RejectDocumentSchema.parse(body);
    return this.docsService.updateStatus(id, user.tenantId, 'REJECTED', parsed.reason);
  }

  // ── Purchase Orders ───────────────────────────────────────────

  @Post('po')
  createPO(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = CreatePOSchema.parse(body);
    return this.poService.create(user.tenantId, dto);
  }

  @Post('po/:id/send')
  @HttpCode(HttpStatus.OK)
  sendPO(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.poService.send(id, user.tenantId);
  }

  @Post('po/:id/sscc')
  generateSSCC(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { gs1CompanyPrefix: string },
  ) {
    return this.poService.generateSSCCForPO(id, user.tenantId, body.gs1CompanyPrefix);
  }

  // ── Invoices ──────────────────────────────────────────────────

  @Post('invoice')
  createInvoice(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = CreateInvoiceSchema.parse(body);
    return this.invoicesService.create(user.tenantId, dto);
  }

  @Post('invoice/:id/match')
  @HttpCode(HttpStatus.OK)
  matchInvoice(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { poReference: string },
  ) {
    return this.invoicesService.attemptThreeWayMatch(id, body.poReference, user.tenantId);
  }

  // ── ASN ───────────────────────────────────────────────────────

  @Post('asn')
  createASN(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = CreateASNSchema.parse(body);
    return this.asnService.create(user.tenantId, dto);
  }
}
