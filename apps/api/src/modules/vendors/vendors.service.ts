import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import * as argon2 from 'argon2';
import type { VendorRegister } from '@supplyforge/validators';

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async register(dto: VendorRegister) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);
    const slug = dto.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.companyName,
        slug,
        type: 'VENDOR',
        status: 'PENDING',
        country: dto.country,
        website: dto.website,
        vatId: dto.vatId,
        planTier: 'FREE',
        address: {},
        users: {
          create: {
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            passwordHash,
            role: 'ADMIN',
          },
        },
        vendorProfile: {
          create: {
            categories: dto.categories,
            verificationStatus: 'PENDING',
          },
        },
      },
      include: { users: true },
    });

    this.events.emit('vendor.registered', { tenantId: tenant.id });
    this.logger.log(`Vendor registered: ${tenant.name}`);

    return { tenantId: tenant.id, message: 'Registration submitted. Awaiting verification.' };
  }

  async getVendorDirectory(q?: string) {
    return this.prisma.tenant.findMany({
      where: {
        type: 'VENDOR',
        status: 'VERIFIED',
        ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
      },
      select: {
        id: true, name: true, slug: true, country: true, website: true,
        vendorProfile: { select: { categories: true, rating: true } },
      },
      take: 50,
    });
  }

  async getDataFeed(vendorTenantId: string, partnerTenantId: string) {
    // Verify partner has approved connection and data sharing enabled
    const connection = await this.prisma.partnerConnection.findFirst({
      where: {
        OR: [
          { requesterTenantId: partnerTenantId, targetTenantId: vendorTenantId },
          { requesterTenantId: vendorTenantId, targetTenantId: partnerTenantId },
        ],
        status: 'APPROVED',
      },
    });
    if (!connection) return null;

    const config = connection.dataSharingConfig as Record<string, boolean>;
    const feed: Record<string, unknown> = {};

    if (config?.shareInventory) {
      feed.inventory = await this.prisma.inventoryRecord.findMany({
        where: { tenantId: vendorTenantId },
        select: { sku: true, quantity: true, location: true, updatedAt: true },
        take: 100,
      });
    }

    if (config?.shareOrders) {
      feed.recentOrders = await this.prisma.document.count({
        where: {
          OR: [
            { senderTenantId: vendorTenantId, receiverTenantId: partnerTenantId },
            { senderTenantId: partnerTenantId, receiverTenantId: vendorTenantId },
          ],
          type: 'PO',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
        },
      });
    }

    return feed;
  }
}
