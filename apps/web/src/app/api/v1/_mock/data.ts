// ── SupplyForge Mock Data Store ─────────────────────────────────
// In-memory mutable store so mutations (POST/PATCH/DELETE) reflect
// immediately within the same server process.

// ── IDs ──────────────────────────────────────────────────────────
export const BIZ_TENANT_ID    = 'tenant-biz-001';
export const VENDOR1_TENANT_ID = 'tenant-v-001';
export const VENDOR2_TENANT_ID = 'tenant-v-002';
export const VENDOR3_TENANT_ID = 'tenant-v-003';

// ── Tenants ───────────────────────────────────────────────────────
export const tenants = [
  {
    id: BIZ_TENANT_ID,
    name: 'Acme Manufacturing Co.',
    slug: 'acme-manufacturing',
    type: 'BUSINESS',
    status: 'VERIFIED',
    planTier: 'ENTERPRISE',
    country: 'US',
    website: 'https://acme-mfg.example.com',
    vatId: 'US-VAT-123456',
    address: { street: '100 Industrial Blvd', city: 'Chicago', state: 'IL', zip: '60601' },
    apiCallsUsed: 4821,
    apiCallsLimit: 50000,
    createdAt: '2025-06-01T08:00:00Z',
  },
  {
    id: VENDOR1_TENANT_ID,
    name: 'GlobalParts Ltd.',
    slug: 'globalparts-ltd',
    type: 'VENDOR',
    status: 'VERIFIED',
    planTier: 'PRO',
    country: 'DE',
    website: 'https://globalparts.example.com',
    vatId: 'DE-VAT-987654',
    address: { street: 'Industriestr. 45', city: 'Munich', country: 'DE', zip: '80331' },
    apiCallsUsed: 1203,
    apiCallsLimit: 10000,
    createdAt: '2025-07-15T10:00:00Z',
  },
  {
    id: VENDOR2_TENANT_ID,
    name: 'FastShip Logistics',
    slug: 'fastship-logistics',
    type: 'VENDOR',
    status: 'VERIFIED',
    planTier: 'PRO',
    country: 'GB',
    website: 'https://fastship.example.com',
    address: { street: '22 Commerce St', city: 'London', zip: 'EC1A 1BB' },
    apiCallsUsed: 752,
    apiCallsLimit: 10000,
    createdAt: '2025-08-01T09:00:00Z',
  },
  {
    id: VENDOR3_TENANT_ID,
    name: 'PrecisionCast Inc.',
    slug: 'precisioncast-inc',
    type: 'VENDOR',
    status: 'PENDING',
    planTier: 'FREE',
    country: 'MX',
    website: 'https://precisioncast.example.com',
    address: { street: 'Av. Industria 78', city: 'Monterrey', zip: '64000' },
    apiCallsUsed: 0,
    apiCallsLimit: 1000,
    createdAt: '2026-01-20T14:00:00Z',
  },
];

// ── Users ────────────────────────────────────────────────────────
export const users = [
  { id: 'user-biz-001', tenantId: BIZ_TENANT_ID, email: 'john.smith@acme-mfg.com',    firstName: 'John',   lastName: 'Smith',   role: 'ADMIN',    mfaEnabled: true,  isActive: true,  lastLoginAt: '2026-02-23T08:30:00Z', createdAt: '2025-06-01T08:00:00Z' },
  { id: 'user-biz-002', tenantId: BIZ_TENANT_ID, email: 'emily.chen@acme-mfg.com',    firstName: 'Emily',  lastName: 'Chen',    role: 'MANAGER',  mfaEnabled: false, isActive: true,  lastLoginAt: '2026-02-22T14:10:00Z', createdAt: '2025-06-05T09:00:00Z' },
  { id: 'user-biz-003', tenantId: BIZ_TENANT_ID, email: 'carlos.m@acme-mfg.com',      firstName: 'Carlos', lastName: 'Martinez',role: 'OPERATOR', mfaEnabled: false, isActive: true,  lastLoginAt: '2026-02-21T11:00:00Z', createdAt: '2025-07-10T10:00:00Z' },
  { id: 'user-biz-004', tenantId: BIZ_TENANT_ID, email: 'lisa.w@acme-mfg.com',        firstName: 'Lisa',   lastName: 'Wang',    role: 'VIEWER',   mfaEnabled: false, isActive: false, lastLoginAt: '2026-01-15T08:00:00Z', createdAt: '2025-09-01T08:00:00Z' },
  { id: 'user-v1-001',  tenantId: VENDOR1_TENANT_ID, email: 'sarah.j@globalparts.com',firstName: 'Sarah',  lastName: 'Jones',   role: 'ADMIN',    mfaEnabled: true,  isActive: true,  lastLoginAt: '2026-02-23T07:00:00Z', createdAt: '2025-07-15T10:00:00Z' },
  { id: 'user-v2-001',  tenantId: VENDOR2_TENANT_ID, email: 'tom.b@fastship.com',      firstName: 'Tom',    lastName: 'Brown',   role: 'ADMIN',    mfaEnabled: false, isActive: true,  lastLoginAt: '2026-02-20T16:00:00Z', createdAt: '2025-08-01T09:00:00Z' },
];

// ── Vendor Profiles ───────────────────────────────────────────────
export const vendorProfiles = [
  { tenantId: VENDOR1_TENANT_ID, categories: ['Electronics', 'Mechanical Parts', 'Fasteners'], verificationStatus: 'VERIFIED', rating: 4.7, reviewCount: 38, leadTimeDays: 7,  moq: 100, preferredCurrencies: ['USD', 'EUR'], certifications: [{ name: 'ISO 9001', issuedAt: '2023-01-01' }, { name: 'RoHS', issuedAt: '2022-06-15' }] },
  { tenantId: VENDOR2_TENANT_ID, categories: ['Logistics', 'Freight', 'Last-Mile'], verificationStatus: 'VERIFIED', rating: 4.2, reviewCount: 21, leadTimeDays: 2,  moq: 1,   preferredCurrencies: ['USD', 'GBP'], certifications: [{ name: 'ISO 28000', issuedAt: '2023-03-01' }] },
  { tenantId: VENDOR3_TENANT_ID, categories: ['Casting', 'Metal Fabrication'], verificationStatus: 'PENDING', rating: null, reviewCount: 0, leadTimeDays: 14, moq: 500, preferredCurrencies: ['USD', 'MXN'], certifications: [] },
];

// ── Partner Connections ────────────────────────────────────────────
export let partnerConnections = [
  { id: 'conn-001', requesterTenantId: BIZ_TENANT_ID, targetTenantId: VENDOR1_TENANT_ID, status: 'APPROVED', tier: 'TRUSTED',    approvedAt: '2025-08-01T00:00:00Z', message: 'Looking forward to working together!', createdAt: '2025-07-28T00:00:00Z' },
  { id: 'conn-002', requesterTenantId: BIZ_TENANT_ID, targetTenantId: VENDOR2_TENANT_ID, status: 'APPROVED', tier: 'PREFERRED',  approvedAt: '2025-09-10T00:00:00Z', message: 'Partnership request for logistics support.', createdAt: '2025-09-05T00:00:00Z' },
  { id: 'conn-003', requesterTenantId: BIZ_TENANT_ID, targetTenantId: VENDOR3_TENANT_ID, status: 'PENDING',  tier: 'STANDARD',   approvedAt: null,                    message: 'Interested in your casting capabilities.', createdAt: '2026-01-22T00:00:00Z' },
];

