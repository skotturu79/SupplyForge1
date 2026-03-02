import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardKPIs(tenantId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [
      totalDocuments,
      documentsThisMonth,
      totalPartners,
      pendingInvoices,
      shipmentsInTransit,
      tenant,
    ] = await Promise.all([
      this.prisma.document.count({
        where: { OR: [{ senderTenantId: tenantId }, { receiverTenantId: tenantId }] },
      }),
      this.prisma.document.count({
        where: {
          OR: [{ senderTenantId: tenantId }, { receiverTenantId: tenantId }],
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.partnerConnection.count({
        where: { OR: [{ requesterTenantId: tenantId }, { targetTenantId: tenantId }], status: 'APPROVED' },
      }),
      this.prisma.document.findMany({
        where: { receiverTenantId: tenantId, type: 'INVOICE', status: { in: ['SENT', 'ACKNOWLEDGED'] } },
        select: { totalAmount: true },
      }),
      this.prisma.shipment.count({ where: { tenantId, status: 'IN_TRANSIT' } }),
      this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { apiCallsUsed: true } }),
    ]);

    const pendingInvoiceValue = pendingInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);

    return {
      totalDocuments,
      documentsThisMonth,
      totalPartners,
      activePartners: totalPartners,
      pendingInvoices: pendingInvoices.length,
      pendingInvoiceValue,
      shipmentsInTransit,
      onTimeDeliveryRate: 0,    // computed by separate analytics job
      invoiceMatchRate: 0,      // computed by separate analytics job
      apiCallsThisMonth: tenant.apiCallsUsed,
    };
  }

  async getDocumentTrends(tenantId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    return this.prisma.$queryRaw`
      SELECT
        DATE_TRUNC('day', created_at) AS date,
        type,
        COUNT(*) AS count
      FROM documents
      WHERE (sender_tenant_id = ${tenantId} OR receiver_tenant_id = ${tenantId})
        AND created_at >= ${since}
      GROUP BY 1, 2
      ORDER BY 1
    `;
  }
}
