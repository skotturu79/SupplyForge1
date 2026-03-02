// ══════════════════════════════════════════════════════════════════
// SupplyForge — Shared TypeScript Types
// ══════════════════════════════════════════════════════════════════

// ── Enums ─────────────────────────────────────────────────────────

export enum TenantType {
  BUSINESS = 'BUSINESS',
  VENDOR = 'VENDOR',
  CARRIER = 'CARRIER',
}

export enum TenantStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum PlanTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER',
}

export enum DocumentType {
  PO = 'PO',
  INVOICE = 'INVOICE',
  ASN = 'ASN',
  DELIVERY_NOTE = 'DELIVERY_NOTE',
  LABEL = 'LABEL',
  BOL = 'BOL',
  CREDIT_NOTE = 'CREDIT_NOTE',
  CUSTOMS = 'CUSTOMS',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  PAID = 'PAID',
  DISPUTED = 'DISPUTED',
}

export enum ConnectionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum ConnectionTier {
  STANDARD = 'STANDARD',
  PREFERRED = 'PREFERRED',
  TRUSTED = 'TRUSTED',
}

export enum CarrierCode {
  FEDEX = 'FEDEX',
  UPS = 'UPS',
  DHL = 'DHL',
  USPS = 'USPS',
  CUSTOM = 'CUSTOM',
}

export enum FeedDelivery {
  WEBHOOK = 'WEBHOOK',
  API_POLL = 'API_POLL',
  SFTP = 'SFTP',
  AS2 = 'AS2',
}

// ── Core Entities ──────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  status: TenantStatus;
  dunsNumber?: string;
  vatId?: string;
  taxId?: string;
  logoUrl?: string;
  website?: string;
  country: string;
  address: Address;
  planTier: PlanTier;
  apiCallsUsed: number;
  apiCallsLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: string[];
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
}

// ── Documents ─────────────────────────────────────────────────────

export interface LineItem {
  lineNumber: number;
  sku: string;
  description: string;
  quantity: number;
  unit: string;               // EA, KG, LB, PCS, etc.
  unitPrice: number;
  totalPrice: number;
  hsCode?: string;            // for customs
  countryOfOrigin?: string;
}

export interface Document {
  id: string;
  senderTenantId: string;
  receiverTenantId: string;
  type: DocumentType;
  status: DocumentStatus;
  referenceNumber: string;
  externalRef?: string;
  currency: string;
  totalAmount?: number;
  lineItems: LineItem[];
  dueDate?: string;
  acknowledgedAt?: string;
  processedAt?: string;
  parentDocumentId?: string;
  storageUrl?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder extends Document {
  type: DocumentType.PO;
  deliveryAddress: Address;
  deliveryDate: string;
  paymentTerms: string;         // NET30, NET60, etc.
  incoterms?: string;           // EXW, CIF, DDP, etc.
}

export interface Invoice extends Document {
  type: DocumentType.INVOICE;
  invoiceDate: string;
  poReference?: string;
  taxAmount?: number;
  bankDetails?: BankDetails;
  matchedPoId?: string;
  threeWayMatchStatus?: 'MATCHED' | 'PARTIAL' | 'DISCREPANCY' | 'PENDING';
}

export interface ASN extends Document {
  type: DocumentType.ASN;
  shipDate: string;
  carrier: CarrierCode;
  trackingNumber?: string;
  packages: Package[];
  poReference: string;
}

export interface Package {
  packageNumber: number;
  sscc?: string;                // GS1 Serial Shipping Container Code
  weight: number;
  weightUnit: 'KG' | 'LB';
  dimensions?: { l: number; w: number; h: number; unit: 'CM' | 'IN' };
  contents: string[];
}

export interface ShippingLabel {
  id: string;
  carrier: CarrierCode;
  trackingNumber: string;
  service: string;
  labelFormat: 'ZPL' | 'PDF' | 'PNG';
  labelUrl: string;
  sscc?: string;
  shipDate: string;
  estimatedDelivery?: string;
  fromAddress: Address;
  toAddress: Address;
  weight: number;
  rateCharged?: number;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;        // should be encrypted in transit
  routingNumber?: string;
  iban?: string;
  swiftCode?: string;
}

// ── Partner Network ────────────────────────────────────────────────

export interface PartnerConnection {
  id: string;
  requesterTenantId: string;
  targetTenantId: string;
  status: ConnectionStatus;
  tier: ConnectionTier;
  dataSharingConfig: DataSharingConfig;
  approvedAt?: string;
  createdAt: string;
}

export interface DataSharingConfig {
  shareInventory: boolean;
  sharePricing: boolean;
  shareOrders: boolean;
  shareShipments: boolean;
  allowedDocTypes: DocumentType[];
}

// ── Tracking ──────────────────────────────────────────────────────

export interface TrackingEvent {
  timestamp: string;
  status: string;
  description: string;
  location?: string;
  city?: string;
  country?: string;
}

export interface Shipment {
  id: string;
  carrier: CarrierCode;
  trackingNumber: string;
  status: string;
  origin: Address;
  destination: Address;
  estimatedDelivery?: string;
  actualDelivery?: string;
  events: TrackingEvent[];
  lastSyncedAt?: string;
}

// ── API Responses ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  requestId?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ── Analytics ─────────────────────────────────────────────────────

export interface DashboardKPIs {
  totalDocuments: number;
  documentsThisMonth: number;
  totalPartners: number;
  activePartners: number;
  pendingInvoices: number;
  pendingInvoiceValue: number;
  shipmentsInTransit: number;
  onTimeDeliveryRate: number;
  invoiceMatchRate: number;
  apiCallsThisMonth: number;
}

// ── Webhooks ──────────────────────────────────────────────────────

export interface WebhookPayload {
  id: string;
  event: string;
  tenantId: string;
  timestamp: string;
  data: Record<string, unknown>;
  signature: string;            // HMAC-SHA256 in X-SupplyForge-Signature header
}

export type WebhookEvent =
  | 'po.created' | 'po.sent' | 'po.acknowledged' | 'po.accepted'
  | 'po.rejected' | 'po.cancelled' | 'po.changed'
  | 'invoice.received' | 'invoice.matched' | 'invoice.approved' | 'invoice.disputed'
  | 'asn.created' | 'asn.received'
  | 'delivery.created' | 'delivery.confirmed'
  | 'label.generated'
  | 'tracking.updated' | 'tracking.delivered'
  | 'partner.connected' | 'partner.approved'
  | 'vendor.registered' | 'vendor.verified'
  | 'feed.delivered' | 'feed.error';