// ── Documents ─────────────────────────────────────────────────────
export let documents = [
  { id: 'doc-001', senderTenantId: BIZ_TENANT_ID,    receiverTenantId: VENDOR1_TENANT_ID, type: 'PO',      status: 'ACCEPTED',     referenceNumber: 'PO-2026-0041',  currency: 'USD', totalAmount: 48500,  dueDate: '2026-03-15T00:00:00Z', createdAt: '2026-01-10T09:00:00Z', updatedAt: '2026-01-12T10:00:00Z', sentAt: '2026-01-10T09:05:00Z' },
  { id: 'doc-002', senderTenantId: VENDOR1_TENANT_ID, receiverTenantId: BIZ_TENANT_ID,    type: 'INVOICE', status: 'PAID',         referenceNumber: 'INV-2026-0089',  currency: 'USD', totalAmount: 22800,  dueDate: '2026-02-10T00:00:00Z', createdAt: '2026-01-20T11:00:00Z', updatedAt: '2026-02-10T09:30:00Z', sentAt: '2026-01-20T11:05:00Z' },
  { id: 'doc-003', senderTenantId: VENDOR2_TENANT_ID, receiverTenantId: BIZ_TENANT_ID,    type: 'ASN',     status: 'ACKNOWLEDGED', referenceNumber: 'ASN-2026-0033',  currency: 'USD', totalAmount: 0,      dueDate: null,                    createdAt: '2026-02-01T08:00:00Z', updatedAt: '2026-02-01T14:00:00Z', sentAt: '2026-02-01T08:05:00Z' },
  { id: 'doc-004', senderTenantId: BIZ_TENANT_ID,    receiverTenantId: VENDOR1_TENANT_ID, type: 'PO',      status: 'SENT',         referenceNumber: 'PO-2026-0055',  currency: 'EUR', totalAmount: 31200,  dueDate: '2026-04-01T00:00:00Z', createdAt: '2026-02-05T14:00:00Z', updatedAt: '2026-02-05T14:10:00Z', sentAt: '2026-02-05T14:10:00Z' },
  { id: 'doc-005', senderTenantId: VENDOR1_TENANT_ID, receiverTenantId: BIZ_TENANT_ID,    type: 'INVOICE', status: 'DISPUTED',     referenceNumber: 'INV-2026-0102',  currency: 'USD', totalAmount: 15600,  dueDate: '2026-02-28T00:00:00Z', createdAt: '2026-02-08T10:00:00Z', updatedAt: '2026-02-15T11:00:00Z', sentAt: '2026-02-08T10:10:00Z' },
  { id: 'doc-006', senderTenantId: BIZ_TENANT_ID,    receiverTenantId: VENDOR2_TENANT_ID, type: 'PO',      status: 'ACKNOWLEDGED', referenceNumber: 'PO-2026-0062',  currency: 'GBP', totalAmount: 9800,   dueDate: '2026-03-01T00:00:00Z', createdAt: '2026-02-10T09:00:00Z', updatedAt: '2026-02-11T08:00:00Z', sentAt: '2026-02-10T09:15:00Z' },
  { id: 'doc-007', senderTenantId: BIZ_TENANT_ID,    receiverTenantId: VENDOR1_TENANT_ID, type: 'PO',      status: 'DRAFT',        referenceNumber: 'PO-2026-0071',  currency: 'USD', totalAmount: 67300,  dueDate: '2026-04-30T00:00:00Z', createdAt: '2026-02-18T16:00:00Z', updatedAt: '2026-02-18T16:00:00Z', sentAt: null },
  { id: 'doc-008', senderTenantId: VENDOR2_TENANT_ID, receiverTenantId: BIZ_TENANT_ID,    type: 'ASN',     status: 'SENT',         referenceNumber: 'ASN-2026-0047',  currency: 'USD', totalAmount: 0,      dueDate: null,                    createdAt: '2026-02-20T07:30:00Z', updatedAt: '2026-02-20T07:35:00Z', sentAt: '2026-02-20T07:35:00Z' },
  { id: 'doc-009', senderTenantId: VENDOR1_TENANT_ID, receiverTenantId: BIZ_TENANT_ID,    type: 'INVOICE', status: 'SENT',         referenceNumber: 'INV-2026-0114',  currency: 'EUR', totalAmount: 41000,  dueDate: '2026-03-20T00:00:00Z', createdAt: '2026-02-21T12:00:00Z', updatedAt: '2026-02-21T12:05:00Z', sentAt: '2026-02-21T12:05:00Z' },
  { id: 'doc-010', senderTenantId: BIZ_TENANT_ID,    receiverTenantId: VENDOR1_TENANT_ID, type: 'PO',      status: 'REJECTED',     referenceNumber: 'PO-2025-0198',  currency: 'USD', totalAmount: 5200,   dueDate: '2026-01-15T00:00:00Z', createdAt: '2025-12-20T10:00:00Z', updatedAt: '2025-12-22T09:00:00Z', sentAt: '2025-12-20T10:05:00Z' },
];

// ── Document Line Items ────────────────────────────────────────────────
export const documentLineItems: Record<string, Array<{
  id: string; lineNumber: number; sku: string; description: string;
  orderedQty: number; unit: string; unitPrice: number;
}>> = {
  'doc-001': [
    { id: 'li-001-1', lineNumber: 1, sku: 'BOLT-M12-100',  description: 'M12 Hex Bolt, Grade 8.8',          orderedQty: 5000,  unit: 'PCS', unitPrice: 0.85 },
    { id: 'li-001-2', lineNumber: 2, sku: 'NUT-M12-SS',    description: 'M12 Stainless Steel Nut',          orderedQty: 5000,  unit: 'PCS', unitPrice: 0.42 },
    { id: 'li-001-3', lineNumber: 3, sku: 'WASHER-M12',    description: 'M12 Flat Washer',                  orderedQty: 10000, unit: 'PCS', unitPrice: 0.18 },
    { id: 'li-001-4', lineNumber: 4, sku: 'BEARING-6204',  description: '6204 Deep Groove Ball Bearing',    orderedQty: 200,   unit: 'PCS', unitPrice: 4.50 },
  ],
  'doc-004': [
    { id: 'li-004-1', lineNumber: 1, sku: 'PCB-CTRL-V2',  description: 'Control PCB Assembly v2.0',        orderedQty: 150, unit: 'PCS', unitPrice: 120.00 },
    { id: 'li-004-2', lineNumber: 2, sku: 'CONN-USB-C',   description: 'USB-C Connector Assembly',         orderedQty: 500, unit: 'PCS', unitPrice: 2.80  },
    { id: 'li-004-3', lineNumber: 3, sku: 'IC-MCU-32F',   description: 'STM32F4 Microcontroller',          orderedQty: 300, unit: 'PCS', unitPrice: 8.50  },
  ],
  'doc-006': [
    { id: 'li-006-1', lineNumber: 1, sku: 'PKG-STD-L',    description: 'Standard Large Box (50x40x30 cm)', orderedQty: 100, unit: 'PCS', unitPrice: 8.50   },
    { id: 'li-006-2', lineNumber: 2, sku: 'PKG-PALLET',   description: 'Wooden EUR Pallet',                orderedQty: 10,  unit: 'PCS', unitPrice: 45.00  },
    { id: 'li-006-3', lineNumber: 3, sku: 'SVC-FREIGHT',  description: 'Air Freight Service DE to US',     orderedQty: 1,   unit: 'LOT', unitPrice: 9350.00},
  ],
  'doc-007': [
    { id: 'li-007-1', lineNumber: 1, sku: 'CAST-HOUS-A',  description: 'Aluminum Housing Casting, Part A', orderedQty: 500,  unit: 'PCS', unitPrice: 82.00    },
    { id: 'li-007-2', lineNumber: 2, sku: 'CAST-HOUS-B',  description: 'Aluminum Housing Casting, Part B', orderedQty: 500,  unit: 'PCS', unitPrice: 76.50    },
    { id: 'li-007-3', lineNumber: 3, sku: 'CAST-BRACKET', description: 'Steel Mounting Bracket',           orderedQty: 1000, unit: 'PCS', unitPrice: 12.30    },
    { id: 'li-007-4', lineNumber: 4, sku: 'MACHINING',    description: 'CNC Machining Service',            orderedQty: 1,    unit: 'LOT', unitPrice: 32000.00 },
  ],
  'doc-010': [
    { id: 'li-010-1', lineNumber: 1, sku: 'PROTO-GEAR-X', description: 'Prototype Gear Assembly (Rejected Batch)', orderedQty: 50, unit: 'PCS', unitPrice: 104.00 },
  ],
};

