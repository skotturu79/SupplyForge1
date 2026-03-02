# SupplyForge

**SupplyForge** is an open, VC-ready B2B logistics network platform — a modern alternative to SAP Business Network. It enables businesses and vendors to securely exchange supply chain documents, manage partner connections, generate shipping labels, and integrate via REST API, webhooks, or EDI.

---

## Architecture

```
SupplyForge/
├── apps/
│   ├── api/            NestJS REST API (port 3001)
│   ├── web/            Next.js 14 portal (port 3000)
│   └── mcp-server/     Model Context Protocol server (stdio)
├── packages/
│   ├── types/          Shared TypeScript types
│   ├── validators/     Shared Zod validation schemas
│   ├── crypto/         AES-256-GCM, RSA-PSS, HMAC utilities
│   └── edi/            X12 (850/810/856/997) + EDIFACT generators/parsers
└── infrastructure/
    └── docker/         Docker Compose local dev stack
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| API | NestJS 10, Fastify, Prisma ORM |
| Database | PostgreSQL 16 with Row-Level Security |
| Cache / Queues | Redis 7, BullMQ |
| Message Bus | RabbitMQ 3 |
| Object Storage | MinIO (S3-compatible) |
| Search | Elasticsearch 8 |
| Web Portal | Next.js 14 App Router, TailwindCSS, React Query |
| MCP Server | Anthropic MCP SDK, Claude AI |
| Auth | JWT (RS256), argon2 password hashing, TOTP MFA |
| Crypto | AES-256-GCM (documents at rest), RSA-PSS (signatures), HMAC-SHA256 (webhooks) |
| EDI | ANSI X12 + UN/EDIFACT |
| Monorepo | Turborepo |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- pnpm (or npm)

### 1. Clone and install

```bash
git clone <repo>
cd SupplyForge
npm install -g pnpm
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `ENCRYPTION_MASTER_KEY` — generate with `openssl rand -hex 32`
- `JWT_SECRET` — generate with `openssl rand -hex 32`
- Carrier API keys (FedEx, UPS, DHL)
- `ANTHROPIC_API_KEY`

### 3. Start infrastructure

```bash
pnpm docker:up
# or: docker compose -f infrastructure/docker/docker-compose.yml up -d
```

Services started:
- PostgreSQL → `localhost:5432`
- Redis → `localhost:6379`
- RabbitMQ → `localhost:5672` (UI: `localhost:15672`)
- MinIO → `localhost:9000` (Console: `localhost:9001`)
- Elasticsearch → `localhost:9200`
- MailHog → SMTP `localhost:1025` (UI: `localhost:8025`)

### 4. Initialize database

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Generate RSA signing keys

```bash
mkdir -p apps/api/certs
openssl genrsa -out apps/api/certs/signing-private.pem 2048
openssl req -new -x509 -key apps/api/certs/signing-private.pem \
  -out apps/api/certs/signing-cert.pem -days 3650 \
  -subj "/CN=SupplyForge"
```

### 6. Start development servers

```bash
pnpm dev
```

- API: `http://localhost:3001/api/v1`
- Web: `http://localhost:3000`

---

## API Reference

Base URL: `http://localhost:3001/api/v1`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register business account |
| POST | `/auth/login` | Login (returns JWT + refresh token) |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/mfa/setup` | Initiate MFA setup |
| POST | `/auth/mfa/confirm` | Confirm MFA with TOTP code |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/documents` | List documents (filtered) |
| GET | `/documents/:id` | Get document with content |
| GET | `/documents/:id/events` | Get audit trail |
| POST | `/documents/po` | Create purchase order |
| POST | `/documents/po/:id/send` | Send PO to partner |
| POST | `/documents/po/:id/sscc` | Generate GS1 SSCC-18 |
| POST | `/documents/invoice` | Create invoice |
| POST | `/documents/invoice/:id/match` | 3-way match |
| POST | `/documents/asn` | Create ASN |
| PATCH | `/documents/:id/acknowledge` | Acknowledge document |
| PATCH | `/documents/:id/accept` | Accept document |
| PATCH | `/documents/:id/reject` | Reject document |

