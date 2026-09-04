'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Wallet,
  LayoutDashboard,
  Send,
  QrCode,
  History,
  Users,
  UserCheck,
  LogOut,
  Loader2,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Transferir', href: '/transfers', icon: Send },
  { label: 'Pagos QR', href: '/qr', icon: QrCode },
  { label: 'Actividad', href: '/activity', icon: History },
  { label: 'Contactos', href: '/contacts', icon: Users },
  { label: 'Mi Perfil', href: '/profile', icon: UserCheck },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, wallet, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0e17]">
        <Loader2 className="w-9 h-9 animate-spin text-indigo-500 mb-3" />
        <span className="text-sm font-medium text-slate-400">Verificando sesión...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0a0e17] text-slate-100">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-[#111827]/90 border-r border-slate-800 shrink-0 p-5 justify-between select-none">
        <div>
          {/* Brand Header */}
          <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-8 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">MiniPay</span>
              <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold block">Billetera Virtual</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-indigo-400" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout in Sidebar Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/60 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden border border-indigo-500/40">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="overflow-hidden">
              <span className="font-semibold text-white text-sm block truncate group-hover:text-indigo-300 transition-colors">
                {user.name}
              </span>
              <span className="text-xs text-slate-400 block truncate">
                {user.email}
              </span>
            </div>
          </Link>

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        {/* Top Header */}
        <header className="h-16 px-4 md:px-8 border-b border-slate-800 bg-[#0a0e17]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-semibold text-white">
                Hola, <span className="text-indigo-400">{user.name}</span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Alias: <span className="font-mono text-slate-300">{wallet?.alias || 'Cargando...'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cuenta Activa</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* --- MOBILE BOTTOM NAVIGATION BAR --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#111827]/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around px-2 z-40">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
