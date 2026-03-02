// ══════════════════════════════════════════════════════════════════
// SupplyForge — Prisma Seed Script
// Run: pnpm db:seed  (from apps/api/)
// ══════════════════════════════════════════════════════════════════

import { PrismaClient, TenantType, TenantStatus, PlanTier, UserRole,
         DocumentType, DocumentStatus, ConnectionStatus, ConnectionTier,
         CarrierCode, VerificationStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────
const hashKey  = (k: string) => crypto.createHash('sha256').update(k).digest('hex');
const hmacKey  = () => crypto.randomBytes(32).toString('hex');
const ago      = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return d; };
const fromNow  = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return d; };

async function main() {
  console.log('🌱  Seeding SupplyForge database…');

  // ── Passwords ────────────────────────────────────────────────────
  const pw = await argon2.hash('Demo1234!');

  // ── Tenants ──────────────────────────────────────────────────────
  const bizTenant = await prisma.tenant.upsert({
    where: { slug: 'acme-manufacturing' },
    update: {},
    create: {
      name: 'Acme Manufacturing Co.',
      slug: 'acme-manufacturing',
      type: TenantType.BUSINESS,
      status: TenantStatus.VERIFIED,
      planTier: PlanTier.ENTERPRISE,
      country: 'US',
      website: 'https://acme-mfg.example.com',
      vatId: 'US-VAT-123456',
      address: { street: '100 Industrial Blvd', city: 'Chicago', state: 'IL', zip: '60601' },
      apiCallsLimit: 50000,
    },
  });

  const vendor1 = await prisma.tenant.upsert({
    where: { slug: 'globalparts-ltd' },
    update: {},
    create: {
      name: 'GlobalParts Ltd.',
      slug: 'globalparts-ltd',
      type: TenantType.VENDOR,
      status: TenantStatus.VERIFIED,
      planTier: PlanTier.PRO,
      country: 'DE',
      website: 'https://globalparts.example.com',
      vatId: 'DE-VAT-987654',
      address: { street: 'Industriestr. 45', city: 'Munich', zip: '80331' },
      apiCallsLimit: 10000,
    },
  });

  const vendor2 = await prisma.tenant.upsert({
    where: { slug: 'fastship-logistics' },
    update: {},
    create: {
      name: 'FastShip Logistics',
      slug: 'fastship-logistics',
      type: TenantType.VENDOR,
      status: TenantStatus.VERIFIED,
      planTier: PlanTier.PRO,
      country: 'GB',
      website: 'https://fastship.example.com',
      address: { street: '22 Commerce St', city: 'London', zip: 'EC1A 1BB' },
      apiCallsLimit: 10000,
    },
  });

  const vendor3 = await prisma.tenant.upsert({
    where: { slug: 'precisioncast-inc' },
    update: {},
    create: {
      name: 'PrecisionCast Inc.',
      slug: 'precisioncast-inc',
      type: TenantType.VENDOR,
      status: TenantStatus.PENDING,
      planTier: PlanTier.FREE,
      country: 'MX',
      address: { street: 'Av. Industria 78', city: 'Monterrey', zip: '64000' },
      apiCallsLimit: 1000,
    },
  });

  console.log('  ✓  Tenants');

  // ── Vendor Profiles ───────────────────────────────────────────────
  await prisma.vendorProfile.upsert({
    where: { tenantId: vendor1.id },
    update: {},
    create: {
      tenantId: vendor1.id,
      categories: ['Electronics', 'Mechanical Parts', 'Fasteners'],
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedAt: ago(180),
      rating: 4.7,
      reviewCount: 38,
      certifications: [{ name: 'ISO 9001', issuedAt: '2023-01-01' }, { name: 'RoHS', issuedAt: '2022-06-15' }],
      preferredCurrencies: ['USD', 'EUR'],
      leadTimeDays: 7,
      moq: 100,
    },
  });

  await prisma.vendorProfile.upsert({
    where: { tenantId: vendor2.id },
    update: {},
    create: {
      tenantId: vendor2.id,
      categories: ['Logistics', 'Freight', 'Last-Mile'],
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedAt: ago(120),
      rating: 4.2,
      reviewCount: 21,
      certifications: [{ name: 'ISO 28000', issuedAt: '2023-03-01' }],
      preferredCurrencies: ['USD', 'GBP'],
      leadTimeDays: 2,
      moq: 1,
    },
  });

  await prisma.vendorProfile.upsert({
    where: { tenantId: vendor3.id },
    update: {},
    create: {
      tenantId: vendor3.id,
      categories: ['Casting', 'Metal Fabrication'],
      verificationStatus: VerificationStatus.PENDING,
      certifications: [],
      preferredCurrencies: ['USD', 'MXN'],
      leadTimeDays: 14,
      moq: 500,
    },
  });

  console.log('  ✓  Vendor profiles');

  // ── Users ─────────────────────────────────────────────────────────
  const bizAdmin = await prisma.user.upsert({
    where: { email: 'john.smith@acme-mfg.com' },
    update: {},
    create: { tenantId: bizTenant.id, email: 'john.smith@acme-mfg.com', firstName: 'John',   lastName: 'Smith',    passwordHash: pw, role: UserRole.ADMIN,    mfaEnabled: false, lastLoginAt: ago(0) },
  });
  await prisma.user.upsert({
    where: { email: 'emily.chen@acme-mfg.com' },
    update: {},
    create: { tenantId: bizTenant.id, email: 'emily.chen@acme-mfg.com', firstName: 'Emily',  lastName: 'Chen',     passwordHash: pw, role: UserRole.MANAGER,  mfaEnabled: false, lastLoginAt: ago(1) },
  });
  await prisma.user.upsert({
    where: { email: 'carlos.m@acme-mfg.com' },
    update: {},
    create: { tenantId: bizTenant.id, email: 'carlos.m@acme-mfg.com',   firstName: 'Carlos', lastName: 'Martinez', passwordHash: pw, role: UserRole.OPERATOR, mfaEnabled: false, lastLoginAt: ago(2) },
  });
  await prisma.user.upsert({
    where: { email: 'sarah.j@globalparts.com' },
    update: {},
    create: { tenantId: vendor1.id, email: 'sarah.j@globalparts.com', firstName: 'Sarah', lastName: 'Jones', passwordHash: pw, role: UserRole.ADMIN, mfaEnabled: false, lastLoginAt: ago(0) },
  });
  await prisma.user.upsert({
    where: { email: 'tom.b@fastship.com' },
    update: {},
    create: { tenantId: vendor2.id, email: 'tom.b@fastship.com', firstName: 'Tom', lastName: 'Brown', passwordHash: pw, role: UserRole.ADMIN, mfaEnabled: false, lastLoginAt: ago(3) },
  });

  console.log('  ✓  Users  (password: Demo1234!)');

  // ── Partner Connections ────────────────────────────────────────────
  const conn1 = await prisma.partnerConnection.upsert({
    where: { requesterTenantId_targetTenantId: { requesterTenantId: bizTenant.id, targetTenantId: vendor1.id } },
    update: {},
    create: { requesterTenantId: bizTenant.id, targetTenantId: vendor1.id, status: ConnectionStatus.APPROVED, tier: ConnectionTier.TRUSTED,   approvedAt: ago(200), message: 'Looking forward to working together!' },
  });
  const conn2 = await prisma.partnerConnection.upsert({
    where: { requesterTenantId_targetTenantId: { requesterTenantId: bizTenant.id, targetTenantId: vendor2.id } },
    update: {},
    create: { requesterTenantId: bizTenant.id, targetTenantId: vendor2.id, status: ConnectionStatus.APPROVED, tier: ConnectionTier.PREFERRED, approvedAt: ago(160), message: 'Partnership request for logistics support.' },
  });
  await prisma.partnerConnection.upsert({
    where: { requesterTenantId_targetTenantId: { requesterTenantId: bizTenant.id, targetTenantId: vendor3.id } },
    update: {},
    create: { requesterTenantId: bizTenant.id, targetTenantId: vendor3.id, status: ConnectionStatus.PENDING, tier: ConnectionTier.STANDARD, message: 'Interested in your casting capabilities.' },
  });

  console.log('  ✓  Partner connections');

  // ── Documents ──────────────────────────────────────────────────────
  const docs = [
    { senderTenantId: bizTenant.id, receiverTenantId: vendor1.id, type: DocumentType.PO,      status: DocumentStatus.ACCEPTED,     ref: 'PO-2026-0041',  amount: 48500, currency: 'USD', due: fromNow(20),  created: ago(44) },
    { senderTenantId: vendor1.id,   receiverTenantId: bizTenant.id, type: DocumentType.INVOICE, status: DocumentStatus.PAID,         ref: 'INV-2026-0089', amount: 22800, currency: 'USD', due: fromNow(-13), created: ago(34) },
    { senderTenantId: vendor2.id,   receiverTenantId: bizTenant.id, type: DocumentType.ASN,     status: DocumentStatus.ACKNOWLEDGED, ref: 'ASN-2026-0033', amount: 0,     currency: 'USD', due: null,         created: ago(22) },
    { senderTenantId: bizTenant.id, receiverTenantId: vendor1.id, type: DocumentType.PO,      status: DocumentStatus.SENT,         ref: 'PO-2026-0055',  amount: 31200, currency: 'EUR', due: fromNow(37),  created: ago(18) },
    { senderTenantId: vendor1.id,   receiverTenantId: bizTenant.id, type: DocumentType.INVOICE, status: DocumentStatus.DISPUTED,     ref: 'INV-2026-0102', amount: 15600, currency: 'USD', due: fromNow(5),   created: ago(15) },
    { senderTenantId: bizTenant.id, receiverTenantId: vendor2.id, type: DocumentType.PO,      status: DocumentStatus.ACKNOWLEDGED, ref: 'PO-2026-0062',  amount: 9800,  currency: 'GBP', due: fromNow(6),   created: ago(13) },
    { senderTenantId: bizTenant.id, receiverTenantId: vendor1.id, type: DocumentType.PO,      status: DocumentStatus.DRAFT,        ref: 'PO-2026-0071',  amount: 67300, currency: 'USD', due: fromNow(66),  created: ago(5)  },
    { senderTenantId: vendor2.id,   receiverTenantId: bizTenant.id, type: DocumentType.ASN,     status: DocumentStatus.SENT,         ref: 'ASN-2026-0047', amount: 0,     currency: 'USD', due: null,         created: ago(3)  },
    { senderTenantId: vendor1.id,   receiverTenantId: bizTenant.id, type: DocumentType.INVOICE, status: DocumentStatus.SENT,         ref: 'INV-2026-0114', amount: 41000, currency: 'EUR', due: fromNow(25),  created: ago(2)  },
    { senderTenantId: bizTenant.id, receiverTenantId: vendor1.id, type: DocumentType.PO,      status: DocumentStatus.REJECTED,     ref: 'PO-2025-0198',  amount: 5200,  currency: 'USD', due: ago(39),      created: ago(65) },
  ];

  for (const d of docs) {
    await prisma.document.upsert({
      where: { referenceNumber: d.ref },
      update: {},
      create: {
        senderTenantId: d.senderTenantId,
        receiverTenantId: d.receiverTenantId,
        type: d.type,
        status: d.status,
        referenceNumber: d.ref,
        currency: d.currency,
        totalAmount: d.amount,
        dueDate: d.due,
        sentAt: d.status !== DocumentStatus.DRAFT ? d.created : null,
        createdAt: d.created,
        updatedAt: d.created,
        metadata: {},
      },
    });
  }

  console.log('  ✓  Documents');

  // ── Shipments ─────────────────────────────────────────────────────
  const ship1 = await prisma.shipment.create({
    data: {
      tenantId: bizTenant.id, carrier: CarrierCode.FEDEX,
      trackingNumber: '7489234810294837', status: 'IN_TRANSIT',
      estimatedDelivery: fromNow(2),
      origin: { city: 'Munich', country: 'DE' },
      destination: { city: 'Chicago', country: 'US' },
    },
  }).catch(() => null);

  if (ship1) {
    await prisma.shipmentEvent.createMany({ data: [
      { shipmentId: ship1.id, status: 'PICKED_UP',   description: 'Package picked up', location: 'Munich', timestamp: ago(5) },
      { shipmentId: ship1.id, status: 'DEPARTED',    description: 'Departed Frankfurt', location: 'Frankfurt', timestamp: ago(4) },
      { shipmentId: ship1.id, status: 'IN_TRANSIT',  description: 'Cleared US customs', location: 'Memphis, TN', timestamp: ago(2) },
      { shipmentId: ship1.id, status: 'OUT_FOR_DEL', description: 'Out for delivery', location: 'Chicago, IL', timestamp: ago(0) },
    ]});
  }

  const ship2 = await prisma.shipment.create({
    data: {
      tenantId: bizTenant.id, carrier: CarrierCode.UPS,
      trackingNumber: '1Z999AA10123456784', status: 'DELIVERED',
      estimatedDelivery: ago(13), actualDelivery: ago(13),
      origin: { city: 'London', country: 'GB' },
      destination: { city: 'Chicago', country: 'US' },
    },
  }).catch(() => null);

  if (ship2) {
    await prisma.shipmentEvent.createMany({ data: [
      { shipmentId: ship2.id, status: 'PICKED_UP', description: 'Collected from sender', location: 'London',     timestamp: ago(17) },
      { shipmentId: ship2.id, status: 'DELIVERED', description: 'Delivered',              location: 'Chicago, IL', timestamp: ago(13) },
    ]});
  }

  console.log('  ✓  Shipments');

  // ── API Keys ──────────────────────────────────────────────────────
  const rawKey1 = `sf_prod_live_${crypto.randomBytes(16).toString('hex')}`;
  const rawKey2 = `sf_erp_live_${crypto.randomBytes(16).toString('hex')}`;

  await prisma.apiKey.createMany({
    skipDuplicates: true,
    data: [
      { tenantId: bizTenant.id, name: 'Production Integration', keyHash: hashKey(rawKey1), keyPrefix: rawKey1.slice(0, 12), scopes: ['documents:read', 'documents:write', 'partners:read'], rateLimit: 1000, callCount: 8432n, lastUsedAt: ago(0) },
      { tenantId: bizTenant.id, name: 'ERP Connector',          keyHash: hashKey(rawKey2), keyPrefix: rawKey2.slice(0, 12), scopes: ['documents:read', 'analytics:read'],                   rateLimit: 500,  callCount: 2190n, lastUsedAt: ago(1) },
    ],
  });

  console.log('  ✓  API keys');

  // ── Webhooks ──────────────────────────────────────────────────────
  await prisma.webhook.createMany({
    skipDuplicates: true,
    data: [
      { tenantId: bizTenant.id, name: 'ERP Document Events', url: 'https://erp.acme-mfg.com/webhooks/supplyforge', secret: hmacKey(), events: ['document.accepted', 'document.rejected', 'document.paid'], isActive: true },
      { tenantId: bizTenant.id, name: 'Slack Notifications', url: 'https://hooks.slack.com/services/T000/B000/xxxx',             secret: hmacKey(), events: ['document.sent', 'partner.connected'],          isActive: true },
    ],
  });

  console.log('  ✓  Webhooks');

  // ── Data Feed ─────────────────────────────────────────────────────
  await prisma.dataFeedSubscription.create({
    data: {
      subscriberTenantId: bizTenant.id,
      partnerTenantId: vendor1.id,
      connectionId: conn1.id,
      feedTypes: ['INVENTORY', 'PRICE_LIST'],
      deliveryMethod: 'WEBHOOK',
      webhookUrl: 'https://erp.acme-mfg.com/feed',
      webhookSecret: hmacKey(),
      lastDeliveredAt: ago(0),
    },
  }).catch(() => null);

  console.log('  ✓  Feed subscriptions');

  // ── Inventory ─────────────────────────────────────────────────────
  await prisma.inventoryRecord.createMany({
    skipDuplicates: true,
    data: [
      { tenantId: vendor1.id, sku: 'GP-BOLT-M8-100',  quantity: 50000, reserved: 5000,  unit: 'EA', costPrice: 0.12,  location: 'Rack A1' },
      { tenantId: vendor1.id, sku: 'GP-PCB-CTL-V2',   quantity: 1200,  reserved: 200,   unit: 'EA', costPrice: 18.50, location: 'Rack B3' },
      { tenantId: vendor1.id, sku: 'GP-BRKT-ALUM-L',  quantity: 8000,  reserved: 1000,  unit: 'EA', costPrice: 2.30,  location: 'Rack C2' },
      { tenantId: vendor2.id, sku: 'FS-PALLET-EUR',   quantity: 500,   reserved: 120,   unit: 'EA', costPrice: 15.00, location: 'Dock 3' },
    ],
  });

  console.log('  ✓  Inventory');

  console.log('\n✅  Seed complete!\n');
  console.log('  Test accounts:');
  console.log('  Business admin : john.smith@acme-mfg.com  / Demo1234!');
  console.log('  Vendor admin   : sarah.j@globalparts.com  / Demo1234!');
  console.log('  Vendor 2 admin : tom.b@fastship.com        / Demo1234!\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
