import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, lastLoginAt: true, createdAt: true },
    });
  }

  async inviteUser(tenantId: string, dto: { email: string; role: string; firstName: string; lastName: string }) {
    // In production: send invite email with temp password / magic link
    return this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role as never,
        passwordHash: 'INVITE_PENDING',
      },
      select: { id: true, email: true, role: true },
    });
  }

  async updateRole(userId: string, tenantId: string, role: string, actorRole: string) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(actorRole)) {
      throw new ForbiddenException('Only admins can change roles');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tenantId !== tenantId) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id: userId }, data: { role: role as never } });
  }
}
