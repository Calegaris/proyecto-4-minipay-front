'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, downloadReceiptPdf } from '@/services/api';
import { Contact, TransactionCategory, Transfer } from '@/types/api';
import {
  Send,
  Users,
  Search,
  CheckCircle2,
  Download,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES: { value: TransactionCategory; label: string; icon: string }[] = [
  { value: 'GENERAL_TRANSFER', label: 'General', icon: '💸' },
  { value: 'FOOD', label: 'Comida / Gastronomía', icon: '🍔' },
  { value: 'SERVICES', label: 'Servicios', icon: '💡' },
  { value: 'HOUSING', label: 'Vivienda / Alquiler', icon: '🏠' },
  { value: 'ENTERTAINMENT', label: 'Entretenimiento', icon: '🎉' },
  { value: 'OTHER', label: 'Otros Gastos', icon: '📦' },
];

function TransfersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { wallet, refreshWallet, refreshUser } = useAuth();

  // Tab: 'manual' o 'contacts'
  const [activeTab, setActiveTab] = useState<'manual' | 'contacts'>('manual');

  // Destinatario
  const [recipientInput, setRecipientInput] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Monto y Categoría
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('GENERAL_TRANSFER');

  // Contactos guardados
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchContact, setSearchContact] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Estados de proceso
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTransfer, setCompletedTransfer] = useState<Transfer | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Leer params si vienen desde otra pantalla (ej. contacts)
  useEffect(() => {
    const toParam = searchParams.get('to');
    if (toParam) {
      setRecipientInput(toParam);
      setActiveTab('manual');
    }
  }, [searchParams]);

  // Cargar contactos
  useEffect(() => {
    async function loadContacts() {
      try {
        setLoadingContacts(true);
        const { data } = await api.get<Contact[]>('/contacts');
        setContacts(data);
      } catch (err) {
        console.error('Error al cargar contactos:', err);
      } finally {
        setLoadingContacts(false);
      }
    }
    loadContacts();
  }, []);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setRecipientInput(contact.contactUser.wallet.alias || contact.contactUser.email);
    setActiveTab('manual');
    toast.info(`Destinatario seleccionado: ${contact.aliasCustomName}`);
  };

  const handleInitiateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!recipientInput.trim()) {
      toast.error('Ingresa el Alias, CVU o Email del destinatario');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    if (wallet && numAmount > Number(wallet.balance)) {
      toast.error('Saldo insuficiente para realizar esta transferencia');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmTransfer = async () => {
    const numAmount = parseFloat(amount);
    const trimmedRecipient = recipientInput.trim();

    // Determinar tipo de destinatario para el DTO
    const payload: {
      amount: number;
      category: TransactionCategory;
      recipientEmail?: string;
      recipientCvu?: string;
      recipientAlias?: string;
    } = {
      amount: numAmount,
      category,
    };

    if (trimmedRecipient.includes('@')) {
      payload.recipientEmail = trimmedRecipient;
    } else if (/^\d{22}$/.test(trimmedRecipient)) {
      payload.recipientCvu = trimmedRecipient;
    } else {
      payload.recipientAlias = trimmedRecipient;
    }

    // Idempotency Key UUID v4
    const idempotencyKey = crypto.randomUUID();

    try {
      setIsProcessing(true);
      const { data } = await api.post<Transfer>('/transfers', payload, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });

      setCompletedTransfer(data);
      setShowConfirmModal(false);
      toast.success('¡Transferencia realizada con éxito!');
      await Promise.all([refreshWallet(), refreshUser()]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al procesar la transferencia';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setShowConfirmModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!completedTransfer) return;
    try {
      setDownloadingPdf(true);
      await downloadReceiptPdf(completedTransfer.id);
      toast.success('¡Comprobante PDF descargado exitosamente!');
    } catch (err) {
      toast.error('No se pudo descargar el comprobante en este momento');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleResetForm = () => {
    setCompletedTransfer(null);
    setAmount('');
    setRecipientInput('');
    setSelectedContact(null);
  };

  // --- PANTALLA DE ÉXITO ---
  if (completedTransfer) {
    return (
      <div className="max-w-xl mx-auto py-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#111827]/90 border border-emerald-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">¡Transferencia Exitosa!</h2>
          <p className="text-sm text-slate-400 mt-1">El dinero fue acreditado en la cuenta de destino.</p>

          <div className="my-6 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span>Monto Enviado</span>
              <span className="text-lg font-bold text-white">
                ${Number(completedTransfer.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Destinatario</span>
              <span className="font-semibold text-slate-200">
                {completedTransfer.receiverWallet?.user.name || recipientInput}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Rubro / Categoría</span>
              <span className="font-medium text-indigo-400">{completedTransfer.category}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Código Operación</span>
              <span className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                {completedTransfer.id}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDownloadReceipt}
              disabled={downloadingPdf}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {downloadingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              <span>Descargar Comprobante Oficial (PDF)</span>
            </button>

            <button
              onClick={handleResetForm}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Realizar otra transferencia
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredContacts = contacts.filter(
    (c) =>
      c.aliasCustomName.toLowerCase().includes(searchContact.toLowerCase()) ||
      c.contactUser.name.toLowerCase().includes(searchContact.toLowerCase()) ||
      c.contactUser.wallet.alias.toLowerCase().includes(searchContact.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Transferir Dinero</h1>
          <p className="text-xs text-slate-400 mt-1">Envía saldo en ARS al instante de forma segura e idempotente</p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">Disponible</span>
          <span className="text-sm font-bold text-emerald-400 font-mono">
            ${wallet ? Number(wallet.balance).toLocaleString('es-AR') : '0'}
          </span>
        </div>
      </div>

      {/* Tabs Destinatario */}
      <div className="flex rounded-2xl bg-slate-900 p-1 border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Ingreso Manual</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Agenda de Contactos ({contacts.length})</span>
        </button>
      </div>

      {/* TAB 1: FORMULARIO MANUAL */}
      {activeTab === 'manual' && (
        <form onSubmit={handleInitiateTransfer} className="bg-[#111827]/80 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-xl">
          {/* Destinatario Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Destinatario (Alias, CVU o Email)
            </label>
            <div className="relative">
              <input
                type="text"
                value={recipientInput}
                onChange={(e) => {
                  setRecipientInput(e.target.value);
                  setSelectedContact(null);
                }}
                required
                placeholder="ej: juan.perez.mp o 00000456... o juan@mail.com"
                className="w-full px-4 py-3.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              />
            </div>
            {selectedContact && (
              <span className="text-[11px] text-indigo-400 mt-1 block">
                Contacto seleccionado: <strong>{selectedContact.aliasCustomName}</strong> ({selectedContact.contactUser.name})
              </span>
            )}
          </div>

          {/* Monto Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Monto a Transferir (ARS)
              </label>
              {wallet && (
                <button
                  type="button"
                  onClick={() => setAmount(String(wallet.balance))}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  Transferir todo (${Number(wallet.balance).toLocaleString('es-AR')})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-xl font-bold text-slate-400">
                $
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0,00"
                className="w-full pl-9 pr-4 py-3.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-extrabold text-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Chips de montos rápidos */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {['1000', '5000', '10000', '20000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    amount === amt
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  +${Number(amt).toLocaleString('es-AR')}
                </button>
              ))}
            </div>
          </div>

          {/* Rubro / Categoría de Gasto */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Categoría del Gasto (Fintech Analytics)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                    category === cat.value
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Seguridad e Idempotencia Info */}
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Transacción protegida por clave de idempotencia única (RFC)</span>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer group"
          >
            <span>Continuar a Confirmación</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      )}

      {/* TAB 2: SELECCIÓN DESDE AGENDA DE CONTACTOS */}
      {activeTab === 'contacts' && (
        <div className="bg-[#111827]/80 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              placeholder="Buscar por apodo, nombre o alias..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {loadingContacts ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Cargando agenda...
            </div>
          ) : filteredContacts.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className="py-3 px-3 flex items-center justify-between hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/30">
                      {contact.aliasCustomName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-white text-sm block group-hover:text-indigo-300">
                        {contact.aliasCustomName}
                      </span>
                      <span className="text-xs text-slate-400 block">
                        {contact.contactUser.name} &bull; {contact.contactUser.wallet.alias}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold group-hover:bg-indigo-600 group-hover:text-white transition-all"
                  >
                    Transferir
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No se encontraron contactos en tu agenda.
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-2">Confirmar Transferencia</h3>
            <p className="text-xs text-slate-400 mb-4">
              Revisa los detalles antes de autorizar el débito en tu cuenta.
            </p>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 mb-6 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Destinatario:</span>
                <span className="font-semibold text-white font-mono truncate max-w-[170px]">
                  {recipientInput}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monto a enviar:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  ${parseFloat(amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rubro:</span>
                <span className="text-indigo-400 font-medium">{category}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">Saldo restante:</span>
                <span className="text-slate-300 font-mono">
                  ${wallet ? (Number(wallet.balance) - parseFloat(amount)).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isProcessing}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={isProcessing}
                className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Enviar Ahora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransfersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <TransfersContent />
    </Suspense>
  );
}
