import { ok, created, vendorVault, VENDOR1_TENANT_ID } from '../../_mock/data';

const TENANT_ID = VENDOR1_TENANT_ID;

export async function GET() {
  const items = vendorVault.filter((v) => v.tenantId === TENANT_ID);
  const expiringSoon = items.filter((v) => v.status === 'EXPIRING_SOON').length;
  const expired      = items.filter((v) => v.status === 'EXPIRED').length;
  return ok({ data: items, total: items.length, expiringSoon, expired });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const now  = new Date().toISOString();
  const item = {
    id:              `vault-${Date.now()}`,
    tenantId:        TENANT_ID,
    docType:         body.docType         ?? 'OTHER',
    name:            body.name            ?? '',
    issuer:          body.issuer          ?? '',
    referenceNumber: body.referenceNumber ?? '',
    issuedAt:        body.issuedAt        ?? now,
    expiresAt:       body.expiresAt       ?? null,
    status:          'PENDING_REVIEW' as const,
    fileSize:        body.fileSize        ?? 0,
    fileType:        body.fileType        ?? 'PDF',
    uploadedAt:      now,
    notes:           body.notes           ?? '',
  } as typeof vendorVault[0];
  vendorVault.push(item);
  return created(item);
}
