import { ok, vendorTax, VENDOR1_TENANT_ID } from '../../_mock/data';

const TENANT_ID = VENDOR1_TENANT_ID;

export async function GET() {
  const tax = vendorTax[TENANT_ID] ?? null;
  return ok(tax);
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!vendorTax[TENANT_ID]) {
    vendorTax[TENANT_ID] = {
      legalEntityName: '', companyRegNumber: '', taxId: '', vatNumber: '',
      gstHstNumber: '', gstin: '', abn: '', taxJurisdiction: '',
      taxExempt: false, taxExemptReason: '', w9Status: 'NOT_REQUIRED',
      w8Status: 'NOT_REQUIRED', dunsNumber: '', leiCode: '',
      updatedAt: new Date().toISOString(),
    };
  }
  vendorTax[TENANT_ID] = { ...vendorTax[TENANT_ID], ...body, updatedAt: new Date().toISOString() };
  return ok(vendorTax[TENANT_ID]);
}
