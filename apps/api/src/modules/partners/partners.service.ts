import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import type { ConnectPartner } from '@supplyforge/validators';

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async getConnections(tenantId: string) {
    return this.prisma.partnerConnection.findMany({
      where: {
        OR: [{ requesterTenantId: tenantId }, { targetTenantId: tenantId }],
      },
      include: {
        requester: { select: { id: true, name: true, slug: true, country: true } },
        target: { select: { id: true, name: true, slug: true, country: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async requestConnection(requesterTenantId: string, dto: ConnectPartner) {
    if (requesterTenantId === dto.targetTenantId) {
      throw new ForbiddenException('Cannot connect to yourself');
    }

    const target = await this.prisma.tenant.findUnique({ where: { id: dto.targetTenantId } });
    if (!target) throw new NotFoundException('Target tenant not found');

    const existing = await this.prisma.partnerConnection.findFirst({
      where: {
        OR: [
          { requesterTenantId, targetTenantId: dto.targetTenantId },
          { requesterTenantId: dto.targetTenantId, targetTenantId: requesterTenantId },
        ],
      },
    });

    if (existing) {
      throw new ConflictException(`Connection already exists with status: ${existing.status}`);
    }

    const connection = await this.prisma.partnerConnection.create({
      data: {
        requesterTenantId,
        targetTenantId: dto.targetTenantId,
        tier: dto.tier || 'STANDARD',
        status: 'PENDING',
        dataSharingConfig: dto.dataSharingConfig,
        message: dto.message,
      },
      include: {
        requester: { select: { id: true, name: true } },
        target: { select: { id: true, name: true } },
      },
    });

    this.events.emit('partner.connected', {
      connectionId: connection.id,
      requesterTenantId,
      targetTenantId: dto.targetTenantId,
    });

    return connection;
  }

  async approveConnection(connectionId: string, tenantId: string) {
    const connection = await this.prisma.partnerConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) throw new NotFoundException('Connection not found');
    if (connection.targetTenantId !== tenantId) {
      throw new ForbiddenException('Only the target tenant can approve connections');
    }
    if (connection.status !== 'PENDING') {
      throw new ForbiddenException('Connection is not in PENDING state');
    }

    const updated = await this.prisma.partnerConnection.update({
      where: { id: connectionId },
      data: { status: 'APPROVED', approvedAt: new Date() },
    });

    this.events.emit('partner.approved', {
      connectionId,
      requesterTenantId: connection.requesterTenantId,
      targetTenantId: connection.targetTenantId,
    });

    return updated;
  }

  async rejectConnection(connectionId: string, tenantId: string, reason?: string) {
    const connection = await this.prisma.partnerConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) throw new NotFoundException('Connection not found');
    if (connection.targetTenantId !== tenantId) {
      throw new ForbiddenException('Only the target tenant can reject connections');
    }

    return this.prisma.partnerConnection.update({
      where: { id: connectionId },
      data: { status: 'REJECTED', metadata: { rejectionReason: reason } },
    });
  }

  async searchTenants(q: string, currentTenantId: string) {
    if (!q || q.length < 2) return [];
    return this.prisma.tenant.findMany({
      where: {
        AND: [
          { id: { not: currentTenantId } },
          { status: 'VERIFIED' },
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: { id: true, name: true, slug: true, country: true, type: true },
      take: 20,
    });
  }
}
