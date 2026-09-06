'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { Contact } from '@/types/api';
import {
  Users,
  UserPlus,
  Search,
  Send,
  Trash2,
  Loader2,
  X,
  Check,
  Mail,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal Agregar Contacto
  const [showAddModal, setShowAddModal] = useState(false);
  const [aliasCustomName, setAliasCustomName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Eliminando
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<Contact[]>('/contacts');
      setContacts(data || []);
    } catch (err) {
      console.error('Error al cargar contactos:', err);
      toast.error('No se pudo cargar la agenda de contactos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasCustomName.trim() || !identifier.trim()) {
      toast.error('Completa todos los campos');
      return;
    }

    const payload: {
      aliasCustomName: string;
      contactEmail?: string;
      contactCvu?: string;
      contactAlias?: string;
    } = {
      aliasCustomName: aliasCustomName.trim(),
    };

    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      payload.contactEmail = trimmed;
    } else if (/^\d{22}$/.test(trimmed)) {
      payload.contactCvu = trimmed;
    } else {
      payload.contactAlias = trimmed;
    }

    try {
      setIsSubmitting(true);
      await api.post('/contacts', payload);
      toast.success('¡Contacto agregado exitosamente!');
      setShowAddModal(false);
      setAliasCustomName('');
      setIdentifier('');
      fetchContacts();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al guardar contacto';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${name} de tu agenda?`)) return;

    try {
      setDeletingId(id);
      await api.delete(`/contacts/${id}`);
      toast.success('Contacto eliminado de tu agenda');
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar contacto');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.aliasCustomName.toLowerCase().includes(q) ||
      c.contactUser.name.toLowerCase().includes(q) ||
      c.contactUser.email.toLowerCase().includes(q) ||
      c.contactUser.wallet.alias.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Agenda de Contactos</h1>
          <p className="text-xs text-slate-400 mt-1">
            Destinatarios frecuentes guardados para transferir con un toque ({contacts.length})
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Agregar Contacto</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por apodo, nombre, email o alias bancario..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700/80 rounded-2xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Grid de Contactos */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-indigo-500" />
          Cargando agenda...
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-3xl bg-[#111827]/80 border border-slate-800 hover:border-slate-700/80 transition-all shadow-lg flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center text-base border border-indigo-500/30 shrink-0">
                    {c.aliasCustomName.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-bold text-white text-sm block truncate">
                      {c.aliasCustomName}
                    </span>
                    <span className="text-xs text-slate-400 block truncate">
                      {c.contactUser.name}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteContact(c.id, c.aliasCustomName)}
                  disabled={deletingId === c.id}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar de la agenda"
                >
                  {deletingId === c.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-mono text-[11px] truncate text-slate-300">
                    {c.contactUser.wallet.alias}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate text-slate-400 text-[11px]">
                    {c.contactUser.email}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3">
                <Link
                  href={`/transfers?to=${encodeURIComponent(c.contactUser.wallet.alias)}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all group"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transferir Dinero</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-3xl bg-slate-900/40">
          <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <span>No se encontraron contactos en tu agenda.</span>
        </div>
      )}

      {/* MODAL AGREGAR CONTACTO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">Nuevo Contacto</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Guarda un destinatario en tu agenda para realizar transferencias rápidas.
            </p>

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Apodo Personalizado
                </label>
                <input
                  type="text"
                  value={aliasCustomName}
                  onChange={(e) => setAliasCustomName(e.target.value)}
                  placeholder="Ej: Mamá, Juan Amigo, Alquiler..."
                  required
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Identificador (Alias, CVU o Email)
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="juan.perez.mp o 00000456... o juan@mail.com"
                  required
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Guardar en Agenda</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
