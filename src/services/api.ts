import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Inyectar Access Token en cada petición
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && token !== 'undefined' && token !== 'null' && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 2. Manejo de renovación de token ante error 401 (RFC 7519 auto-refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Evitar loop infinito en rutas de auth
    if (originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
          try {
            const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });
            const newAccess = data.accessToken || data.tokens?.accessToken;
            const newRefresh = data.refreshToken || data.tokens?.refreshToken;

            if (newAccess) localStorage.setItem('accessToken', newAccess);
            if (newRefresh) localStorage.setItem('refreshToken', newRefresh);

            if (newAccess && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            }
            return api(originalRequest);
          } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('wallet');
            window.location.href = '/login';
          }
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('wallet');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// 3. Descarga directa de comprobantes oficiales en PDF
export async function downloadReceiptPdf(transferId: string, filename = `comprobante-${transferId}.pdf`) {
  const response = await api.get(`/transfers/${transferId}/receipt`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