// ── Document Line Acknowledgements ─────────────────────────────────────
export let lineAcknowledgements: Record<string, Array<{
  lineItemId: string; confirmedQty: number; status: string; reason?: string;
}>> = {
  'doc-001': [
    { lineItemId: 'li-001-1', confirmedQty: 5000,  status: 'ACCEPTED' },
    { lineItemId: 'li-001-2', confirmedQty: 5000,  status: 'ACCEPTED' },
    { lineItemId: 'li-001-3', confirmedQty: 10000, status: 'ACCEPTED' },
    { lineItemId: 'li-001-4', confirmedQty: 200,   status: 'ACCEPTED' },
  ],
  'doc-006': [
    { lineItemId: 'li-006-1', confirmedQty: 100, status: 'ACCEPTED' },
    { lineItemId: 'li-006-2', confirmedQty: 10,  status: 'ACCEPTED' },
    { lineItemId: 'li-006-3', confirmedQty: 1,   status: 'ACCEPTED' },
  ],
};

// ── Shipments ────────────────────────────────────────────────────
export let shipments = [
  {
    id: 'ship-001', tenantId: BIZ_TENANT_ID, carrier: 'FEDEX', trackingNumber: '7489234810294837',
    status: 'IN_TRANSIT', estimatedDelivery: '2026-02-25T18:00:00Z', actualDelivery: null,
    origin: { city: 'Munich', country: 'DE' }, destination: { city: 'Chicago', country: 'US' },
    createdAt: '2026-02-18T06:00:00Z',
    events: [
      { status: 'PICKED_UP',    description: 'Package picked up by carrier',      location: 'Munich', timestamp: '2026-02-18T08:00:00Z' },
      { status: 'DEPARTED',     description: 'Departed facility',                  location: 'Frankfurt Airport', timestamp: '2026-02-19T02:00:00Z' },
      { status: 'IN_TRANSIT',   description: 'In transit to destination country',  location: 'Memphis, TN', timestamp: '2026-02-21T14:00:00Z' },
      { status: 'OUT_FOR_DEL',  description: 'Out for delivery',                   location: 'Chicago, IL', timestamp: '2026-02-23T09:00:00Z' },
    ],
  },
  {
    id: 'ship-002', tenantId: BIZ_TENANT_ID, carrier: 'UPS', trackingNumber: '1Z999AA10123456784',
    status: 'DELIVERED', estimatedDelivery: '2026-02-10T18:00:00Z', actualDelivery: '2026-02-10T15:23:00Z',
    origin: { city: 'London', country: 'GB' }, destination: { city: 'Chicago', country: 'US' },
    createdAt: '2026-02-05T10:00:00Z',
    events: [
      { status: 'PICKED_UP',    description: 'Package collected from sender',      location: 'London',   timestamp: '2026-02-06T09:00:00Z' },
      { status: 'IN_TRANSIT',   description: 'Cleared customs',                    location: 'Chicago O\'Hare', timestamp: '2026-02-09T06:00:00Z' },
      { status: 'DELIVERED',    description: 'Delivered to front desk',            location: 'Chicago, IL', timestamp: '2026-02-10T15:23:00Z' },
    ],
  },
  {
    id: 'ship-003', tenantId: BIZ_TENANT_ID, carrier: 'DHL', trackingNumber: '1234567890',
    status: 'PENDING', estimatedDelivery: '2026-03-05T18:00:00Z', actualDelivery: null,
    origin: { city: 'Munich', country: 'DE' }, destination: { city: 'Chicago', country: 'US' },
    createdAt: '2026-02-22T14:00:00Z',
    events: [
      { status: 'BOOKED', description: 'Shipment booked, awaiting collection', location: 'Munich', timestamp: '2026-02-22T14:00:00Z' },
    ],
  },
];

// ── API Keys ─────────────────────────────────────────────────────
export let apiKeys = [
  { id: 'key-001', tenantId: BIZ_TENANT_ID, name: 'Production Integration', keyPrefix: 'sf_prod_live', scopes: ['documents:read', 'documents:write', 'partners:read'], isActive: true,  callCount: 8432, lastUsedAt: '2026-02-23T07:55:00Z', createdAt: '2025-09-01T00:00:00Z', expiresAt: '2027-09-01T00:00:00Z' },
  { id: 'key-002', tenantId: BIZ_TENANT_ID, name: 'ERP Connector',          keyPrefix: 'sf_erp_live_', scopes: ['documents:read', 'analytics:read'],                   isActive: true,  callCount: 2190, lastUsedAt: '2026-02-22T18:00:00Z', createdAt: '2025-11-15T00:00:00Z', expiresAt: null },
  { id: 'key-003', tenantId: BIZ_TENANT_ID, name: 'Dev / Sandbox',          keyPrefix: 'sf_dev_test_',  scopes: ['documents:read'],                                    isActive: false, callCount: 55,   lastUsedAt: '2026-01-10T12:00:00Z', createdAt: '2025-12-01T00:00:00Z', expiresAt: null },
];

// ── Webhooks ──────────────────────────────────────────────────────
export let webhooks = [
  { id: 'wh-001', tenantId: BIZ_TENANT_ID, name: 'ERP Document Events',  url: 'https://erp.acme-mfg.com/webhooks/supplyforge', events: ['document.accepted', 'document.rejected', 'document.paid'], isActive: true,  createdAt: '2025-09-05T00:00:00Z' },
  { id: 'wh-002', tenantId: BIZ_TENANT_ID, name: 'Slack Notifications',  url: 'https://hooks.slack.com/services/T000/B000/xxxx',             events: ['document.sent', 'partner.connected'],                    isActive: true,  createdAt: '2025-10-01T00:00:00Z' },
  { id: 'wh-003', tenantId: BIZ_TENANT_ID, name: 'Legacy Audit System',  url: 'https://audit.internal.acme.com/ingest',                     events: ['document.created'],                                      isActive: false, createdAt: '2025-06-15T00:00:00Z' },
];

