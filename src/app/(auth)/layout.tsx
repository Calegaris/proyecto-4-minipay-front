import React from 'react';
import Link from 'next/link';
import { Wallet } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#0a0e17] overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 text-center z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold tracking-tight text-white block">MiniPay</span>
            <span className="text-xs uppercase tracking-widest text-indigo-400 font-semibold block">Billetera Virtual</span>
          </div>
        </Link>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-md z-10">
        {children}
      </div>

      {/* Footer info */}
      <footer className="mt-8 text-center text-xs text-slate-500 z-10">
        MiniPay &copy; {new Date().getFullYear()} — Plataforma Segura de Pagos Digitales
      </footer>
    </div>
  );
}
