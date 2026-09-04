'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { QrGenerateResponse, QrPayload, TransactionCategory } from '@/types/api';
import {
  QrCode,
  Camera,
  Zap,
  Clock,
  CheckCircle2,
  Copy,
  AlertTriangle,
  ArrowRight,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { toast } from 'sonner';

function QrHubContent() {
  const searchParams = useSearchParams();
  const { wallet, refreshWallet, refreshUser } = useAuth();

  // Tab: 'pay' o 'charge'
  const [activeTab, setActiveTab] = useState<'pay' | 'charge'>('pay');

  // --- ESTADOS: COBRAR CON QR ---
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');
  const [generatedQr, setGeneratedQr] = useState<QrGenerateResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(900); // 15 minutos

  // --- ESTADOS: PAGAR CON QR ---
  const [scannedCode, setScannedCode] = useState('');
  const [decodedPayload, setDecodedPayload] = useState<QrPayload | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [payCategory, setPayCategory] = useState<TransactionCategory>('SERVICES');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'charge') {
      setActiveTab('charge');
    } else if (tabParam === 'pay') {
      setActiveTab('pay');
    }
  }, [searchParams]);

  // Contador de TTL para el QR generado
  useEffect(() => {
    if (!generatedQr || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [generatedQr, secondsRemaining]);

  // Manejador Generar QR
  const handleGenerateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(chargeAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Ingresa un monto válido para cobrar');
      return;
    }

    try {
      setIsGenerating(true);
      const { data } = await api.post<QrGenerateResponse>('/transfers/qr/generate', {
        amount: numAmount,
        description: chargeDescription.trim() || undefined,
      });

      setGeneratedQr(data);
      setSecondsRemaining(data.expiresInSeconds || 900);
      toast.success('¡Código QR generado con éxito!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al generar código QR');
    } finally {
      setIsGenerating(false);
    }
  };

  // Manejador Decodificar QR
  const handleDecodeQr = async (codeToDecode: string) => {
    const cleanCode = codeToDecode.trim();
    if (!cleanCode) {
      toast.error('El código QR no puede estar vacío');
      return;
    }

    try {
      setIsDecoding(true);
      const { data } = await api.post<{ valid: boolean; payload: QrPayload }>('/transfers/qr/decode', {
        qrCode: cleanCode,
      });

      setDecodedPayload(data.payload);
      setScannedCode(cleanCode);
      setUseCamera(false);
      toast.success('¡Código QR verificado y válido!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Código QR inválido o expirado';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setDecodedPayload(null);
    } finally {
      setIsDecoding(false);
    }
  };

  // Manejador Pagar QR
  const handleConfirmPayQr = async () => {
    if (!scannedCode) return;

    try {
      setIsPaying(true);
      await api.post('/transfers/qr/pay', {
        qrCode: scannedCode,
        category: payCategory,
      });

      setPaymentSuccess(true);
      toast.success('¡Pago procesado exitosamente!');
      await Promise.all([refreshWallet(), refreshUser()]);
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error('Replay Attack: Este código QR ya fue cobrado o tu saldo es insuficiente.', {
          duration: 5000,
        });
      } else {
        const msg = err.response?.data?.message || 'Error al procesar el pago del QR';
        toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    } finally {
      setIsPaying(false);
    }
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('¡Código copiado al portapapeles!');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Hub de Pagos QR</h1>
          <p className="text-xs text-slate-400 mt-1">
            Cobros y pagos instantáneos firmados criptográficamente con HMAC-SHA256
          </p>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex rounded-2xl bg-slate-900 p-1 border border-slate-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab('pay');
            setPaymentSuccess(false);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'pay' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Pagar con QR</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('charge')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'charge' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Cobrar con QR</span>
        </button>
      </div>

      {/* --- TAB 1: PAGAR CON QR --- */}
      {activeTab === 'pay' && (
        <div className="bg-[#111827]/80 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          {paymentSuccess ? (
            <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-200 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-bold text-white">¡Pago QR Exitoso!</h3>
              <p className="text-xs text-slate-400">
                Se transfirieron ${decodedPayload ? Number(decodedPayload.amount).toLocaleString('es-AR') : ''} a {decodedPayload?.receiverName}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPaymentSuccess(false);
                  setDecodedPayload(null);
                  setScannedCode('');
                }}
                className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Pagar otro QR
              </button>
            </div>
          ) : !decodedPayload ? (
            <div className="space-y-5">
              {/* Opción Cámara */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Escanear con Cámara
                </span>
                <button
                  type="button"
                  onClick={() => setUseCamera(!useCamera)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  {useCamera ? 'Desactivar Cámara' : 'Activar Cámara'}
                </button>
              </div>

              {useCamera && (
                <div className="overflow-hidden rounded-2xl border border-indigo-500/40 bg-black aspect-square max-w-sm mx-auto relative">
                  <Scanner
                    onScan={(result) => {
                      if (result && result.length > 0) {
                        handleDecodeQr(result[0].rawValue);
                      }
                    }}
                    onError={(error) => console.log('Scanner error:', error)}
                  />
                  <div className="absolute inset-x-0 bottom-3 text-center pointer-events-none">
                    <span className="bg-black/80 text-white text-[10px] px-3 py-1 rounded-full">
                      Apunta la cámara al código QR
                    </span>
                  </div>
                </div>
              )}

              {/* Opción Manual: Pegar Código */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  O pegar código QR (Token firmado)
                </label>
                <div className="space-y-3">
                  <textarea
                    rows={3}
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    placeholder="Pega aquí el token HMAC-SHA256 del código QR..."
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono text-xs placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleDecodeQr(scannedCode)}
                    disabled={isDecoding || !scannedCode.trim()}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isDecoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                    <span>Decodificar y Previsualizar Pago</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* PREVIEW DEL QR DECODIFICADO */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">QR Verificado Criptográficamente</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDecodedPayload(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Volver a escanear
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Cobrador:</span>
                  <span className="font-bold text-white text-sm">{decodedPayload.receiverName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Alias / CVU:</span>
                  <span className="font-mono text-slate-300">
                    {decodedPayload.receiverAlias || decodedPayload.receiverCvu}
                  </span>
                </div>
                {decodedPayload.description && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Concepto:</span>
                    <span className="text-indigo-400 font-medium">{decodedPayload.description}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                  <span className="text-slate-400 font-semibold">Total a Pagar:</span>
                  <span className="text-xl font-extrabold text-emerald-400 font-mono">
                    ${Number(decodedPayload.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Rubro del Gasto
                </label>
                <select
                  value={payCategory}
                  onChange={(e) => setPayCategory(e.target.value as TransactionCategory)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="SERVICES">💡 Servicios</option>
                  <option value="FOOD">🍔 Comida & Bebida</option>
                  <option value="ENTERTAINMENT">🎉 Entretenimiento</option>
                  <option value="HOUSING">🏠 Vivienda</option>
                  <option value="GENERAL_TRANSFER">💸 General</option>
                  <option value="OTHER">📦 Otro</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleConfirmPayQr}
                disabled={isPaying}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                <span>Confirmar y Pagar ${Number(decodedPayload.amount).toLocaleString('es-AR')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: COBRAR CON QR --- */}
      {activeTab === 'charge' && (
        <div className="bg-[#111827]/80 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          {!generatedQr ? (
            <form onSubmit={handleGenerateQr} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Monto a Cobrar (ARS)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-xl font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    required
                    placeholder="0,00"
                    className="w-full pl-9 pr-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-extrabold text-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Descripción o Concepto (Opcional)
                </label>
                <input
                  type="text"
                  value={chargeDescription}
                  onChange={(e) => setChargeDescription(e.target.value)}
                  placeholder="Ej: Cena del viernes, Servicio freelance..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
                <span>Generar Código QR de Cobro</span>
              </button>
            </form>
          ) : (
            /* QR GENERADO */
            <div className="text-center space-y-5 animate-in fade-in duration-200">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <Clock className="w-4 h-4" />
                <span>Expira en: {formatCountdown(secondsRemaining)}</span>
              </div>

              {/* Código QR renderizado */}
              <div className="p-5 bg-white rounded-3xl inline-block shadow-2xl">
                <QRCodeSVG
                  value={generatedQr.qrCode}
                  size={210}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-1">
                <span className="text-2xl font-extrabold text-white block">
                  ${Number(generatedQr.payload.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS
                </span>
                {generatedQr.payload.description && (
                  <span className="text-xs text-slate-400 block">{generatedQr.payload.description}</span>
                )}
                <span className="text-[11px] text-slate-500 block">
                  Para cobrar en tu cuenta: {wallet?.alias}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedQr.qrCode)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar Token QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGeneratedQr(null);
                    setChargeAmount('');
                    setChargeDescription('');
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Generar otro
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function QrPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <QrHubContent />
    </Suspense>
  );
}
