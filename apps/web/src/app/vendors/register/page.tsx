'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VendorRegisterSchema } from '@supplyforge/validators';
import type { VendorRegister } from '@supplyforge/validators';
import { apiClient } from '@/lib/api-client';

const CATEGORY_OPTIONS = [
  'Electronics', 'Raw Materials', 'Packaging', 'Chemicals',
  'Textiles', 'Food & Beverage', 'Automotive', 'Medical',
  'Machinery', 'Construction', 'IT & Technology', 'Other',
];

export default function VendorRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<VendorRegister>({
    resolver: zodResolver(VendorRegisterSchema),
    defaultValues: { categories: [] },
  });

  const toggleCategory = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(next);
    setValue('categories', next, { shouldValidate: true });
  };

  const onSubmit = async (data: VendorRegister) => {
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/vendors/register', { ...data, categories: selectedCategories });
      router.push('/vendors/register/success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-emerald-700">
      {/* Top nav */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-sm">SF</div>
          <span className="font-semibold text-white">SupplyForge</span>
        </Link>
        <Link href="/auth/login" className="text-sm text-emerald-200 hover:text-white">
          Already have an account? Sign in
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🏭</div>
          <h1 className="text-3xl font-bold text-white">Join as a Vendor</h1>
          <p className="mt-3 text-emerald-200 text-lg">
            Get discovered by businesses worldwide. Receive orders, exchange secure documents,
            and manage your supply chain relationships in one place.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: '🔍', title: 'Get Discovered', desc: 'Listed in our searchable vendor directory' },
            { icon: '🔒', title: 'Secure Comms', desc: 'Encrypted POs, invoices, and ASNs' },
            { icon: '📊', title: 'Data Feeds', desc: 'Push inventory & pricing to partners' },
          ].map((b) => (
            <div key={b.title} className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{b.icon}</div>
              <div className="text-sm font-semibold text-white">{b.title}</div>
              <div className="text-xs text-emerald-200 mt-1">{b.desc}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Create your vendor account</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input {...register('companyName')} className="input" placeholder="Acme Manufacturing Inc." />
              {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input {...register('firstName')} className="input" placeholder="Jane" />
                {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input {...register('lastName')} className="input" placeholder="Smith" />
                {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
              <input {...register('email')} type="email" className="input" placeholder="jane@acme-mfg.com" />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input {...register('password')} type="password" className="input"
                placeholder="Min 12 chars — upper, lower, number, symbol" />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country (ISO 3166)</label>
                <input {...register('country')} className="input" placeholder="US" maxLength={2} />
                {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                <input {...register('website')} className="input" placeholder="https://acme-mfg.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VAT ID (optional)</label>
              <input {...register('vatId')} className="input" placeholder="EU123456789" />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Categories
                <span className="ml-1 text-gray-400 font-normal text-xs">(select 1–10)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`text-sm px-3 py-1.5 rounded-full border font-medium transition-colors ${
                      selectedCategories.includes(cat)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {errors.categories && (
                <p className="mt-1 text-xs text-red-600">{errors.categories.message as string}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || selectedCategories.length === 0}
              className="rounded-lg bg-emerald-600 text-white w-full py-3 font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {loading ? 'Creating account...' : 'Create Vendor Account'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              By registering you agree to our{' '}
              <Link href="/terms" className="text-emerald-600 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>.
              Your account will be reviewed before appearing in the public directory.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
