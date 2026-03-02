"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentSearchSchema = exports.PaginationSchema = exports.CreateApiKeySchema = exports.RefreshTokenSchema = exports.LoginSchema = exports.RegisterBusinessSchema = exports.CreateWebhookSchema = exports.SubscribeFeedSchema = exports.VendorRegisterSchema = exports.ConnectPartnerSchema = exports.GenerateLabelSchema = exports.CreateASNSchema = exports.PackageSchema = exports.CreateInvoiceSchema = exports.AcknowledgeDocumentSchema = exports.RejectDocumentSchema = exports.UpdatePOSchema = exports.CreatePOSchema = exports.LineItemSchema = exports.AddressSchema = void 0;
const zod_1 = require("zod");
exports.AddressSchema = zod_1.z.object({
    street: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    state: zod_1.z.string().optional(),
    zip: zod_1.z.string().min(1),
    country: zod_1.z.string().length(2),
});
exports.LineItemSchema = zod_1.z.object({
    lineNumber: zod_1.z.number().int().positive(),
    sku: zod_1.z.string().min(1).max(50),
    description: zod_1.z.string().min(1).max(500),
    quantity: zod_1.z.number().positive(),
    unit: zod_1.z.string().min(1).max(10),
    unitPrice: zod_1.z.number().min(0),
    totalPrice: zod_1.z.number().min(0),
    hsCode: zod_1.z.string().optional(),
    countryOfOrigin: zod_1.z.string().length(2).optional(),
});
exports.CreatePOSchema = zod_1.z.object({
    receiverTenantId: zod_1.z.string().uuid(),
    currency: zod_1.z.string().length(3).default('USD'),
    deliveryAddress: exports.AddressSchema,
    deliveryDate: zod_1.z.string().datetime(),
    paymentTerms: zod_1.z.enum(['NET15', 'NET30', 'NET45', 'NET60', 'NET90', 'COD', 'PREPAID']),
    incoterms: zod_1.z.enum(['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF']).optional(),
    lineItems: zod_1.z.array(exports.LineItemSchema).min(1).max(500),
    notes: zod_1.z.string().max(2000).optional(),
    externalRef: zod_1.z.string().max(100).optional(),
    dueDate: zod_1.z.string().datetime().optional(),
});
exports.UpdatePOSchema = exports.CreatePOSchema.partial().omit({ receiverTenantId: true });
exports.RejectDocumentSchema = zod_1.z.object({
    reason: zod_1.z.string().min(10).max(500),
});
exports.AcknowledgeDocumentSchema = zod_1.z.object({
    comment: zod_1.z.string().max(500).optional(),
});
exports.CreateInvoiceSchema = zod_1.z.object({
    receiverTenantId: zod_1.z.string().uuid(),
    poReference: zod_1.z.string().optional(),
    currency: zod_1.z.string().length(3).default('USD'),
    invoiceDate: zod_1.z.string().datetime(),
    dueDate: zod_1.z.string().datetime(),
    paymentTerms: zod_1.z.string(),
    lineItems: zod_1.z.array(exports.LineItemSchema).min(1).max(500),
    taxAmount: zod_1.z.number().min(0).optional(),
    notes: zod_1.z.string().max(2000).optional(),
    bankDetails: zod_1.z.object({
        bankName: zod_1.z.string(),
        accountNumber: zod_1.z.string(),
        routingNumber: zod_1.z.string().optional(),
        iban: zod_1.z.string().optional(),
        swiftCode: zod_1.z.string().optional(),
    }).optional(),
});
exports.PackageSchema = zod_1.z.object({
    packageNumber: zod_1.z.number().int().positive(),
    sscc: zod_1.z.string().length(18).optional(),
    weight: zod_1.z.number().positive(),
    weightUnit: zod_1.z.enum(['KG', 'LB']),
    dimensions: zod_1.z.object({
        l: zod_1.z.number().positive(),
        w: zod_1.z.number().positive(),
        h: zod_1.z.number().positive(),
        unit: zod_1.z.enum(['CM', 'IN']),
    }).optional(),
    contents: zod_1.z.array(zod_1.z.string()).min(1),
});
exports.CreateASNSchema = zod_1.z.object({
    receiverTenantId: zod_1.z.string().uuid(),
    poReference: zod_1.z.string().min(1),
    shipDate: zod_1.z.string().datetime(),
    carrier: zod_1.z.enum(['FEDEX', 'UPS', 'DHL', 'USPS', 'CUSTOM']),
    trackingNumber: zod_1.z.string().optional(),
    packages: zod_1.z.array(exports.PackageSchema).min(1),
    lineItems: zod_1.z.array(exports.LineItemSchema).min(1),
    notes: zod_1.z.string().max(2000).optional(),
});
exports.GenerateLabelSchema = zod_1.z.object({
    carrier: zod_1.z.enum(['FEDEX', 'UPS', 'DHL', 'USPS']),
    service: zod_1.z.string().min(1),
    labelFormat: zod_1.z.enum(['ZPL', 'PDF', 'PNG']).default('PDF'),
    fromAddress: exports.AddressSchema,
    toAddress: exports.AddressSchema,
    weight: zod_1.z.number().positive(),
    weightUnit: zod_1.z.enum(['KG', 'LB']).default('LB'),
    dimensions: zod_1.z.object({
        l: zod_1.z.number().positive(),
        w: zod_1.z.number().positive(),
        h: zod_1.z.number().positive(),
        unit: zod_1.z.enum(['CM', 'IN']).default('IN'),
    }).optional(),
    referenceNumber: zod_1.z.string().optional(),
    orderId: zod_1.z.string().optional(),
    isReturn: zod_1.z.boolean().default(false),
    signatureRequired: zod_1.z.boolean().default(false),
});
exports.ConnectPartnerSchema = zod_1.z.object({
    targetTenantId: zod_1.z.string().uuid(),
    message: zod_1.z.string().max(500).optional(),
    tier: zod_1.z.enum(['STANDARD', 'PREFERRED', 'TRUSTED']).default('STANDARD'),
    dataSharingConfig: zod_1.z.object({
        shareInventory: zod_1.z.boolean().default(false),
        sharePricing: zod_1.z.boolean().default(false),
        shareOrders: zod_1.z.boolean().default(true),
        shareShipments: zod_1.z.boolean().default(true),
        allowedDocTypes: zod_1.z.array(zod_1.z.enum(['PO', 'INVOICE', 'ASN', 'DELIVERY_NOTE', 'LABEL', 'BOL'])),
    }),
});
exports.VendorRegisterSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(2).max(200),
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    password: zod_1.z.string().min(12).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Password must contain uppercase, lowercase, number, and special character'),
    country: zod_1.z.string().length(2),
    website: zod_1.z.string().url().optional(),
    vatId: zod_1.z.string().optional(),
    categories: zod_1.z.array(zod_1.z.string()).min(1).max(10),
});
exports.SubscribeFeedSchema = zod_1.z.object({
    partnerTenantId: zod_1.z.string().uuid(),
    feedTypes: zod_1.z.array(zod_1.z.enum(['inventory', 'orders', 'shipments', 'prices', 'capacity'])).min(1),
    deliveryMethod: zod_1.z.enum(['WEBHOOK', 'API_POLL', 'SFTP', 'AS2']),
    webhookUrl: zod_1.z.string().url().optional(),
    webhookSecret: zod_1.z.string().min(20).optional(),
}).refine((data) => data.deliveryMethod !== 'WEBHOOK' || (data.webhookUrl && data.webhookSecret), { message: 'webhookUrl and webhookSecret are required for WEBHOOK delivery' });
exports.CreateWebhookSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    url: zod_1.z.string().url(),
    events: zod_1.z.array(zod_1.z.string()).min(1),
    isActive: zod_1.z.boolean().default(true),
});
exports.RegisterBusinessSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(2).max(200),
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    password: zod_1.z.string().min(12).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Password must contain uppercase, lowercase, number, and special character'),
    country: zod_1.z.string().length(2),
    website: zod_1.z.string().url().optional(),
    dunsNumber: zod_1.z.string().optional(),
    vatId: zod_1.z.string().optional(),
    planTier: zod_1.z.enum(['FREE', 'PRO', 'ENTERPRISE']).default('FREE'),
    acceptTerms: zod_1.z.boolean().refine((v) => v === true, { message: 'You must accept the terms of service' }),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
    mfaCode: zod_1.z.string().length(6).optional(),
});
exports.RefreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
exports.CreateApiKeySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    scopes: zod_1.z.array(zod_1.z.enum([
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
    expiresAt: zod_1.z.string().datetime().optional(),
    rateLimit: zod_1.z.number().int().min(100).max(100000).default(1000),
});
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.DocumentSearchSchema = exports.PaginationSchema.extend({
    type: zod_1.z.enum(['PO', 'INVOICE', 'ASN', 'DELIVERY_NOTE', 'LABEL', 'BOL']).optional(),
    status: zod_1.z.enum(['DRAFT', 'SENT', 'ACKNOWLEDGED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'PAID']).optional(),
    partnerId: zod_1.z.string().uuid().optional(),
    from: zod_1.z.string().datetime().optional(),
    to: zod_1.z.string().datetime().optional(),
    q: zod_1.z.string().max(200).optional(),
    currency: zod_1.z.string().length(3).optional(),
    minAmount: zod_1.z.coerce.number().min(0).optional(),
    maxAmount: zod_1.z.coerce.number().min(0).optional(),
});
//# sourceMappingURL=index.js.map