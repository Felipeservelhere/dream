import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
};

export const conversationsApi = {
  list: (params?: { status?: string; page?: number }) =>
    api.get('/conversations', { params }),
  get: (id: string) => api.get(`/conversations/${id}`),
  messages: (id: string) => api.get(`/conversations/${id}/messages`),
  takeover: (id: string) => api.post(`/conversations/${id}/takeover`),
  resolve: (id: string) => api.post(`/conversations/${id}/resolve`),
  returnToAi: (id: string) => api.post(`/conversations/${id}/return-to-ai`),
  sendMessage: (id: string, text: string) =>
    api.post(`/conversations/${id}/send`, { text }),
};

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
};

export const flowsApi = {
  list: () => api.get('/flows'),
  get: (id: string) => api.get(`/flows/${id}`),
  create: (data: any) => api.post('/flows', data),
  update: (id: string, data: any) => api.put(`/flows/${id}`, data),
  delete: (id: string) => api.delete(`/flows/${id}`),
};

export const settingsApi = {
  getAiConfig: (tenantId: string) => api.get(`/tenants/${tenantId}/ai-config`),
  updateAiConfig: (tenantId: string, data: any) =>
    api.put(`/tenants/${tenantId}/ai-config`, data),
  getMe: () => api.get('/tenants/me'),
};
