import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SupplyForge — B2B Logistics Network',
  description: 'Secure B2B logistics network for purchase orders, invoices, shipping, and supply chain collaboration.',
  keywords: ['supply chain', 'logistics', 'B2B', 'purchase order', 'invoice', 'EDI'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
