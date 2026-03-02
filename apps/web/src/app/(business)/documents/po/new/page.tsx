'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface LineItem {
  sku: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  hsCode: string;
}

interface POFormValues {
  receiverTenantId: string;
  currency: string;
  paymentTerms: string;
  incoterms: string;
  deliveryDate: string;
  externalRef: string;
  notes: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lineItems: LineItem[];
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'];
const PAYMENT_TERMS = ['NET15', 'NET30', 'NET45', 'NET60', 'NET90', 'COD', 'PREPAID'];
const INCOTERMS = ['', 'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'];
const UNITS = ['EA', 'KG', 'LB', 'M', 'FT', 'L', 'BOX', 'PALLET'];

export default function NewPOPage() {
  const router = useRouter();

  const { data: partners = [] } = useQuery<Array<{ id: string; status: string; requester: { id: string; name: string }; target: { id: string; name: string }; requesterTenantId: string; targetTenantId: string }>>({
    queryKey: ['partners-approved'],
    queryFn: () => apiClient.get('/partners', { params: { status: 'APPROVED' } }).then((r) => r.data),
  });

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<POFormValues>({
    defaultValues: {
      currency: 'USD',
      paymentTerms: 'NET30',
      incoterms: '',
      lineItems: [{ sku: '', description: '', quantity: 1, unit: 'EA', unitPrice: 0, hsCode: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  const lineItems = watch('lineItems');
  const currency = watch('currency');

  const subtotal = lineItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const createMutation = useMutation({
    mutationFn: (values: POFormValues) =>
      apiClient.post('/documents/purchase-orders', {
        receiverTenantId: values.receiverTenantId,
        currency: values.currency,
        paymentTerms: values.paymentTerms,
        incoterms: values.incoterms || undefined,
        deliveryDate: new Date(values.deliveryDate).toISOString(),
        externalRef: values.externalRef || undefined,
        notes: values.notes || undefined,
        deliveryAddress: {
          street: values.street,
          city: values.city,
          state: values.state || undefined,
          zip: values.zip,
          country: values.country,
        },
        lineItems: values.lineItems.map((li, idx) => ({
          lineNumber: idx + 1,
          sku: li.sku,
          description: li.description,
          quantity: Number(li.quantity),
          unit: li.unit,
          unitPrice: Number(li.unitPrice),
          totalPrice: Number(li.quantity) * Number(li.unitPrice),
          hsCode: li.hsCode || undefined,
        })),
      }),
    onSuccess: () => router.push('/documents'),
  });

  const onSubmit = (values: POFormValues) => createMutation.mutate(values);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/documents" className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send a new PO to one of your connected partners</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Recipient */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Recipient</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Partner</label>
            <select {...register('receiverTenantId', { required: 'Please select a recipient' })} className="input">
              <option value="">Select a connected partner...</option>
              {partners.map((p) => (
                <option key={p.id} value={p.targetTenantId}>
                  {p.target?.name || p.targetTenantId}
                </option>
              ))}
            </select>
            {errors.receiverTenantId && <p className="mt-1 text-xs text-red-600">{errors.receiverTenantId.message}</p>}
            {partners.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">No approved partners. <Link href="/partners" className="underline">Connect with partners</Link> first.</p>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Order Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select {...register('currency')} className="input">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <select {...register('paymentTerms', { required: true })} className="input">
                {PAYMENT_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incoterms (optional)</label>
              <select {...register('incoterms')} className="input">
                {INCOTERMS.map((t) => <option key={t} value={t}>{t || '— None —'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Required Delivery Date</label>
              <input {...register('deliveryDate', { required: 'Delivery date is required' })} type="date" className="input" />
              {errors.deliveryDate && <p className="mt-1 text-xs text-red-600">{errors.deliveryDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">External Reference (optional)</label>
              <input {...register('externalRef')} className="input" placeholder="Your internal PO number" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea {...register('notes')} className="input h-20 resize-none" placeholder="Special instructions, handling notes..." />
          </div>
        </div>

        {/* Delivery Address */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Delivery Address</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input {...register('street', { required: 'Required' })} className="input" placeholder="123 Main St" />
            {errors.street && <p className="mt-1 text-xs text-red-600">{errors.street.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input {...register('city', { required: 'Required' })} className="input" />
              {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State / Region (optional)</label>
              <input {...register('state')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
              <input {...register('zip', { required: 'Required' })} className="input" />
              {errors.zip && <p className="mt-1 text-xs text-red-600">{errors.zip.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country (ISO 3166)</label>
              <input {...register('country', { required: 'Required', minLength: 2, maxLength: 2 })} className="input" placeholder="US" maxLength={2} />
              {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Line Items</h2>
            <button
              type="button"
              onClick={() => append({ sku: '', description: '', quantity: 1, unit: 'EA', unitPrice: 0, hsCode: '' })}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              + Add Line
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, idx) => {
              const qty = Number(lineItems[idx]?.quantity) || 0;
              const price = Number(lineItems[idx]?.unitPrice) || 0;
              return (
                <div key={field.id} className="rounded-lg border border-gray-200 p-4 space-y-3 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Line {idx + 1}</span>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(idx)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">SKU</label>
                      <input {...register(`lineItems.${idx}.sku`, { required: 'Required' })} className="input text-sm" placeholder="PROD-001" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">HS Code (optional)</label>
                      <input {...register(`lineItems.${idx}.hsCode`)} className="input text-sm" placeholder="8471.30" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description</label>
                    <input {...register(`lineItems.${idx}.description`, { required: 'Required' })} className="input text-sm" placeholder="Product description" />
                  </div>
                  <div className="grid grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                      <input {...register(`lineItems.${idx}.quantity`, { required: true, min: 0.001 })} type="number" min="0.001" step="any" className="input text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Unit</label>
                      <select {...register(`lineItems.${idx}.unit`)} className="input text-sm">
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Unit Price ({currency})</label>
                      <input {...register(`lineItems.${idx}.unitPrice`, { required: true, min: 0 })} type="number" min="0" step="0.01" className="input text-sm" />
                    </div>
                    <div className="text-right">
                      <label className="block text-xs text-gray-500 mb-1">Total</label>
                      <p className="text-sm font-medium text-gray-900 py-2">{currency} {(qty * price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {createMutation.isError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            Failed to create purchase order. Please check your inputs and try again.
          </div>
        )}

        {/* Sticky bottom bar */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-xl -mx-0 px-6 py-4 flex items-center justify-between shadow-lg">
          <div className="text-right">
            <p className="text-xs text-gray-500">Subtotal</p>
            <p className="text-xl font-bold text-gray-900">
              {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/documents" className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={isSubmitting || createMutation.isPending} className="btn-primary px-6">
              {isSubmitting || createMutation.isPending ? 'Creating...' : 'Send Purchase Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
