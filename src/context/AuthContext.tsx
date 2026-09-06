'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { User, Wallet, AuthResponse } from '@/types/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  wallet: Wallet | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  updateWallet: (updatedWallet: Partial<Wallet>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Cargar sesión inicial desde localStorage y verificar con /users/me
  useEffect(() => {
    async function loadSession() {
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');
      const savedWallet = localStorage.getItem('wallet');

      if (token) {
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            // Ignorar error de parsing
          }
        }
        if (savedWallet) {
          try {
            setWallet(JSON.parse(savedWallet));
          } catch {
            // Ignorar error de parsing
          }
        }

        // Refrescar datos frescos desde el backend
        try {
          const { data: userData } = await api.get<User>('/users/me');
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));

          if (userData.wallet) {
            setWallet(userData.wallet);
            localStorage.setItem('wallet', JSON.stringify(userData.wallet));
          } else {
            const { data: walletData } = await api.get<Wallet>('/wallet');
            setWallet(walletData);
            localStorage.setItem('wallet', JSON.stringify(walletData));
          }
        } catch (error) {
          console.error('Error al sincronizar sesión inicial:', error);
          // Si el token es inválido y el interceptor ya redirigió, no hacemos nada
        }
      }

      setIsLoading(false);
    }

    loadSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data } = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      const accessToken = data.accessToken || data.tokens?.accessToken;
      const refreshToken = data.refreshToken || data.tokens?.refreshToken;
      const resolvedWallet = data.wallet || data.user?.wallet;

      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      if (resolvedWallet) localStorage.setItem('wallet', JSON.stringify(resolvedWallet));

      setUser(data.user);
      if (resolvedWallet) setWallet(resolvedWallet);

      toast.success(`¡Bienvenido de vuelta, ${data.user.name}!`);
      router.push('/dashboard');
      return true;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data } = await api.post<AuthResponse>('/auth/register', {
        name,
        email,
        password,
      });

      const accessToken = data.accessToken || data.tokens?.accessToken;
      const refreshToken = data.refreshToken || data.tokens?.refreshToken;
      const resolvedWallet = data.wallet || data.user?.wallet;

      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      if (resolvedWallet) localStorage.setItem('wallet', JSON.stringify(resolvedWallet));

      setUser(data.user);
      if (resolvedWallet) setWallet(resolvedWallet);

      toast.success(`¡Cuenta creada con éxito! Bienvenido a MiniPay.`);
      router.push('/dashboard');
      return true;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al crear la cuenta. Intenta nuevamente.';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('wallet');
      setUser(null);
      setWallet(null);
      toast.info('Sesión cerrada correctamente');
      router.push('/login');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const { data } = await api.get<User>('/users/me');
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      if (data.wallet) {
        setWallet(data.wallet);
        localStorage.setItem('wallet', JSON.stringify(data.wallet));
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
    }
  };

  const refreshWallet = async (): Promise<void> => {
    try {
      const { data } = await api.get<Wallet>('/wallet');
      setWallet(data);
      localStorage.setItem('wallet', JSON.stringify(data));
    } catch (error) {
      console.error('Error al actualizar billetera:', error);
    }
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const updateWallet = (updatedWallet: Partial<Wallet>) => {
    setWallet((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedWallet };
      localStorage.setItem('wallet', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        isLoading,
        isAuthenticated: !!user && (typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : true),
        login,
        register,
        logout,
        refreshUser,
        refreshWallet,
        updateUser,
        updateWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
