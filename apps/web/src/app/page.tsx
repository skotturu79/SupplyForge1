import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 text-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full bg-brand-800/50 px-4 py-1.5 text-sm font-medium text-brand-200">
              The secure B2B logistics network
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Connect your supply chain.
              <br />
              <span className="text-brand-300">Securely.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-brand-200">
              Exchange purchase orders, invoices, ASNs, and shipping labels with your business partners
              through encrypted, digitally-signed documents. EDI-compatible, API-first.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register" className="btn-primary text-base px-6 py-3">
                Start for free
              </Link>
              <Link href="/vendors/register" className="btn-secondary text-base px-6 py-3 bg-white/10 border-white/20 text-white hover:bg-white/20">
                Register as vendor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything your supply chain needs
            </h2>
          </div>
          <div className="mx-auto mt-16 max-w-5xl grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Purchase Orders', desc: 'Create, send, and track POs with digital signatures and full audit trail.', icon: '📋' },
              { title: 'Invoice Matching', desc: 'AI-powered 3-way match (PO + ASN + Invoice) with automatic reconciliation.', icon: '🧾' },
              { title: 'Advanced Shipping', desc: 'Generate FedEx, UPS, and DHL labels with GS1 SSCC-18 barcode support.', icon: '📦' },
              { title: 'Shipment Tracking', desc: 'Real-time carrier tracking with automatic webhook notifications.', icon: '🚚' },
              { title: 'Vendor Network', desc: 'Discover and connect with verified vendors. Manage data sharing per partner.', icon: '🤝' },
              { title: 'EDI Compatible', desc: 'Import and export X12 (850/810/856) and UN/EDIFACT (ORDERS/INVOIC/DESADV).', icon: '⚡' },
              { title: 'MCP AI Agent', desc: 'Claude AI integration for automated document processing and smart insights.', icon: '🤖' },
              { title: 'Secure by Design', desc: 'AES-256-GCM document encryption, RSA-PSS digital signatures, HMAC webhooks.', icon: '🔒' },
              { title: 'Developer API', desc: 'REST API with scoped API keys, webhooks, and OpenAPI documentation.', icon: '⚙️' },
            ].map((f) => (
              <div key={f.title} className="card p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              { plan: 'Free', price: '$0', desc: 'Perfect for small businesses', features: ['10,000 API calls/mo', '5 partner connections', 'Basic documents (PO, Invoice, ASN)', 'Email support'], cta: 'Get started free' },
              { plan: 'Pro', price: '$149', desc: 'For growing supply chains', features: ['100,000 API calls/mo', 'Unlimited partners', 'All document types + EDI', 'Label generation', 'AI invoice matching', 'Priority support'], cta: 'Start Pro trial', highlight: true },
              { plan: 'Enterprise', price: 'Custom', desc: 'For large-scale operations', features: ['Unlimited API calls', 'Dedicated infrastructure', 'SAML SSO + MFA', 'AS2 EDI transport', 'SLA guarantee', 'Dedicated CSM'], cta: 'Contact sales' },
            ].map((tier) => (
              <div key={tier.plan} className={`card p-8 ${tier.highlight ? 'ring-2 ring-brand-600' : ''}`}>
                {tier.highlight && (
                  <div className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-4">Most popular</div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{tier.plan}</h3>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {tier.price}
                  {tier.price !== 'Custom' && <span className="text-base font-normal text-gray-500">/month</span>}
                </div>
                <p className="mt-2 text-sm text-gray-600">{tier.desc}</p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start text-sm text-gray-600">
                      <span className="mr-2 text-green-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.plan === 'Enterprise' ? '/contact' : '/auth/register'}
                  className={`mt-8 block text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                    tier.highlight
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
