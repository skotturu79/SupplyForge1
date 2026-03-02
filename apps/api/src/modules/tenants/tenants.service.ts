import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async getProfile(tenantId: string) {
    return this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  }

  async updateProfile(tenantId: string, data: Record<string, unknown>) {
    return this.prisma.tenant.update({ where: { id: tenantId }, data });
  }

  async getUsage(tenantId: string) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const [docCount, partnerCount, apiCallsThisMonth] = await Promise.all([
      this.prisma.document.count({ where: { OR: [{ senderTenantId: tenantId }, { receiverTenantId: tenantId }] } }),
      this.prisma.partnerConnection.count({ where: { OR: [{ requesterTenantId: tenantId }, { targetTenantId: tenantId }], status: 'APPROVED' } }),
      Promise.resolve(tenant.apiCallsUsed),
    ]);
    return {
      documents: docCount,
      partners: partnerCount,
      apiCalls: apiCallsThisMonth,
      apiCallsLimit: tenant.apiCallsLimit,
      planTier: tenant.planTier,
    };
  }
}
