import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateApiKey } from '@supplyforge/crypto';
import type { CreateApiKey } from '@supplyforge/validators';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateApiKey) {
    const { rawKey, keyHash, keyPrefix } = generateApiKey();

    await this.prisma.apiKey.create({
      data: {
        tenantId,
        name: dto.name,
        keyHash,
        keyPrefix,
        scopes: dto.scopes,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        rateLimit: dto.rateLimit || 1000,
        isActive: true,
      },
    });

    // Return rawKey ONCE — never stored in plaintext
    return { rawKey, keyPrefix, name: dto.name, scopes: dto.scopes };
  }

  async list(tenantId: string) {
    return this.prisma.apiKey.findMany({
      where: { tenantId },
      select: {
        id: true, name: true, keyPrefix: true, scopes: true,
        isActive: true, lastUsedAt: true, expiresAt: true, callCount: true, createdAt: true,
      },
    });
  }

  async revoke(id: string, tenantId: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key || key.tenantId !== tenantId) throw new NotFoundException('API key not found');
    return this.prisma.apiKey.update({ where: { id }, data: { isActive: false } });
  }
}