// ── Shipping Labels ───────────────────────────────────────────────
export let shippingLabels = [
  {
    id: 'lbl-001',
    type: 'SHIPPING',
    tenantId: VENDOR1_TENANT_ID,
    carrier: 'FEDEX',
    service: 'FEDEX_INTERNATIONAL_PRIORITY',
    trackingNumber: '7489234810294837',
    labelFormat: 'PDF',
    labelUrl: '/api/v1/carriers/FEDEX/labels/lbl-001/download',
    sscc: '00012345678901234567',
    shipDate: '2026-02-18T06:00:00Z',
    estimatedDelivery: '2026-02-25T18:00:00Z',
    fromAddress: { name: 'GlobalParts Ltd.', street: 'Industriestr. 45', city: 'Munich', state: '', zip: '80331', country: 'DE', phone: '+49-89-123456' },
    toAddress:   { name: 'Acme Manufacturing Co.', street: '100 Industrial Blvd', city: 'Chicago', state: 'IL', zip: '60601', country: 'US', phone: '+1-312-555-0100' },
    weight: 12.5,
    weightUnit: 'KG',
    dimensions: { l: 40, w: 30, h: 20, unit: 'CM' },
    rateCharged: 84.50,
    referenceNumber: 'PO-2026-0041',
    orderId: 'doc-001',
    isReturn: false,
    signatureRequired: true,
    createdAt: '2026-02-18T05:45:00Z',
  },
  {
    id: 'lbl-002',
    type: 'SHIPPING',
    tenantId: VENDOR1_TENANT_ID,
    carrier: 'UPS',
    service: 'UPS_WORLDWIDE_EXPRESS',
    trackingNumber: '1Z999AA10123456784',
    labelFormat: 'PDF',
    labelUrl: '/api/v1/carriers/UPS/labels/lbl-002/download',
    sscc: '00012345678901234568',
    shipDate: '2026-02-05T10:00:00Z',
    estimatedDelivery: '2026-02-10T18:00:00Z',
    fromAddress: { name: 'GlobalParts Ltd.', street: 'Industriestr. 45', city: 'Munich', state: '', zip: '80331', country: 'DE', phone: '+49-89-123456' },
    toAddress:   { name: 'Acme Manufacturing Co.', street: '100 Industrial Blvd', city: 'Chicago', state: 'IL', zip: '60601', country: 'US', phone: '+1-312-555-0100' },
    weight: 5.0,
    weightUnit: 'KG',
    dimensions: { l: 25, w: 20, h: 15, unit: 'CM' },
    rateCharged: 61.20,
    referenceNumber: 'PO-2026-0055',
    orderId: 'doc-004',
    isReturn: false,
    signatureRequired: false,
    createdAt: '2026-02-05T09:30:00Z',
  },
  {
    id: 'lbl-003',
    type: 'SHIPPING',
    tenantId: VENDOR2_TENANT_ID,
    carrier: 'DHL',
    service: 'DHL_EXPRESS_WORLDWIDE',
    trackingNumber: '1234567890',
    labelFormat: 'ZPL',
    labelUrl: '/api/v1/carriers/DHL/labels/lbl-003/download',
    sscc: null,
    shipDate: '2026-02-22T14:00:00Z',
    estimatedDelivery: '2026-03-05T18:00:00Z',
    fromAddress: { name: 'FastShip Logistics', street: '22 Commerce St', city: 'London', state: '', zip: 'EC1A 1BB', country: 'GB', phone: '+44-20-7946-0958' },
    toAddress:   { name: 'Acme Manufacturing Co.', street: '100 Industrial Blvd', city: 'Chicago', state: 'IL', zip: '60601', country: 'US', phone: '+1-312-555-0100' },
    weight: 22.0,
    weightUnit: 'KG',
    dimensions: { l: 60, w: 40, h: 35, unit: 'CM' },
    rateCharged: 112.75,
    referenceNumber: 'PO-2026-0062',
    orderId: 'doc-006',
    isReturn: false,
    signatureRequired: true,
    createdAt: '2026-02-22T13:45:00Z',
  },
  // ── Pallet label ─────────────────────────────────────────────────
  {
    id: 'lbl-004',
    type: 'PALLET',
    tenantId: VENDOR1_TENANT_ID,
    carrier: 'NONE',
    service: null,
    trackingNumber: null,
    labelFormat: 'PDF',
    sscc: '001234567890123456',
    shipDate: '2026-02-19T07:00:00Z',
    estimatedDelivery: null,
    fromAddress: { name: 'GlobalParts Ltd.', street: 'Industriestr. 45', city: 'Munich', state: '', zip: '80331', country: 'DE', phone: '+49-89-123456' },
    toAddress:   { name: 'Acme Manufacturing Co.', street: '100 Industrial Blvd', city: 'Chicago', state: 'IL', zip: '60601', country: 'US', phone: '+1-312-555-0100' },
    content: 'Electronic Connectors, 5-pin, RoHS',
    grossWeight: 250,
    grossWeightUnit: 'KG',
    units: 50,
    unitsType: 'CTN',
    batchNumber: 'BATCH-2026-017',
    productionDate: '2026-02-15T00:00:00Z',
    expiryDate: null,
    referenceNumber: 'PO-2026-0041',
    orderId: 'doc-001',
    rateCharged: null,
    createdAt: '2026-02-19T06:30:00Z',
  },
  // ── HU (Handling Unit) label ──────────────────────────────────────
  {
    id: 'lbl-005',
    type: 'HU',
    tenantId: VENDOR1_TENANT_ID,
    carrier: 'NONE',
    service: null,
    trackingNumber: null,
    labelFormat: 'ZPL',
    sscc: null,
    shipDate: '2026-02-20T08:00:00Z',
    estimatedDelivery: null,
    fromAddress: { name: 'GlobalParts Ltd.', street: 'Industriestr. 45', city: 'Munich', state: '', zip: '80331', country: 'DE', phone: '+49-89-123456' },
    toAddress:   { name: 'Acme Manufacturing Co.', street: '100 Industrial Blvd', city: 'Chicago', state: 'IL', zip: '60601', country: 'US', phone: '+1-312-555-0100' },
    huNumber: 'HU-2026-0071-MUC',
    materialNumber: 'MAT-001234',
    materialDescription: 'Electronic Connector, 5-pin, RoHS Compliant',
    quantity: 500,
    quantityUnit: 'PC',
    batchNumber: 'LOT-2026-B47',
    deliveryNumber: 'DEL-2026-0031',
    plant: '1000',
    storageLocation: 'WH-01-A-04',
    referenceNumber: 'PO-2026-0041',
    orderId: 'doc-001',
    rateCharged: null,
    createdAt: '2026-02-20T07:45:00Z',
  },
  // ── Box / Carton label ────────────────────────────────────────────
  {
    id: 'lbl-006',
    type: 'BOX',
    tenantId: VENDOR1_TENANT_ID,
    carrier: 'NONE',
    service: null,
    trackingNumber: null,
    labelFormat: 'PDF',
    sscc: null,
    shipDate: '2026-02-21T08:00:00Z',
    estimatedDelivery: null,
    fromAddress: { name: 'GlobalParts Ltd.', street: 'Industriestr. 45', city: 'Munich', state: '', zip: '80331', country: 'DE', phone: '+49-89-123456' },
    toAddress:   { name: 'Acme Manufacturing Co.', street: '100 Industrial Blvd', city: 'Chicago', state: 'IL', zip: '60601', country: 'US', phone: '+1-312-555-0100' },
    contents: 'Electronic Connectors, 5-pin, RoHS',
    cartonNumber: 1,
    totalCartons: 50,
    qtyPerCarton: 100,
    qtyUnit: 'PC',
    batchNumber: 'LOT-2026-B47',
    weight: 5.2,
    weightUnit: 'KG',
    referenceNumber: 'PO-2026-0041',
    orderId: 'doc-001',
    rateCharged: null,
    createdAt: '2026-02-21T07:30:00Z',
  },
];

// ── Auth Sessions ─────────────────────────────────────────────────
export const authSessions = [
  { id: 'sess-001', userAgent: 'Chrome 121 / Windows 11',    ip: '192.168.1.10',  current: true,  createdAt: '2026-02-23T08:30:00Z' },
  { id: 'sess-002', userAgent: 'Safari 17 / macOS Sonoma',   ip: '10.0.0.55',     current: false, createdAt: '2026-02-20T14:00:00Z' },
  { id: 'sess-003', userAgent: 'Firefox 122 / Ubuntu 22.04', ip: '172.16.0.22',   current: false, createdAt: '2026-02-15T09:45:00Z' },
];

// ── Feed Subscriptions ────────────────────────────────────────────
export let feedSubscriptions = [
  { id: 'feed-001', subscriberTenantId: BIZ_TENANT_ID, partnerTenantId: VENDOR1_TENANT_ID, connectionId: 'conn-001', feedTypes: ['INVENTORY', 'PRICE_LIST'], deliveryMethod: 'WEBHOOK', webhookUrl: 'https://erp.acme-mfg.com/feed', isActive: true, lastDeliveredAt: '2026-02-23T06:00:00Z', createdAt: '2025-09-01T00:00:00Z' },
];

// ── Trend chart data (30 days) ────────────────────────────────────
export function buildTrendData() {
  const days: { date: string; PO: number; INVOICE: number; ASN: number }[] = [];
  const base = new Date('2026-01-25');
  const pattern = [2,1,3,0,2,4,3,1,2,2,0,3,4,2,1,3,2,0,4,3,2,1,2,3,0,2,4,3,2,1];
  for (let i = 0; i < 30; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      PO:      pattern[i] ?? 0,
      INVOICE: Math.max(0, (pattern[i] ?? 0) - 1),
      ASN:     Math.floor((pattern[i] ?? 0) / 2),
    });
  }
  return days;
}

