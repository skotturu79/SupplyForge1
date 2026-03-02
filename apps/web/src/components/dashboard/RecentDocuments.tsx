'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface DocItem {
  id: string;
  type: string;
  status: string;
  referenceNumber: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

/** SAP Fiori ObjectStatus — semantic dot + label */
const objectStatus: Record<string, { dot: string; text: string; label: string }> = {
  DRAFT:        { dot: 'bg-[#6A6D70]',   text: 'text-[#6A6D70]',   label: 'Draft'        },
  SENT:         { dot: 'bg-[#0A6ED1]',     text: 'text-[#0A6ED1]',     label: 'Sent'         },
  ACKNOWLEDGED: { dot: 'bg-amber-400',      text: 'text-amber-600',      label: 'Acknowledged' },
  ACCEPTED:     { dot: 'bg-[#107E3E]', text: 'text-[#107E3E]', label: 'Accepted'     },
  REJECTED:     { dot: 'bg-[#BB0000]', text: 'text-[#BB0000]', label: 'Rejected'     },
  PAID:         { dot: 'bg-[#107E3E]', text: 'text-[#107E3E]', label: 'Paid'         },
  CANCELLED:    { dot: 'bg-gray-400',       text: 'text-[#6A6D70]',   label: 'Cancelled'    },
};

function ObjectStatus({ status }: { status: string }) {
  const s = objectStatus[status] ?? objectStatus['DRAFT'];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function RecentDocuments() {
  const { data, isLoading } = useQuery<{ data: DocItem[] }>({
    queryKey: ['recent-documents'],
    queryFn: () => apiClient.get('/documents?limit=8').then((r) => r.data),
  });

  return (
    <div className="card">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-[#EDEDED] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#32363A]">Recent Documents</h3>
        <Link
          href="/documents"
          className="text-xs text-[#0070F2] hover:text-blue-700 font-medium transition-colors"
        >
          View all →
        </Link>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 bg-[#F5F6F7] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-[#EDEDED]">
          {(data?.data ?? []).map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-[#F5F6F7]/60 transition-colors"
            >
              <div className="min-w-0 flex-1">
                {/* Type chip + status */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#32363A] uppercase tracking-wide bg-gray-100 px-1.5 py-0.5 rounded">
                    {doc.type}
                  </span>
                  <ObjectStatus status={doc.status} />
                </div>
                {/* Reference */}
                <div className="text-[11px] text-[#6A6D70] mt-0.5 truncate">{doc.referenceNumber}</div>
              </div>

              {/* Amount */}
              {doc.totalAmount > 0 && (
                <div className="ml-3 text-sm font-medium text-[#32363A] flex-shrink-0">
                  {doc.currency} {doc.totalAmount.toLocaleString()}
                </div>
              )}
            </Link>
          ))}

          {(data?.data ?? []).length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[#6A6D70]">
              No documents yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
