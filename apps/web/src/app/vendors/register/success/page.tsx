import Link from 'next/link';

export default function VendorRegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-md w-full">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">Application Submitted!</h1>
        <p className="mt-3 text-gray-600">
          Your vendor account has been created and is now pending verification.
          We typically review applications within <strong>2 business days</strong>.
        </p>

        <div className="mt-6 space-y-2 text-left bg-gray-50 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700">What happens next:</p>
          {[
            'Our team will review your company information',
            'You\'ll receive an email when your account is verified',
            'Once verified, you\'ll appear in the vendor directory',
            'Partners can then send you connection requests',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-emerald-600 font-bold mt-0.5">{i + 1}.</span>
              {step}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link href="/auth/login"
            className="rounded-lg bg-emerald-600 text-white py-2.5 font-medium text-sm hover:bg-emerald-700 transition-colors text-center">
            Sign in to your account
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
