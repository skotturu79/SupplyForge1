import { ok } from '../../_mock/data';

export async function GET() {
  return ok({
    // ── Volume ────────────────────────────────────────────────────
    totalDocuments:       127,
    documentsThisMonth:    38,
    totalPartners:          8,
    activePartners:         6,
    pendingInvoices:        4,
    pendingInvoiceValue: 78400,
    shipmentsInTransit:     3,
    apiCallsThisMonth:   4821,

    // ── OTIF (On Time In Full) ─────────────────────────────────────
    // OTIF = orders delivered both on-time AND in-full
    otif:                  89,   // %  ← headline KPI
    otifTarget:            95,   // % buyer SLA target
    onTimeRate:            94,   // % on-time component
    inFullRate:            96,   // % in-full (fill rate) component
    otifTrend: [           // monthly — last 6 months
      { month: 'Sep', value: 84 },
      { month: 'Oct', value: 86 },
      { month: 'Nov', value: 83 },
      { month: 'Dec', value: 88 },
      { month: 'Jan', value: 91 },
      { month: 'Feb', value: 89 },
    ],

    // ── Perfect Order Rate ─────────────────────────────────────────
    // Orders meeting ALL 4 criteria: on-time, in-full, undamaged, correct docs
    perfectOrderRate:      87,   // %
    perfectOrderComponents: {
      onTime:          94,
      inFull:          96,
      damageFree:      99,
      correctDocs:     97,
    },

    // ── Delivery & Fulfilment ──────────────────────────────────────
    onTimeDeliveryRate:    94,   // % delivered on or before committed date
    fillRate:              96,   // % of ordered qty shipped in first delivery
    backorderRate:          3.8, // % of line items on backorder
    avgLeadTimeDays:        8.5, // actual avg days PO receipt → delivery
    committedLeadTimeDays: 10,   // vendor-committed lead time SLA
    leadTimeCompliance:    92,   // % shipments within committed lead time

    // ── Procurement Responsiveness ─────────────────────────────────
    avgAckTimeHours:        4.2, // avg hours PO receipt → acknowledgement
    ackSlaHours:           24,   // SLA target for PO acknowledgement
    ackComplianceRate:     96,   // % POs acknowledged within SLA
    poAcceptanceRate:      94,   // % POs accepted (vs rejected/cancelled)

    // ── Quality ───────────────────────────────────────────────────
    defectRate:             1.2, // % units returned / rejected on receipt
    returnRate:             0.8, // % orders returned
    firstPassYield:        98.8, // % goods accepted on first inspection
    qualityScore:           97,  // composite quality score

    // ── Financial ─────────────────────────────────────────────────
    invoiceMatchRate:      88,   // % invoices matched to PO without discrepancy
    invoiceAccuracyRate:   94,   // % invoices accepted first-pass
    dso:                   28,   // Days Sales Outstanding (avg payment days)
    paymentTermsDays:      30,   // agreed payment terms
    paymentTermsCompliance: 72,  // % invoices paid within agreed terms
    cashToCashCycleDays:   42,   // cash-to-cash cycle time (days)
    earlyPaymentTaken:      3,   // invoices with early-payment discount taken

    // ── ESG ───────────────────────────────────────────────────────
    carbonPerShipmentKg:   42,   // kg CO2e per average shipment
    carbonReductionTarget: 10,   // % annual reduction target
  });
}