// ── Notifications ─────────────────────────────────────────────────
export let notifications = [
  { id: 'notif-001', type: 'DOCUMENT', title: 'New Purchase Order received',    message: 'Acme Manufacturing sent PO-2026-0055 (EUR 31,200)',       link: '/vendor/documents/doc-004', read: false, createdAt: '2026-02-25T08:30:00Z' },
  { id: 'notif-002', type: 'PAYMENT',  title: 'Invoice payment received',        message: 'INV-2026-0089 for USD 22,800 has been marked PAID',       link: '/vendor/documents/doc-002', read: false, createdAt: '2026-02-24T14:00:00Z' },
  { id: 'notif-003', type: 'SHIPMENT', title: 'Shipment out for delivery',       message: 'FedEx 7489234810294837 is out for delivery in Chicago',   link: '/vendor/shipments',         read: false, createdAt: '2026-02-23T09:00:00Z' },
  { id: 'notif-004', type: 'ALERT',    title: 'Invoice overdue — action needed', message: 'INV-2026-0102 was due Feb 28. Contact buyer to resolve.', link: '/vendor/invoices',          read: false, createdAt: '2026-02-25T07:00:00Z' },
  { id: 'notif-005', type: 'PARTNER',  title: 'Partner connection request',      message: 'Acme Manufacturing Co. wants to connect',                 link: '/vendor/connections',       read: true,  createdAt: '2026-02-22T11:00:00Z' },
  { id: 'notif-006', type: 'DOCUMENT', title: 'Purchase Order accepted',         message: 'PO-2026-0041 accepted by Acme Manufacturing Co.',         link: '/vendor/documents/doc-001', read: true,  createdAt: '2026-02-21T10:00:00Z' },
];

// ── Activity Feed ─────────────────────────────────────────────────
export const activityFeed = [
  { id: 'act-001', type: 'PO_RECEIVED',    title: 'Purchase Order received',   description: 'PO-2026-0055 from Acme Mfg — EUR 31,200',           link: '/vendor/documents/doc-004', timestamp: '2026-02-25T08:30:00Z', color: 'blue'    },
  { id: 'act-002', type: 'INVOICE_PAID',   title: 'Invoice paid',              description: 'INV-2026-0089 — USD 22,800 credited',                link: '/vendor/documents/doc-002', timestamp: '2026-02-24T14:00:00Z', color: 'green'   },
  { id: 'act-003', type: 'SHIPMENT_OFD',   title: 'Shipment out for delivery', description: 'FedEx 7489234810294837 → Chicago, IL',               link: '/vendor/shipments',         timestamp: '2026-02-23T09:00:00Z', color: 'purple'  },
  { id: 'act-004', type: 'PO_ACCEPTED',    title: 'Purchase Order accepted',   description: 'PO-2026-0041 accepted by Acme Mfg',                  link: '/vendor/documents/doc-001', timestamp: '2026-02-21T10:00:00Z', color: 'green'   },
  { id: 'act-005', type: 'INVOICE_SENT',   title: 'Invoice submitted',         description: 'INV-2026-0114 — EUR 41,000 sent for payment',        link: '/vendor/documents/doc-009', timestamp: '2026-02-21T12:05:00Z', color: 'amber'   },
  { id: 'act-006', type: 'PARTNER_JOINED', title: 'Partner connected',         description: 'Acme Manufacturing Co. — TRUSTED tier approved',     link: '/vendor/connections',       timestamp: '2026-02-20T09:00:00Z', color: 'emerald' },
];

// ── Banking Information ───────────────────────────────────────────
// Keyed by tenantId — mutable so PATCH reflects immediately
export let vendorBanking: Record<string, {
  accountHolderName: string;
  bankName:          string;
  bankCountry:       string;
  currency:          string;
  accountType:       string;   // CHECKING | SAVINGS | CURRENT
  // International
  iban:              string;
  swiftBic:          string;
  // Domestic (US)
  routingNumber:     string;
  accountNumber:     string;   // stored masked: ****1234
  // UK
  sortCode:          string;
  // Additional
  bankAddress:       string;
  intermediaryBank:  string;
  paymentReference:  string;
  verified:          boolean;
  verifiedAt:        string | null;
}> = {
  'tenant-v-001': {
    accountHolderName: 'GlobalParts Ltd.',
    bankName:          'Deutsche Bank AG',
    bankCountry:       'DE',
    currency:          'EUR',
    accountType:       'CURRENT',
    iban:              'DE89 3704 0044 0532 0130 00',
    swiftBic:          'DEUTDEDBXXX',
    routingNumber:     '',
    accountNumber:     '****0130',
    sortCode:          '',
    bankAddress:       'Taunusanlage 12, 60325 Frankfurt, Germany',
    intermediaryBank:  '',
    paymentReference:  'GPLTD-001',
    verified:          true,
    verifiedAt:        '2026-01-10T09:00:00Z',
  },
};

// ── Tax & Compliance Information ──────────────────────────────────
export let vendorTax: Record<string, {
  legalEntityName:    string;
  companyRegNumber:   string;   // e.g. HRB 12345 (DE), 123456789 (US EIN)
  taxId:              string;   // EIN / TIN
  vatNumber:          string;   // EU VAT
  gstHstNumber:       string;   // Canada
  gstin:              string;   // India
  abn:                string;   // Australia
  taxJurisdiction:    string;   // e.g. DE, US-IL
  taxExempt:          boolean;
  taxExemptReason:    string;
  w9Status:           string;   // NOT_REQUIRED | PENDING | SUBMITTED | VERIFIED
  w8Status:           string;   // NOT_REQUIRED | PENDING | SUBMITTED | VERIFIED
  dunsNumber:         string;
  leiCode:            string;   // Legal Entity Identifier
  updatedAt:          string;
}> = {
  'tenant-v-001': {
    legalEntityName:  'GlobalParts Ltd. GmbH',
    companyRegNumber: 'HRB 218439',
    taxId:            '',
    vatNumber:        'DE287654321',
    gstHstNumber:     '',
    gstin:            '',
    abn:              '',
    taxJurisdiction:  'DE',
    taxExempt:        false,
    taxExemptReason:  '',
    w9Status:         'NOT_REQUIRED',
    w8Status:         'VERIFIED',
    dunsNumber:       '30-000-1234',
    leiCode:          '529900T8BM49AURSDO55',
    updatedAt:        '2026-01-15T10:00:00Z',
  },
};