### Partners

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/partners` | List connections |
| GET | `/partners/search?q=` | Search tenants |
| POST | `/partners/connect` | Request connection |
| PATCH | `/partners/:id/approve` | Approve connection |
| PATCH | `/partners/:id/reject` | Reject connection |

### Carriers & Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/carriers/:carrier/labels` | Generate shipping label |
| GET | `/carriers/:carrier/track/:trackingNumber` | Live tracking |
| GET | `/tracking/:id` | Get shipment |
| POST | `/tracking/:id/refresh` | Force refresh from carrier |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/kpis` | Dashboard KPIs |
| GET | `/analytics/trends?days=30` | Document trend data |

### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/vendors/register` | Register vendor (public) |
| GET | `/vendors/directory` | Browse vendor directory |
| GET | `/vendors/feed?vendorId=` | Get vendor data feed |

### Webhooks & API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/webhooks` | List / create webhooks |
| DELETE | `/webhooks/:id` | Remove webhook |
| GET/POST | `/api-keys` | List / create API keys |
| DELETE | `/api-keys/:id` | Revoke API key |

---

## Security Model

### Document Encryption
All document content is encrypted at rest using **AES-256-GCM**:
- Random 16-byte IV per document
- Authentication tag stored separately
- Master key from `ENCRYPTION_MASTER_KEY` env var
- Decrypted on access within a request context

### Digital Signatures
Documents are signed with **RSA-PSS 2048-bit**:
- SHA-256 hash of document content
- Signature stored alongside ciphertext
- Verified on document read
- Keys in `apps/api/certs/`

### Webhook Security
Webhook payloads are signed with **HMAC-SHA256**:
- Format: `X-SupplyForge-Signature: sha256=<hex>`
- Verified with `verifyWebhookSignature()` using timing-safe comparison
- Compatible with GitHub webhook verification pattern

### Multi-Tenancy
- PostgreSQL Row-Level Security (RLS)
- `SET LOCAL app.tenant_id = '<uuid>'` in every transaction
- All queries automatically scoped to tenant

---

## MCP Server (Claude AI Integration)

The MCP server exposes SupplyForge logistics as tools for Claude:

```bash
# Add to Claude Desktop config (claude_desktop_config.json):
{
  "mcpServers": {
    "supplyforge": {
      "command": "node",
      "args": ["/path/to/SupplyForge/apps/mcp-server/dist/index.js"],
      "env": {
        "API_URL": "http://localhost:3001",
        "SUPPLYFORGE_API_KEY": "sf_live_your_api_key"
      }
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `create_purchase_order` | Create and optionally send a PO |
| `get_document_status` | Get document status by ID or reference |
| `track_shipment` | Track via shipment ID or carrier tracking number |
| `match_invoice_to_po` | 3-way match with optional AI suggestion |
| `search_documents` | Full-featured document search |
| `generate_label` | Generate FedEx/UPS/DHL shipping labels |
| `vendor_performance` | Vendor performance metrics |
| `approve_document` | Acknowledge / accept / reject documents |

---

## EDI Support

```typescript
import { generateX12_850, generateX12_810, parseX12, detectEDIFormat, generateEDIFACT_ORDERS } from '@supplyforge/edi';

// Generate X12 850 Purchase Order
const edi850 = generateX12_850(poData, { senderId: 'SUPPLYFORGE', receiverId: 'PARTNER' });

// Parse incoming X12
const parsed = parseX12(incomingEdiString);

// Generate EDIFACT ORDERS
const edifact = generateEDIFACT_ORDERS(poData, 'SUPPLYFORGE', 'PARTNER');
```

Supported formats:
- **X12**: 850 (PO), 810 (Invoice), 856 (ASN), 997 (Functional Acknowledgment)
- **EDIFACT**: ORDERS, INVOIC

---

## Environment Variables

See [`.env.example`](.env.example) for the full list.

Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` — 256-bit random string
- `ENCRYPTION_MASTER_KEY` — 32-byte hex string (`openssl rand -hex 32`)
- `ANTHROPIC_API_KEY` — For AI invoice matching
- `FEDEX_API_KEY` / `UPS_CLIENT_ID` / `DHL_API_KEY` — Carrier integrations

---

## Pricing Tiers

| Plan | API Calls/mo | Partners | Features |
|------|-------------|----------|----------|
| Free | 10,000 | 5 | PO, Invoice, ASN |
| Pro | 100,000 | Unlimited | + Labels, EDI, AI matching |
| Enterprise | Unlimited | Unlimited | + SSO, AS2, SLA, dedicated CSM |

---

## Roadmap

- [ ] Prisma RLS policies migration
- [ ] Elasticsearch full-text document search
- [ ] SAML SSO integration
- [ ] AS2 EDI transport server
- [ ] Mobile app (React Native)
- [ ] Advanced analytics (demand forecasting)
- [ ] Marketplace / vendor discovery
- [ ] Supplier scorecards

---

## License

MIT
