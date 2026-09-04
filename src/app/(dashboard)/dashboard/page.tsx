'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { WalletStats, YieldSummary, Transaction } from '@/types/api';
import {
  Eye,
  EyeOff,
  Copy,
  Send,
  PlusCircle,
  QrCode,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  X,
  Check,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';

const CATEGORY_COLORS: Record<string, string> = {
  SERVICES: '#6366f1',
  FOOD: '#f59e0b',
  HOUSING: '#3b82f6',
  ENTERTAINMENT: '#ec4899',
  GENERAL_TRANSFER: '#8b5cf6',
  YIELD: '#10b981',
  OTHER: '#64748b',
};

const CATEGORY_LABELS: Record<string, string> = {
  SERVICES: 'Servicios',
  FOOD: 'Comida & Bebida',
  HOUSING: 'Vivienda',
  ENTERTAINMENT: 'Entretenimiento',
  GENERAL_TRANSFER: 'Transferencia',
  YIELD: 'Rendimiento TNA',
  OTHER: 'Otros',
};

export default function DashboardPage() {
  const { wallet, refreshWallet, refreshUser } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [yieldData, setYieldData] = useState<YieldSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modal de Depósito
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('10000');
  const [isDepositing, setIsDepositing] = useState(false);

  // Rendimiento
  const [isSimulatingYield, setIsSimulatingYield] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [statsRes, yieldRes, txRes] = await Promise.all([
        api.get<WalletStats>('/wallet/stats').catch(() => ({ data: null })),
        api.get<YieldSummary>('/wallet/yields').catch(() => ({ data: null })),
        api.get<{ data: Transaction[] }>('/wallet/transactions?limit=5').catch(() => ({ data: { data: [] } })),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (yieldRes.data) setYieldData(yieldRes.data);
      if (txRes.data?.data) setRecentTransactions(txRes.data.data);
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`¡${label} copiado al portapapeles!`);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    try {
      setIsDepositing(true);
      await api.post('/wallet/deposit', { amount: amountNum });
      toast.success(`¡Depósito de $${amountNum.toLocaleString('es-AR')} acreditado!`);
      setShowDepositModal(false);
      await Promise.all([refreshWallet(), refreshUser(), fetchDashboardData()]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al procesar el depósito');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleSimulateYield = async () => {
    try {
      setIsSimulatingYield(true);
      const { data } = await api.post('/wallet/simulate-yield');
      toast.success(data.message || `¡Rendimiento acreditado exitosamente!`);
      await Promise.all([refreshWallet(), refreshUser(), fetchDashboardData()]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo acreditar el rendimiento diario.');
    } finally {
      setIsSimulatingYield(false);
    }
  };

  const formattedBalance = wallet
    ? Number(wallet.balance).toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
      })
    : '$ 0,00';

  const chartData = stats?.spendingByCategory?.length
    ? stats.spendingByCategory.map((item) => ({
        name: CATEGORY_LABELS[item.category] || item.category,
        value: Number(item.total),
        color: CATEGORY_COLORS[item.category] || '#64748b',
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* 1. TARJETA DE BILLETERA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#111827] to-indigo-950/40 border border-slate-800 p-6 md:p-8 shadow-xl">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Saldo Disponible</span>
              <button
                type="button"
                onClick={() => setHideBalance(!hideBalance)}
                className="p-1 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors"
                title={hideBalance ? 'Mostrar saldo' : 'Ocultar saldo'}
              >
                {hideBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              {hideBalance ? '$ ••••••' : formattedBalance}
            </div>

            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/80 font-mono">
                <span className="text-slate-400">Alias:</span>
                <span className="font-semibold text-white">{wallet?.alias || '...'}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(wallet?.alias || '', 'Alias')}
                  className="ml-1 text-slate-400 hover:text-indigo-400 transition-colors"
                  title="Copiar Alias"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/80 font-mono">
                <span className="text-slate-400">CVU:</span>
                <span className="font-semibold text-white">{wallet?.cvu || '...'}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(wallet?.cvu || '', 'CVU')}
                  className="ml-1 text-slate-400 hover:text-indigo-400 transition-colors"
                  title="Copiar CVU"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions (Desktop & Tablet) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <Link
              href="/transfers"
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Send className="w-5 h-5 mb-1.5" />
              <span>Transferir</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowDepositModal(true)}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 font-medium text-xs border border-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 mb-1.5" />
              <span>Depositar</span>
            </button>

            <Link
              href="/qr?tab=pay"
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-white font-medium text-xs border border-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              <QrCode className="w-5 h-5 mb-1.5 text-indigo-400" />
              <span>Pagar QR</span>
            </Link>

            <Link
              href="/qr?tab=charge"
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-white font-medium text-xs border border-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              <Zap className="w-5 h-5 mb-1.5 text-amber-400" />
              <span>Cobrar QR</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. FILA DE WIDGETS: CUENTA REMUNERADA & ANALÍTICA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget Cuenta Remunerada 35% TNA */}
        <div className="rounded-3xl bg-[#111827]/80 border border-slate-800 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Cuenta Remunerada</h2>
                  <span className="text-xs text-emerald-400 font-semibold">35.0% TNA Anual</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Rendimiento Diario
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              Tu dinero crece automáticamente día a día sin necesidad de inmovilizarlo.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                  Ganado Hoy
                </span>
                <span className="text-xl font-bold text-emerald-400">
                  +${yieldData ? Number(yieldData.todayEarnedYield).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0,00'}
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                  Proyección Mensual
                </span>
                <span className="text-xl font-bold text-white">
                  +${yieldData ? Number(yieldData.projectedMonthlyYield).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0,00'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateYield}
            disabled={isSimulatingYield}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSimulatingYield ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Simular / Acreditar Rendimiento Ahora</span>
          </button>
        </div>

        {/* Analítica de Gastos por Rubro (Donut Chart) */}
        <div className="rounded-3xl bg-[#111827]/80 border border-slate-800 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-white">Gastos por Rubro</h2>
              <span className="text-xs text-slate-400 font-medium">Este Mes</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Distribución de tus egresos y consumos del período actual.
            </p>

            {chartData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-44 h-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`$${Number(val).toLocaleString('es-AR')}`, 'Monto']}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-2 w-full">
                  {stats?.spendingByCategory?.map((item) => (
                    <div key={item.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#64748b' }}
                        />
                        <span className="text-slate-300">{CATEGORY_LABELS[item.category] || item.category}</span>
                      </div>
                      <span className="font-semibold text-white">
                        {Number(item.percentage).toFixed(1)}% (${Number(item.total).toLocaleString('es-AR')})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Sin egresos registrados este mes aún.</span>
                <span className="text-[11px] text-slate-500 mt-1">Realiza tu primera transferencia para ver las métricas.</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Total Egresos: <strong className="text-rose-400 font-semibold">${stats ? Number(stats.expenses).toLocaleString('es-AR') : '0'}</strong></span>
            <span>Ahorro Neto: <strong className="text-emerald-400 font-semibold">${stats ? Number(stats.netSavings).toLocaleString('es-AR') : '0'}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. ÚLTIMOS MOVIMIENTOS */}
      <div className="rounded-3xl bg-[#111827]/80 border border-slate-800 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Últimos Movimientos</h2>
          <Link
            href="/activity"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECEIVED' || tx.type === 'YIELD';
              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isIncome ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {isIncome ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white block">
                        {CATEGORY_LABELS[tx.category] || tx.category}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {new Date(tx.createdAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-bold block ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}${Number(tx.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      {tx.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            No tienes transacciones recientes.
          </div>
        )}
      </div>

      {/* 4. MODAL DE DEPÓSITO */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">Ingresar Dinero</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Acredita saldo ficticio de prueba a tu billetera para transferir o invertir.
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Monto a ingresar (ARS)
                </label>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Ej. 10000"
                  required
                />
              </div>

              {/* Chips de montos rápidos */}
              <div className="grid grid-cols-4 gap-2">
                {['5000', '10000', '25000', '50000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      depositAmount === amt
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ${Number(amt) / 1000}k
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isDepositing}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDepositing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  <span>Confirmar Depósito</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