// ── Product Catalog ───────────────────────────────────────────────
export let vendorCatalog: Array<{
  id: string; tenantId: string; sku: string; name: string; description: string;
  category: string; unitPrice: number; currency: string; moq: number;
  leadTimeDays: number; stock: number; unit: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK';
  images: string[]; tags: string[]; createdAt: string; updatedAt: string;
}> = [
  { id: 'cat-001', tenantId: VENDOR1_TENANT_ID, sku: 'BOLT-M12-100',  name: 'M12 Hex Bolt Grade 8.8',          description: 'High-tensile hex bolt, zinc-plated, M12×100mm',          category: 'Fasteners',        unitPrice: 0.85,  currency: 'EUR', moq: 500,  leadTimeDays: 5,  stock: 48000, unit: 'PCS', status: 'ACTIVE',       images: [], tags: ['bolt','m12','fastener'],            createdAt: '2025-08-01T10:00:00Z', updatedAt: '2026-01-10T09:00:00Z' },
  { id: 'cat-002', tenantId: VENDOR1_TENANT_ID, sku: 'NUT-M12-SS',    name: 'M12 Stainless Steel Nut',          description: 'A2-70 stainless steel hex nut, M12',                     category: 'Fasteners',        unitPrice: 0.42,  currency: 'EUR', moq: 500,  leadTimeDays: 5,  stock: 51000, unit: 'PCS', status: 'ACTIVE',       images: [], tags: ['nut','m12','stainless'],             createdAt: '2025-08-01T10:00:00Z', updatedAt: '2026-01-10T09:00:00Z' },
  { id: 'cat-003', tenantId: VENDOR1_TENANT_ID, sku: 'BEARING-6204',  name: '6204 Deep Groove Ball Bearing',    description: 'Single row, open type, 20×47×14mm, ABEC-3',              category: 'Bearings',         unitPrice: 4.50,  currency: 'EUR', moq: 100,  leadTimeDays: 7,  stock: 1200,  unit: 'PCS', status: 'ACTIVE',       images: [], tags: ['bearing','6204','mechanical'],        createdAt: '2025-08-15T10:00:00Z', updatedAt: '2026-02-01T10:00:00Z' },
  { id: 'cat-004', tenantId: VENDOR1_TENANT_ID, sku: 'PCB-CTRL-V2',   name: 'Control PCB Assembly v2.0',        description: 'Custom control board, STM32F4 based, 4-layer PCB',       category: 'Electronics',      unitPrice: 120.00,currency: 'EUR', moq: 50,   leadTimeDays: 14, stock: 230,   unit: 'PCS', status: 'ACTIVE',       images: [], tags: ['pcb','electronics','control'],        createdAt: '2025-09-01T10:00:00Z', updatedAt: '2026-02-10T10:00:00Z' },
  { id: 'cat-005', tenantId: VENDOR1_TENANT_ID, sku: 'IC-MCU-32F',    name: 'STM32F4 Microcontroller',          description: 'ARM Cortex-M4, 168MHz, 512KB Flash, LQFP64',             category: 'Electronics',      unitPrice: 8.50,  currency: 'EUR', moq: 100,  leadTimeDays: 10, stock: 820,   unit: 'PCS', status: 'ACTIVE',       images: [], tags: ['mcu','stm32','microcontroller'],      createdAt: '2025-09-01T10:00:00Z', updatedAt: '2026-01-20T10:00:00Z' },
  { id: 'cat-006', tenantId: VENDOR1_TENANT_ID, sku: 'WASHER-M12',    name: 'M12 Flat Washer DIN 125',          description: 'Zinc-plated flat washer, M12, DIN 125A',                 category: 'Fasteners',        unitPrice: 0.18,  currency: 'EUR', moq: 1000, leadTimeDays: 5,  stock: 92000, unit: 'PCS', status: 'ACTIVE',       images: [], tags: ['washer','m12','fastener'],            createdAt: '2025-08-01T10:00:00Z', updatedAt: '2026-01-10T09:00:00Z' },
  { id: 'cat-007', tenantId: VENDOR1_TENANT_ID, sku: 'CONN-USB-C',    name: 'USB-C Connector Assembly',         description: 'USB 3.2 Gen 2 Type-C, SMD, 24-pin receptacle',           category: 'Electronics',      unitPrice: 2.80,  currency: 'EUR', moq: 200,  leadTimeDays: 8,  stock: 3400,  unit: 'PCS', status: 'ACTIVE',       images: [], tags: ['usb-c','connector','electronics'],    createdAt: '2025-09-15T10:00:00Z', updatedAt: '2026-02-05T10:00:00Z' },
  { id: 'cat-008', tenantId: VENDOR1_TENANT_ID, sku: 'SPRING-COMP-6', name: 'Compression Spring 6mm',           description: 'Stainless steel, free length 25mm, wire dia 0.8mm',      category: 'Mechanical Parts', unitPrice: 0.65,  currency: 'EUR', moq: 500,  leadTimeDays: 7,  stock: 0,     unit: 'PCS', status: 'OUT_OF_STOCK',  images: [], tags: ['spring','compression','mechanical'],  createdAt: '2025-10-01T10:00:00Z', updatedAt: '2026-02-20T10:00:00Z' },
  { id: 'cat-009', tenantId: VENDOR1_TENANT_ID, sku: 'SEAL-ORG-20',   name: 'O-Ring Seal 20×2mm',               description: 'NBR 70 Shore A, inner dia 20mm, cross-section 2mm',      category: 'Seals & Gaskets',  unitPrice: 0.22,  currency: 'EUR', moq: 500,  leadTimeDays: 6,  stock: 15000, unit: 'PCS', status: 'ACTIVE',       images: [], tags: ['o-ring','seal','gasket'],             createdAt: '2025-10-15T10:00:00Z', updatedAt: '2026-01-25T10:00:00Z' },
  { id: 'cat-010', tenantId: VENDOR1_TENANT_ID, sku: 'MOTOR-STEP-42', name: 'NEMA 17 Stepper Motor 42mm',       description: '1.8° step, 2A, 40N·cm holding torque, bipolar 4-wire',   category: 'Mechanical Parts', unitPrice: 18.90, currency: 'EUR', moq: 20,   leadTimeDays: 12, stock: 85,    unit: 'PCS', status: 'INACTIVE',      images: [], tags: ['motor','stepper','nema17'],           createdAt: '2025-11-01T10:00:00Z', updatedAt: '2026-02-15T10:00:00Z' },
];

// ── Returns / RMA ──────────────────────────────────────────────────
export let vendorReturns: Array<{
  id: string; rmaNumber: string; tenantId: string; buyerTenantId: string;
  poReference: string; invoiceReference: string;
  reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'DAMAGED_IN_TRANSIT' | 'OVERSHIPMENT' | 'QUALITY_ISSUE' | 'OTHER';
  status: 'REQUESTED' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CLOSED' | 'REJECTED';
  items: Array<{ sku: string; description: string; qty: number; unitPrice: number; currency: string }>;
  creditNoteNumber: string | null; creditNoteAmount: number | null;
  notes: string; requestedAt: string; updatedAt: string; closedAt: string | null;
}> = [
  {
    id: 'rma-001', rmaNumber: 'RMA-2026-0011', tenantId: VENDOR1_TENANT_ID, buyerTenantId: BIZ_TENANT_ID,
    poReference: 'PO-2026-0041', invoiceReference: 'INV-2026-0089',
    reason: 'DEFECTIVE', status: 'RECEIVED',
    items: [{ sku: 'BOLT-M12-100', description: 'M12 Hex Bolt Grade 8.8', qty: 200, unitPrice: 0.85, currency: 'USD' }],
    creditNoteNumber: 'CN-2026-0003', creditNoteAmount: 170.00,
    notes: 'Thread damage found on approx 200 units from lot #B2024-112.',
    requestedAt: '2026-02-05T08:00:00Z', updatedAt: '2026-02-18T11:00:00Z', closedAt: null,
  },
  {
    id: 'rma-002', rmaNumber: 'RMA-2026-0018', tenantId: VENDOR1_TENANT_ID, buyerTenantId: BIZ_TENANT_ID,
    poReference: 'PO-2026-0055', invoiceReference: 'INV-2026-0102',
    reason: 'WRONG_ITEM', status: 'APPROVED',
    items: [{ sku: 'PCB-CTRL-V2', description: 'Control PCB Assembly v2.0', qty: 5, unitPrice: 120.00, currency: 'EUR' }],
    creditNoteNumber: null, creditNoteAmount: null,
    notes: 'Received v1.8 boards instead of v2.0. Please confirm correct part number.',
    requestedAt: '2026-02-15T10:00:00Z', updatedAt: '2026-02-16T09:00:00Z', closedAt: null,
  },
  {
    id: 'rma-003', rmaNumber: 'RMA-2026-0022', tenantId: VENDOR1_TENANT_ID, buyerTenantId: BIZ_TENANT_ID,
    poReference: 'PO-2026-0041', invoiceReference: 'INV-2026-0089',
    reason: 'DAMAGED_IN_TRANSIT', status: 'REQUESTED',
    items: [{ sku: 'BEARING-6204', description: '6204 Deep Groove Ball Bearing', qty: 30, unitPrice: 4.50, currency: 'USD' }],
    creditNoteNumber: null, creditNoteAmount: null,
    notes: 'Outer race cracked on 30 bearings. Awaiting vendor approval to ship back.',
    requestedAt: '2026-02-22T14:00:00Z', updatedAt: '2026-02-22T14:00:00Z', closedAt: null,
  },
  {
    id: 'rma-004', rmaNumber: 'RMA-2025-0088', tenantId: VENDOR1_TENANT_ID, buyerTenantId: BIZ_TENANT_ID,
    poReference: 'PO-2025-0198', invoiceReference: 'INV-2025-0211',
    reason: 'QUALITY_ISSUE', status: 'CLOSED',
    items: [{ sku: 'IC-MCU-32F', description: 'STM32F4 Microcontroller', qty: 12, unitPrice: 8.50, currency: 'USD' }],
    creditNoteNumber: 'CN-2025-0031', creditNoteAmount: 102.00,
    notes: 'Units failed POST. Credit note issued and replacement shipment confirmed.',
    requestedAt: '2025-12-28T09:00:00Z', updatedAt: '2026-01-08T10:00:00Z', closedAt: '2026-01-08T10:00:00Z',
  },
];

