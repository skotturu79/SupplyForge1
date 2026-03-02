import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { TerminusModule } from '@nestjs/terminus';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { PartnersModule } from './modules/partners/partners.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CarriersModule } from './modules/carriers/carriers.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { StorageModule } from './modules/storage/storage.module';
import { AiModule } from './modules/ai/ai.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // ── Config ───────────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),

    // ── Rate Limiting ─────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          { name: 'global', ttl: 60_000, limit: config.get('RATE_LIMIT_GLOBAL', 100) },
        ],
      }),
    }),

    // ── Event Bus ─────────────────────────────────────────────────
    EventEmitterModule.forRoot({ wildcard: true }),

    // ── Bull Queues ───────────────────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: { host: new URL(config.get('REDIS_URL', 'redis://localhost:6379')).hostname },
      }),
    }),

    // ── Health ────────────────────────────────────────────────────
    TerminusModule,

    // ── Core ──────────────────────────────────────────────────────
    PrismaModule,
    StorageModule,

    // ── Feature modules ───────────────────────────────────────────
    AuthModule,
    TenantsModule,
    UsersModule,
    PartnersModule,
    VendorsModule,
    DocumentsModule,
    CarriersModule,
    TrackingModule,
    WebhooksModule,
    AnalyticsModule,
    ApiKeysModule,
    AiModule,
    HealthModule,
  ],
})
export class AppModule {}
