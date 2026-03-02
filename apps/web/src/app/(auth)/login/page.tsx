'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { storeAuth, portalPath, type MockUser } from '@/lib/mock-auth';

const DEMO_ACCOUNTS = [
  { label: 'Business Admin',  email: 'john.smith@acme-mfg.com',    portal: 'Business Portal',  color: 'bg-blue-50 border-blue-200 text-[#0070F2]' },
  { label: 'Vendor (GlobalParts)', email: 'sarah.j@globalparts.com', portal: 'Vendor Portal', color: 'bg-green-50 border-green-200 text-[#107E3E]' },
  { label: 'Vendor (FastShip)',    email: 'tom.b@fastship.com',       portal: 'Vendor Portal', color: 'bg-emerald-50 border-emerald-200 text-[#107E3E]' },
];

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const registered   = searchParams.get('registered') === '1';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email and password are required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { token, user } = res.data as { token: string; user: MockUser };
      storeAuth(token, user);
      router.push(portalPath(user));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F6F7] px-4">
      <div className="w-full max-w-md space-y-5">

        {/* Brand */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: '#0070F2' }}>
              SF
            </div>
            <span className="text-xl font-semibold text-[#32363A]">SupplyForge</span>
          </div>
          <h1 className="text-xl font-semibold text-[#32363A]">Sign in to your portal</h1>
          <p className="text-sm text-[#6A6D70] mt-1">
            No account?{' '}
            <Link href="/register" className="text-[#0070F2] hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>

        {/* Registered success banner */}
        {registered && (
          <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-[#107E3E]">
            Account created. You can now sign in.
          </div>
        )}

        {/* Login card */}
        <div className="card p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#32363A] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#32363A]">Password</label>
                <span className="text-xs text-[#6A6D70]">Any value works in demo</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#BB0000]">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-1">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Demo quick-fill */}
        <div className="card p-5">
          <p className="text-xs font-medium text-[#6A6D70] uppercase tracking-wide mb-3">
            Demo Accounts — click to fill
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword('Demo1234!'); setError(''); }}
                className={`w-full text-left rounded border px-3 py-2.5 flex items-center justify-between gap-2 hover:opacity-90 transition-opacity ${acc.color}`}
              >
                <div>
                  <div className="text-xs font-semibold">{acc.label}</div>
                  <div className="text-xs opacity-75 mt-0.5">{acc.email}</div>
                </div>
                <span className="text-xs opacity-60 flex-shrink-0">{acc.portal}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
