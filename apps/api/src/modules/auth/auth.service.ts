import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { PrismaService } from '../../prisma/prisma.service';
import { generateResetToken } from '@supplyforge/crypto';
import type { RegisterBusiness, Login } from '@supplyforge/validators';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Registration ───────────────────────────────────────────────

  async registerBusiness(dto: RegisterBusiness) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);
    const slug = dto.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.companyName,
        slug: `${slug}-${Date.now().toString(36)}`,
        type: 'BUSINESS',
        country: dto.country,
        website: dto.website,
        vatId: dto.vatId,
        dunsNumber: dto.dunsNumber,
        planTier: dto.planTier || 'FREE',
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
      },
      include: { users: true },
    });

    const user = tenant.users[0];
    this.logger.log(`Business registered: ${tenant.name} (${tenant.id})`);

    return this.issueTokens(user.id, tenant.id, user.email, user.role, {
      firstName: user.firstName,
      lastName: user.lastName,
      tenantName: tenant.name,
      tenantType: tenant.type,
    });
  }

  // ── Login ──────────────────────────────────────────────────────

  async login(dto: Login) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    if (user.tenant.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account suspended');
    }

    // MFA check
    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        return { requiresMfa: true, userId: user.id };
      }
      const valid = authenticator.verify({
        token: dto.mfaCode,
        secret: user.mfaSecret!,
      });
      if (!valid) throw new UnauthorizedException('Invalid MFA code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user.id, user.tenantId, user.email, user.role, {
      firstName: user.firstName,
      lastName: user.lastName,
      tenantName: user.tenant.name,
      tenantType: user.tenant.type,
    });
  }

  // ── Token Refresh ──────────────────────────────────────────────

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      include: { tenant: true },
    });
    if (!user) throw new UnauthorizedException('User not found');

    // Rotate refresh token
    await this.prisma.refreshToken.delete({ where: { token } });

    return this.issueTokens(user.id, user.tenantId, user.email, user.role, {
      firstName: user.firstName,
      lastName: user.lastName,
      tenantName: user.tenant.name,
      tenantType: user.tenant.type,
    });
  }

  // ── Password Reset ─────────────────────────────────────────────

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silently ignore — avoid user enumeration

    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 3_600_000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiresAt: expiresAt },
    });

    // TODO: emit email event via EventEmitter2
    this.logger.log(`Password reset requested for ${email}`);
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { resetToken, resetTokenExpiresAt: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException('Invalid or expired reset token');

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
    });
  }

  // ── MFA Setup ──────────────────────────────────────────────────

  async setupMfa(userId: string) {
    const secret = authenticator.generateSecret();
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const otpauthUrl = authenticator.keyuri(user.email, 'SupplyForge', secret);

    // Store secret temporarily (not enabled until verified)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return { secret, otpauthUrl };
  }

  async confirmMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.mfaSecret) throw new BadRequestException('MFA setup not initiated');

    const valid = authenticator.verify({ token: code, secret: user.mfaSecret });
    if (!valid) throw new BadRequestException('Invalid MFA code');

    await this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
    return { message: 'MFA enabled successfully' };
  }

  // ── Helpers ────────────────────────────────────────────────────

  private async issueTokens(
    userId: string,
    tenantId: string,
    email: string,
    role: string,
    meta: { firstName: string; lastName: string; tenantName: string; tenantType: string },
  ) {
    const payload = { sub: userId, tenantId, email, role };

    const accessToken = await this.jwt.signAsync(payload);

    const rawRefreshToken = generateResetToken();
    const refreshExpires = new Date(
      Date.now() + this.parseDuration(this.config.get('JWT_REFRESH_EXPIRES', '7d')),
    );

    await this.prisma.refreshToken.create({
      data: { token: rawRefreshToken, userId, expiresAt: refreshExpires },
    });

    const user = {
      id: userId,
      email,
      firstName: meta.firstName,
      lastName: meta.lastName,
      tenantId,
      tenantName: meta.tenantName,
      tenantType: meta.tenantType,
      role,
    };

    return { token: accessToken, user, accessToken, refreshToken: rawRefreshToken, tokenType: 'Bearer' };
  }

  private parseDuration(s: string): number {
    const map: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    const match = s.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 86_400_000;
    return parseInt(match[1]) * map[match[2]];
  }
}
