import { z } from 'zod';

// ── Address ───────────────────────────────────────────────────────
export const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional(),
  zip: z.string().min(1),
  country: z.string().length(2),  // ISO 3166-1 alpha-2
});

// ── Line Item ─────────────────────────────────────────────────────
export const LineItemSchema = z.object({
  lineNumber: z.number().int().positive(),
  sku: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(10),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  hsCode: z.string().optional(),
  countryOfOrigin: z.string().length(2).optional(),
});

// ── Purchase Order ────────────────────────────────────────────────
export const CreatePOSchema = z.object({
  receiverTenantId: z.string().uuid(),
  currency: z.string().length(3).default('USD'),
  deliveryAddress: AddressSchema,
  deliveryDate: z.string().datetime(),
  paymentTerms: z.enum(['NET15', 'NET30', 'NET45', 'NET60', 'NET90', 'COD', 'PREPAID']),
  incoterms: z.enum(['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF']).optional(),
  lineItems: z.array(LineItemSchema).min(1).max(500),
  notes: z.string().max(2000).optional(),
  externalRef: z.string().max(100).optional(),
  dueDate: z.string().datetime().optional(),
});

export const UpdatePOSchema = CreatePOSchema.partial().omit({ receiverTenantId: true });

export const RejectDocumentSchema = z.object({
  reason: z.string().min(10).max(500),
});

export const AcknowledgeDocumentSchema = z.object({
  comment: z.string().max(500).optional(),
});

// ── Invoice ───────────────────────────────────────────────────────
export const CreateInvoiceSchema = z.object({
  receiverTenantId: z.string().uuid(),
  poReference: z.string().optional(),
  currency: z.string().length(3).default('USD'),
  invoiceDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  paymentTerms: z.string(),
  lineItems: z.array(LineItemSchema).min(1).max(500),
  taxAmount: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
  bankDetails: z.object({
    bankName: z.string(),
    accountNumber: z.string(),
    routingNumber: z.string().optional(),
    iban: z.string().optional(),
    swiftCode: z.string().optional(),
  }).optional(),
});

// ── ASN ───────────────────────────────────────────────────────────
export const PackageSchema = z.object({
  packageNumber: z.number().int().positive(),
  sscc: z.string().length(18).optional(),
  weight: z.number().positive(),
  weightUnit: z.enum(['KG', 'LB']),
  dimensions: z.object({
    l: z.number().positive(),
    w: z.number().positive(),
    h: z.number().positive(),
    unit: z.enum(['CM', 'IN']),
  }).optional(),
  contents: z.array(z.string()).min(1),
});

export const CreateASNSchema = z.object({
  receiverTenantId: z.string().uuid(),
  poReference: z.string().min(1),
  shipDate: z.string().datetime(),
  carrier: z.enum(['FEDEX', 'UPS', 'DHL', 'USPS', 'CUSTOM']),
  trackingNumber: z.string().optional(),
  packages: z.array(PackageSchema).min(1),
  lineItems: z.array(LineItemSchema).min(1),
  notes: z.string().max(2000).optional(),
});

// ── Label Generation ──────────────────────────────────────────────
export const GenerateLabelSchema = z.object({
  carrier: z.enum(['FEDEX', 'UPS', 'DHL', 'USPS']),
  service: z.string().min(1),
  labelFormat: z.enum(['ZPL', 'PDF', 'PNG']).default('PDF'),
  fromAddress: AddressSchema,
  toAddress: AddressSchema,
  weight: z.number().positive(),
  weightUnit: z.enum(['KG', 'LB']).default('LB'),
  dimensions: z.object({
    l: z.number().positive(),
    w: z.number().positive(),
    h: z.number().positive(),
    unit: z.enum(['CM', 'IN']).default('IN'),
  }).optional(),
  referenceNumber: z.string().optional(),
  orderId: z.string().optional(),
  isReturn: z.boolean().default(false),
  signatureRequired: z.boolean().default(false),
});

