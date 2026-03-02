import { ok, vendorBanking, VENDOR1_TENANT_ID } from '../../_mock/data';

const TENANT_ID = VENDOR1_TENANT_ID;

export async function GET() {
  const banking = vendorBanking[TENANT_ID] ?? null;
  return ok(banking);
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!vendorBanking[TENANT_ID]) {
    vendorBanking[TENANT_ID] = {
      accountHolderName: '', bankName: '', bankCountry: '', currency: 'USD',
      accountType: 'CURRENT', iban: '', swiftBic: '', routingNumber: '',
      accountNumber: '', sortCode: '', bankAddress: '', intermediaryBank: '',
      paymentReference: '', verified: false, verifiedAt: null,
    };
  }
  Object.assign(vendorBanking[TENANT_ID], body);
  return ok(vendorBanking[TENANT_ID]);
}
