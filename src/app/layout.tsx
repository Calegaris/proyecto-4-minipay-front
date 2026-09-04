import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'MiniPay — Tu Billetera Virtual Fintech',
  description: 'Billetera digital moderna con transferencias instantáneas, pagos QR, cuentas remuneradas y más.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-[#0a0e17] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" theme="dark" closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
