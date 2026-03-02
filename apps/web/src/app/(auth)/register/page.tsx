'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function RegisterPage() {
  const router  = useRouter();
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: '', firstName: '', lastName: '',
    email: '', password: '', country: 'US', planTier: 'FREE', acceptTerms: false,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.acceptTerms) { setError('You must accept the Terms of Service'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/register', form);
      router.push('/login?registered=1');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F6F7] px-4 py-12">
      <div className="w-full max-w-lg space-y-5">

        {/* Brand */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: '#0070F2' }}>
              SF
            </div>
            <span className="text-xl font-semibold text-[#32363A]">SupplyForge</span>
          </div>
          <h1 className="text-xl font-semibold text-[#32363A]">Create your business account</h1>
          <p className="text-sm text-[#6A6D70] mt-1">
            Already have an account?{' '}
            <Link href="/login" className="text-[#0070F2] hover:underline font-medium">Sign in</Link>
          </p>
        </div>

        <div className="card p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#32363A] mb-1">Company Name *</label>
              <input value={form.companyName} onChange={set('companyName')} className="input" placeholder="Acme Corp" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#32363A] mb-1">First Name *</label>
                <input value={form.firstName} onChange={set('firstName')} className="input" placeholder="John" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#32363A] mb-1">Last Name *</label>
                <input value={form.lastName} onChange={set('lastName')} className="input" placeholder="Doe" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#32363A] mb-1">Business Email *</label>
              <input value={form.email} onChange={set('email')} type="email" className="input" placeholder="john@acme.com" required />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#32363A] mb-1">Password *</label>
              <input value={form.password} onChange={set('password')} type="password" className="input" placeholder="Min 8 characters" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#32363A] mb-1">Country (ISO)</label>
                <input value={form.country} onChange={set('country')} className="input" placeholder="US" maxLength={2} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#32363A] mb-1">Plan</label>
                <select value={form.planTier} onChange={set('planTier')} className="input">
                  <option value="FREE">Free</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={set('acceptTerms')}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <label className="text-sm text-[#6A6D70]">
                I agree to the{' '}
                <Link href="/terms" className="text-[#0070F2] hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-[#0070F2] hover:underline">Privacy Policy</Link>
              </label>
            </div>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#BB0000]">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-1">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