// ── Payment History ────────────────────────────────────────────────
export const vendorPayments: Array<{
  id: string; tenantId: string; payerTenantId: string; invoiceReference: string;
  poReference: string; amount: number; currency: string;
  status: 'SCHEDULED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REVERSED';
  paymentMethod: 'WIRE' | 'ACH' | 'SEPA' | 'SWIFT' | 'CHEQUE';
  paymentReference: string; bankReference: string;
  scheduledDate: string; paidAt: string | null;
  remittanceNote: string; earlyPayDiscount: number;
}> = [
  { id: 'pay-001', tenantId: VENDOR1_TENANT_ID, payerTenantId: BIZ_TENANT_ID, invoiceReference: 'INV-2026-0089', poReference: 'PO-2026-0041', amount: 22800, currency: 'USD', status: 'PAID',      paymentMethod: 'SWIFT', paymentReference: 'PAY-2026-0041', bankReference: 'DEUT20260210-082', scheduledDate: '2026-02-10T00:00:00Z', paidAt: '2026-02-10T09:30:00Z', remittanceNote: 'Payment for INV-2026-0089. PO-2026-0041.',     earlyPayDiscount: 0 },
  { id: 'pay-002', tenantId: VENDOR1_TENANT_ID, payerTenantId: BIZ_TENANT_ID, invoiceReference: 'INV-2025-0211', poReference: 'PO-2025-0198', amount: 15300, currency: 'USD', status: 'PAID',      paymentMethod: 'SWIFT', paymentReference: 'PAY-2025-0187', bankReference: 'DEUT20260108-041', scheduledDate: '2026-01-08T00:00:00Z', paidAt: '2026-01-08T14:10:00Z', remittanceNote: 'Payment for INV-2025-0211.',                   earlyPayDiscount: 0 },
  { id: 'pay-003', tenantId: VENDOR1_TENANT_ID, payerTenantId: BIZ_TENANT_ID, invoiceReference: 'INV-2026-0114', poReference: 'PO-2026-0055', amount: 41000, currency: 'EUR', status: 'SCHEDULED', paymentMethod: 'SEPA',  paymentReference: 'PAY-2026-0068', bankReference: '',                 scheduledDate: '2026-03-20T00:00:00Z', paidAt: null,                   remittanceNote: 'Scheduled: INV-2026-0114 Net-30.',             earlyPayDiscount: 0 },
  { id: 'pay-004', tenantId: VENDOR1_TENANT_ID, payerTenantId: BIZ_TENANT_ID, invoiceReference: 'INV-2026-0102', poReference: 'PO-2026-0055', amount: 15600, currency: 'USD', status: 'PROCESSING', paymentMethod: 'SWIFT', paymentReference: 'PAY-2026-0059', bankReference: 'DEUT20260224-019', scheduledDate: '2026-02-28T00:00:00Z', paidAt: null,                   remittanceNote: 'Partial payment — disputed balance held pending resolution.', earlyPayDiscount: 0 },
  { id: 'pay-005', tenantId: VENDOR1_TENANT_ID, payerTenantId: BIZ_TENANT_ID, invoiceReference: 'INV-2025-0167', poReference: 'PO-2025-0155', amount: 8920,  currency: 'USD', status: 'PAID',      paymentMethod: 'ACH',   paymentReference: 'PAY-2025-0151', bankReference: 'ACH20251210-002',  scheduledDate: '2025-12-05T00:00:00Z', paidAt: '2025-12-05T11:00:00Z', remittanceNote: '2% early payment discount applied.',          earlyPayDiscount: 182.04 },
  { id: 'pay-006', tenantId: VENDOR1_TENANT_ID, payerTenantId: BIZ_TENANT_ID, invoiceReference: 'INV-2025-0142', poReference: 'PO-2025-0128', amount: 33400, currency: 'USD', status: 'PAID',      paymentMethod: 'SWIFT', paymentReference: 'PAY-2025-0122', bankReference: 'DEUT20251101-077', scheduledDate: '2025-11-01T00:00:00Z', paidAt: '2025-11-01T16:45:00Z', remittanceNote: 'Payment INV-2025-0142.',                       earlyPayDiscount: 0 },
];

// ── Compliance Document Vault ──────────────────────────────────────
export let vendorVault: Array<{
  id: string; tenantId: string;
  docType: 'ISO_CERT' | 'INSURANCE' | 'W9' | 'W8' | 'AUDIT_REPORT' | 'CUSTOMS' | 'OTHER';
  name: string; issuer: string; referenceNumber: string;
  issuedAt: string; expiresAt: string | null;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING_REVIEW';
  fileSize: number; fileType: 'PDF' | 'JPG' | 'PNG';
  uploadedAt: string; notes: string;
}> = [
  { id: 'vault-001', tenantId: VENDOR1_TENANT_ID, docType: 'ISO_CERT',     name: 'ISO 9001:2015 Quality Management',      issuer: 'TÜV SÜD',           referenceNumber: 'TUV-QMS-2023-4412',  issuedAt: '2023-01-15T00:00:00Z', expiresAt: '2026-01-14T00:00:00Z', status: 'EXPIRING_SOON', fileSize: 418000, fileType: 'PDF', uploadedAt: '2023-01-20T10:00:00Z', notes: 'Renewal audit scheduled Q1 2026.' },
  { id: 'vault-002', tenantId: VENDOR1_TENANT_ID, docType: 'ISO_CERT',     name: 'RoHS 2015/863 Compliance Certificate',  issuer: 'Bureau Veritas',    referenceNumber: 'BV-ROHS-2022-0889', issuedAt: '2022-06-15T00:00:00Z', expiresAt: '2025-06-14T00:00:00Z', status: 'EXPIRED',       fileSize: 287000, fileType: 'PDF', uploadedAt: '2022-06-20T10:00:00Z', notes: 'Renewal pending — upload new certificate.' },
  { id: 'vault-003', tenantId: VENDOR1_TENANT_ID, docType: 'INSURANCE',    name: 'Commercial General Liability Insurance', issuer: 'Allianz SE',        referenceNumber: 'ALZ-CGL-2025-9911', issuedAt: '2025-01-01T00:00:00Z', expiresAt: '2026-12-31T00:00:00Z', status: 'VALID',         fileSize: 624000, fileType: 'PDF', uploadedAt: '2025-01-05T10:00:00Z', notes: '' },
  { id: 'vault-004', tenantId: VENDOR1_TENANT_ID, docType: 'W8',           name: 'IRS Form W-8BEN-E',                     issuer: 'Internal Revenue Service', referenceNumber: 'W8-GPLTD-2025',  issuedAt: '2025-03-01T00:00:00Z', expiresAt: '2028-02-28T00:00:00Z', status: 'VALID',         fileSize: 195000, fileType: 'PDF', uploadedAt: '2025-03-05T10:00:00Z', notes: 'Verified by Acme Finance team.' },
  { id: 'vault-005', tenantId: VENDOR1_TENANT_ID, docType: 'AUDIT_REPORT', name: 'Supplier Quality Audit 2025',           issuer: 'Acme Manufacturing',referenceNumber: 'AUD-2025-GP-001',   issuedAt: '2025-11-10T00:00:00Z', expiresAt: null,                    status: 'VALID',         fileSize: 1240000,fileType: 'PDF', uploadedAt: '2025-11-12T10:00:00Z', notes: 'Score: 94/100 — Excellent.' },
  { id: 'vault-006', tenantId: VENDOR1_TENANT_ID, docType: 'CUSTOMS',      name: 'AEO Certificate (Authorised Operator)',  issuer: 'German Customs (HZA)', referenceNumber: 'DE-AEO-2024-1188', issuedAt: '2024-04-01T00:00:00Z', expiresAt: null,                  status: 'VALID',         fileSize: 332000, fileType: 'PDF', uploadedAt: '2024-04-05T10:00:00Z', notes: 'Authorised Economic Operator — full.' },
];

