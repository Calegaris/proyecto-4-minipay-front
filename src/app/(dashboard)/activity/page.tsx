'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api, downloadReceiptPdf } from '@/services/api';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
  PaginatedResponse,
} from '@/types/api';
import {
  History,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  X,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los Tipos' },
  { value: 'DEPOSIT', label: 'Depósitos' },
  { value: 'TRANSFER_SENT', label: 'Envíos' },
  { value: 'TRANSFER_RECEIVED', label: 'Recepciones' },
  { value: 'YIELD', label: 'Rendimientos' },
];

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todas las Categorías' },
  { value: 'GENERAL_TRANSFER', label: 'Transferencia General' },
  { value: 'FOOD', label: 'Comida & Gastronomía' },
  { value: 'SERVICES', label: 'Servicios' },
  { value: 'HOUSING', label: 'Vivienda' },
  { value: 'ENTERTAINMENT', label: 'Entretenimiento' },
  { value: 'OTHER', label: 'Otros' },
];

export default function ActivityPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal de Detalle
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (selectedType) params.append('type', selectedType);
      if (selectedCategory) params.append('category', selectedCategory);

      const { data } = await api.get<PaginatedResponse<Transaction>>(
        `/wallet/transactions?${params.toString()}`
      );

      setTransactions(data.data || []);
      setTotalPages(data.meta.totalPages || 1);
      setTotalCount(data.meta.total || 0);
    } catch (err) {
      console.error('Error al cargar transacciones:', err);
      toast.error('Error al consultar el historial de transacciones');
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedType, selectedCategory]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDownloadReceipt = async (transferId: string) => {
    try {
      setDownloadingPdf(true);
      await downloadReceiptPdf(transferId);
      toast.success('¡Comprobante PDF descargado exitosamente!');
    } catch (err) {
      toast.error('No se pudo generar el comprobante PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Historial de Actividad</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro de movimientos y comprobantes oficiales ({totalCount} transacciones)
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista / Tabla de Transacciones */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-indigo-500" />
            Cargando movimientos...
          </div>
        ) : transactions.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {transactions.map((tx) => {
              const isIncome =
                tx.type === 'DEPOSIT' ||
                tx.type === 'TRANSFER_RECEIVED' ||
                tx.type === 'YIELD';

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="py-4 flex items-center justify-between hover:bg-slate-850/50 -mx-3 px-3 rounded-2xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-white text-sm block group-hover:text-indigo-300 transition-colors">
                        {tx.category}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-[11px] text-slate-400">
                          {tx.type}
                        </span>
                        <span>&bull;</span>
                        <span>
                          {new Date(tx.createdAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-base font-bold block ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}$
                      {Number(tx.amount).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    {tx.transferId && (
                      <span className="text-[10px] text-indigo-400 font-medium">
                        Ver Comprobante
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 text-xs">
            No se encontraron movimientos para los filtros seleccionados.
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="pt-6 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Página <strong>{page}</strong> de <strong>{totalPages}</strong>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLE DE TRANSACCIÓN */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Detalle de Operación</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">ID Movimiento:</span>
                <span className="font-mono text-slate-300 truncate max-w-[200px]">
                  {selectedTx.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tipo:</span>
                <span className="font-semibold text-white">{selectedTx.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rubro:</span>
                <span className="text-indigo-400 font-semibold">{selectedTx.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fecha y Hora:</span>
                <span className="text-slate-300">
                  {new Date(selectedTx.createdAt).toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-semibold">Monto:</span>
                <span className="text-lg font-extrabold text-white">
                  ${Number(selectedTx.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS
                </span>
              </div>
            </div>

            {selectedTx.transferId ? (
              <button
                type="button"
                onClick={() => handleDownloadReceipt(selectedTx.transferId!)}
                disabled={downloadingPdf}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {downloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Descargar Comprobante Oficial (PDF)</span>
              </button>
            ) : (
              <div className="text-center text-[11px] text-slate-500">
                Esta operación no posee comprobante bancario transferible.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
