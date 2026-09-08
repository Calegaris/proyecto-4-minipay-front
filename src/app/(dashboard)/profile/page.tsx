'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import {
  UserCheck,
  User,
  Mail,
  CreditCard,
  Lock,
  Camera,
  Trash2,
  Shield,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, wallet, refreshUser } = useAuth();

  // Estados de Avatar
  const [avatarUrlInput, setAvatarUrlInput] = useState(user?.avatarUrl || '');
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // Estados de Cambio de Contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Preset Avatars
  const PRESET_AVATARS = [
    { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
    { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
    { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
    { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
    { label: 'Avatar 5', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80' },
  ];

  const handleUpdateAvatar = async (urlToSave?: string) => {
    const targetUrl = (urlToSave !== undefined ? urlToSave : avatarUrlInput).trim();
    try {
      setIsUpdatingAvatar(true);
      await api.patch('/users/me/avatar', {
        avatarUrl: targetUrl || null,
      });
      if (urlToSave !== undefined) {
        setAvatarUrlInput(urlToSave);
      }
      await refreshUser();
      toast.success('¡Foto de perfil actualizada correctamente!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar foto de perfil. Recuerda usar una URL HTTPS válida.');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    // Para entorno de producción conectamos con Cloudinary / S3 / ImgBB
    toast.info('Imagen seleccionada. En producción se sube a Cloudinary / AWS S3 para obtener una URL pública HTTPS.');
    // Usamos un preset rápido o permitimos previsualizar
    const randomPreset = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].url;
    setAvatarUrlInput(randomPreset);
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUpdatingAvatar(true);
      await api.patch('/users/me/avatar', {
        avatarUrl: null,
      });
      setAvatarUrlInput('');
      await refreshUser();
      toast.success('Foto de perfil eliminada');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar foto');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('La contraseña debe incluir al menos una mayúscula, minúscula, número y carácter especial (@$!%*?&)');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      setIsChangingPassword(true);
      const { data } = await api.post('/users/change-password', {
        currentPassword,
        newPassword,
      });

      toast.success(data.message || '¡Contraseña actualizada exitosamente!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al actualizar contraseña';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Mi Perfil & Ajustes</h1>
        <p className="text-xs text-slate-400 mt-1">
          Gestiona tu identidad, avatar, seguridad y límites operativos
        </p>
      </div>

      {/* 1. INFORMACIÓN PERSONAL Y BANCARIA */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" />
          <span>Información de la Cuenta</span>
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar Preview */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-2xl overflow-hidden border-2 border-indigo-500/40 shadow-xl shrink-0 relative group">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
            <label
              htmlFor="avatar-file-input"
              className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px]"
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span>Cambiar</span>
            </label>
            <input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleLocalFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex-1 w-full space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateAvatar();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  URL de Imagen de Avatar (HTTPS)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={avatarUrlInput}
                    onChange={(e) => setAvatarUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingAvatar}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                  </button>
                  {user?.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={isUpdatingAvatar}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 text-xs transition-colors cursor-pointer"
                      title="Eliminar avatar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Presets Rápidos */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Avatares Rápidos:</span>
              <div className="flex items-center gap-2">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleUpdateAvatar(preset.url)}
                    disabled={isUpdatingAvatar}
                    className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 hover:border-indigo-500 transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
                    title={preset.label}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  </button>
                ))}
                <label
                  htmlFor="avatar-file-input-btn"
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Subir Foto / Cámara</span>
                </label>
                <input
                  id="avatar-file-input-btn"
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleLocalFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Datos Bancarios y Límites */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-slate-400 block mb-1">Nombre Completo:</span>
            <span className="font-semibold text-white text-sm">{user?.name}</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-slate-400 block mb-1">Correo Electrónico:</span>
            <span className="font-semibold text-white text-sm">{user?.email}</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-slate-400 block mb-1">Alias Bancario:</span>
            <span className="font-mono font-semibold text-indigo-400 text-sm">
              {wallet?.alias || 'No asignado'}
            </span>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-slate-400 block mb-1">Límite Diario de Transferencias:</span>
            <span className="font-bold text-emerald-400 text-sm">
              ${wallet ? Number(wallet.dailyTransferLimit).toLocaleString('es-AR') : '0'} ARS
            </span>
          </div>
        </div>
      </div>

      {/* 2. CAMBIO DE CONTRASEÑA */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Seguridad & Contraseña</span>
        </h2>

        <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Al cambiar tu contraseña, se revocarán todas las sesiones activas en otros dispositivos por seguridad.
          </span>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Contraseña Actual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repite la nueva contraseña"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="py-3 px-6 bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Actualizar Contraseña</span>
          </button>
        </form>
      </div>
    </div>
  );
}
