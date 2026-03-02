import { KpiCard } from '@/components/dashboard/KpiCard';
import { DocumentTrendChart } from '@/components/dashboard/DocumentTrendChart';
import { RecentDocuments } from '@/components/dashboard/RecentDocuments';

// Fiori-style SVG icon nodes for KPI tiles
const IconDoc = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

const IconPartners = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
);

const IconInvoice = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

const IconTruck = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1H5V5a1 1 0 00-1-1H3zM14 7a1 1 0 011 1v1h2.05A2.5 2.5 0 0119 11.5V14a1 1 0 01-1 1h-1.05a2.5 2.5 0 01-4.9 0H11V8a1 1 0 011-1h2z" />
  </svg>
);

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header — SAP Fiori DynamicPage style */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your supply chain at a glance</p>
        </div>
      </div>

      {/* KPI tiles grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Documents This Month"  valueKey="documentsThisMonth" icon={IconDoc}      color="info"     />
        <KpiCard title="Active Partners"       valueKey="activePartners"     icon={IconPartners}  color="positive" />
        <KpiCard title="Pending Invoices"      valueKey="pendingInvoices"    icon={IconInvoice}   color="critical" subKey="pendingInvoiceValue" />
        <KpiCard title="Shipments in Transit"  valueKey="shipmentsInTransit" icon={IconTruck}     color="neutral"  />
      </div>

      {/* Charts — 2/3 + 1/3 split */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DocumentTrendChart />
        </div>
        <div>
          <RecentDocuments />
        </div>
      </div>
    </div>
  );
}