// ── Team Members (vendor-scoped) ───────────────────────────────────
export let vendorTeam: Array<{
  id: string; tenantId: string; email: string;
  firstName: string; lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'FINANCE' | 'LOGISTICS' | 'VIEWER';
  isActive: boolean; mfaEnabled: boolean;
  lastLoginAt: string | null; invitedAt: string; joinedAt: string | null;
  invitedBy: string; avatarInitials: string;
}> = [
  { id: 'tm-001', tenantId: VENDOR1_TENANT_ID, email: 'sarah.j@globalparts.com',  firstName: 'Sarah',  lastName: 'Jones',    role: 'ADMIN',     isActive: true,  mfaEnabled: true,  lastLoginAt: '2026-02-23T07:00:00Z', invitedAt: '2025-07-15T10:00:00Z', joinedAt: '2025-07-15T10:00:00Z', invitedBy: 'system',  avatarInitials: 'SJ' },
  { id: 'tm-002', tenantId: VENDOR1_TENANT_ID, email: 'marcus.k@globalparts.com', firstName: 'Marcus', lastName: 'Klein',    role: 'FINANCE',   isActive: true,  mfaEnabled: false, lastLoginAt: '2026-02-22T08:30:00Z', invitedAt: '2025-09-01T10:00:00Z', joinedAt: '2025-09-03T14:00:00Z', invitedBy: 'tm-001', avatarInitials: 'MK' },
  { id: 'tm-003', tenantId: VENDOR1_TENANT_ID, email: 'anna.m@globalparts.com',   firstName: 'Anna',   lastName: 'Müller',   role: 'LOGISTICS', isActive: true,  mfaEnabled: false, lastLoginAt: '2026-02-21T10:00:00Z', invitedAt: '2025-09-15T10:00:00Z', joinedAt: '2025-09-16T09:00:00Z', invitedBy: 'tm-001', avatarInitials: 'AM' },
  { id: 'tm-004', tenantId: VENDOR1_TENANT_ID, email: 'peter.w@globalparts.com',  firstName: 'Peter',  lastName: 'Weber',    role: 'VIEWER',    isActive: false, mfaEnabled: false, lastLoginAt: '2026-01-10T16:00:00Z', invitedAt: '2025-11-01T10:00:00Z', joinedAt: '2025-11-02T08:00:00Z', invitedBy: 'tm-001', avatarInitials: 'PW' },
  { id: 'tm-005', tenantId: VENDOR1_TENANT_ID, email: 'lena.s@globalparts.com',   firstName: 'Lena',   lastName: 'Schmidt',  role: 'MANAGER',   isActive: true,  mfaEnabled: true,  lastLoginAt: '2026-02-24T11:00:00Z', invitedAt: '2026-01-10T10:00:00Z', joinedAt: '2026-01-12T09:00:00Z', invitedBy: 'tm-001', avatarInitials: 'LS' },
];

// ── Quotes / RFQ ──────────────────────────────────────────────────
export let vendorQuotes: Array<{
  id: string; quoteNumber: string; tenantId: string; buyerTenantId: string;
  rfqReference: string; subject: string;
  status: 'RFQ_RECEIVED' | 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  items: Array<{ sku: string; description: string; qty: number; requestedPrice: number | null; quotedPrice: number | null; currency: string; leadTimeDays: number | null }>;
  validUntil: string | null; deliveryTerms: string; paymentTerms: string;
  notes: string; receivedAt: string; submittedAt: string | null; updatedAt: string;
}> = [
  {
    id: 'qt-001', quoteNumber: 'Q-2026-0031', tenantId: VENDOR1_TENANT_ID, buyerTenantId: BIZ_TENANT_ID,
    rfqReference: 'RFQ-2026-0019', subject: 'Fasteners & Bearings Q2 2026 Bulk Order',
    status: 'SUBMITTED',
    items: [
      { sku: 'BOLT-M12-100', description: 'M12 Hex Bolt Grade 8.8', qty: 20000, requestedPrice: null, quotedPrice: 0.79, currency: 'EUR', leadTimeDays: 7 },
      { sku: 'NUT-M12-SS',   description: 'M12 Stainless Steel Nut', qty: 20000, requestedPrice: null, quotedPrice: 0.38, currency: 'EUR', leadTimeDays: 7 },
      { sku: 'BEARING-6204', description: '6204 Deep Groove Ball Bearing', qty: 500, requestedPrice: null, quotedPrice: 4.20, currency: 'EUR', leadTimeDays: 10 },
    ],
    validUntil: '2026-03-15T00:00:00Z', deliveryTerms: 'DDP Munich', paymentTerms: 'Net-30',
    notes: 'Volume pricing applied. Lead time includes customs clearance.',
    receivedAt: '2026-02-10T09:00:00Z', submittedAt: '2026-02-12T14:00:00Z', updatedAt: '2026-02-12T14:00:00Z',
  },
  {
    id: 'qt-002', quoteNumber: '', tenantId: VENDOR1_TENANT_ID, buyerTenantId: BIZ_TENANT_ID,
    rfqReference: 'RFQ-2026-0024', subject: 'Emergency Reorder — PCB Control Boards',
    status: 'RFQ_RECEIVED',
    items: [
      { sku: 'PCB-CTRL-V2', description: 'Control PCB Assembly v2.0', qty: 100, requestedPrice: 115.00, quotedPrice: null, currency: 'EUR', leadTimeDays: null },
    ],
    validUntil: null, deliveryTerms: '', paymentTerms: '',
    notes: 'Urgent requirement. Buyer requests delivery by end of March.',
    receivedAt: '2026-02-23T16:00:00Z', submittedAt: null, updatedAt: '2026-02-23T16:00:00Z',
  },
  {
    id: 'qt-003', quoteNumber: 'Q-2026-0018', tenantId: VENDOR1_TENANT_ID, buyerTenantId: BIZ_TENANT_ID,
    rfqReference: 'RFQ-2026-0011', subject: 'Electronic Components Yearly Frame Contract',
    status: 'ACCEPTED',
    items: [
      { sku: 'IC-MCU-32F',  description: 'STM32F4 Microcontroller', qty: 1000, requestedPrice: 8.00, quotedPrice: 7.90, currency: 'EUR', leadTimeDays: 12 },
      { sku: 'CONN-USB-C',  description: 'USB-C Connector Assembly', qty: 2000, requestedPrice: 2.60, quotedPrice: 2.55, currency: 'EUR', leadTimeDays: 8  },
    ],
    validUntil: '2026-12-31T00:00:00Z', deliveryTerms: 'CIF Frankfurt', paymentTerms: 'Net-45',
    notes: 'Frame contract Q1–Q4 2026. Quarterly call-off orders expected.',
    receivedAt: '2026-01-15T09:00:00Z', submittedAt: '2026-01-17T11:00:00Z', updatedAt: '2026-01-20T09:00:00Z',
  },
  {
    id: 'qt-004', quoteNumber: 'Q-2025-0099', tenantId: VENDOR1_TENANT_ID, buyerTenantId: BIZ_TENANT_ID,
    rfqReference: 'RFQ-2025-0077', subject: 'Seals & Gaskets Q4 2025',
    status: 'EXPIRED',
    items: [
      { sku: 'SEAL-ORG-20', description: 'O-Ring Seal 20×2mm', qty: 5000, requestedPrice: null, quotedPrice: 0.20, currency: 'EUR', leadTimeDays: 6 },
    ],
    validUntil: '2025-11-30T00:00:00Z', deliveryTerms: 'EXW Munich', paymentTerms: 'Net-30',
    notes: 'Quote expired. Buyer opted for alternative supplier.',
    receivedAt: '2025-11-01T09:00:00Z', submittedAt: '2025-11-03T10:00:00Z', updatedAt: '2025-12-01T10:00:00Z',
  },
];

// ── Helpers ───────────────────────────────────────────────────────
export function ok(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function created(data: unknown) {
  return Response.json(data, { status: 201 });
}

export function noContent() {
  return new Response(null, { status: 204 });
}

export function notFound(msg = 'Not found') {
  return Response.json({ message: msg }, { status: 404 });
}