// ── Partner Connection ─────────────────────────────────────────────
export const ConnectPartnerSchema = z.object({
  targetTenantId: z.string().uuid(),
  message: z.string().max(500).optional(),
  tier: z.enum(['STANDARD', 'PREFERRED', 'TRUSTED']).default('STANDARD'),
  dataSharingConfig: z.object({
    shareInventory: z.boolean().default(false),
    sharePricing: z.boolean().default(false),
    shareOrders: z.boolean().default(true),
    shareShipments: z.boolean().default(true),
    allowedDocTypes: z.array(z.enum(['PO', 'INVOICE', 'ASN', 'DELIVERY_NOTE', 'LABEL', 'BOL'])),
  }),
});

// ── Vendor Registration ────────────────────────────────────────────
export const VendorRegisterSchema = z.object({
  companyName: z.string().min(2).max(200),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  password: z.string().min(12).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    'Password must contain uppercase, lowercase, number, and special character'
  ),
  country: z.string().length(2),
  website: z.string().url().optional(),
  vatId: z.string().optional(),
  categories: z.array(z.string()).min(1).max(10),
});

// ── Data Feed Subscription ────────────────────────────────────────
export const SubscribeFeedSchema = z.object({
  partnerTenantId: z.string().uuid(),
  feedTypes: z.array(z.enum(['inventory', 'orders', 'shipments', 'prices', 'capacity'])).min(1),
  deliveryMethod: z.enum(['WEBHOOK', 'API_POLL', 'SFTP', 'AS2']),
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().min(20).optional(),
}).refine(
  (data) => data.deliveryMethod !== 'WEBHOOK' || (data.webhookUrl && data.webhookSecret),
  { message: 'webhookUrl and webhookSecret are required for WEBHOOK delivery' }
);

// ── Webhook ───────────────────────────────────────────────────────
export const CreateWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  isActive: z.boolean().default(true),
});

// ── Auth ──────────────────────────────────────────────────────────
export const RegisterBusinessSchema = z.object({
  companyName: z.string().min(2).max(200),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  password: z.string().min(12).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    'Password must contain uppercase, lowercase, number, and special character'
  ),
  country: z.string().length(2),
  website: z.string().url().optional(),
  dunsNumber: z.string().optional(),
  vatId: z.string().optional(),
  planTier: z.enum(['FREE', 'PRO', 'ENTERPRISE']).default('FREE'),
  acceptTerms: z.boolean().refine((v) => v === true, { message: 'You must accept the terms of service' }),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mfaCode: z.string().length(6).optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ── API Key ───────────────────────────────────────────────────────
export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum([
    'po:read', 'po:write',
    'invoice:read', 'invoice:write',
    'asn:read', 'asn:write',
    'labels:read', 'labels:write',
    'tracking:read',
    'partners:read', 'partners:write',
    'vendors:read',
    'analytics:read',
    'webhooks:read', 'webhooks:write',
  ])).min(1),
  expiresAt: z.string().datetime().optional(),
  rateLimit: z.number().int().min(100).max(100000).default(1000),
});

// ── Pagination ────────────────────────────────────────────────────
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Document Search ───────────────────────────────────────────────
export const DocumentSearchSchema = PaginationSchema.extend({
  type: z.enum(['PO', 'INVOICE', 'ASN', 'DELIVERY_NOTE', 'LABEL', 'BOL']).optional(),
  status: z.enum(['DRAFT', 'SENT', 'ACKNOWLEDGED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'PAID']).optional(),
  partnerId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  q: z.string().max(200).optional(),
  currency: z.string().length(3).optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
});

export type CreatePO = z.infer<typeof CreatePOSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
export type CreateASN = z.infer<typeof CreateASNSchema>;
export type GenerateLabel = z.infer<typeof GenerateLabelSchema>;
export type ConnectPartner = z.infer<typeof ConnectPartnerSchema>;
export type VendorRegister = z.infer<typeof VendorRegisterSchema>;
export type RegisterBusiness = z.infer<typeof RegisterBusinessSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type CreateApiKey = z.infer<typeof CreateApiKeySchema>;
export type DocumentSearch = z.infer<typeof DocumentSearchSchema>;
