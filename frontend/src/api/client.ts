import axios from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import i18n from '../i18n';
import { useAuthStore } from '../features/auth/store';
import type { ValidationError } from './types';

export const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
export const cookieAuth = import.meta.env.VITE_AUTH_MODE !== 'token';
const origin = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const api = axios.create({
  baseURL: `${origin}/api/v1`, withCredentials: cookieAuth, withXSRFToken: cookieAuth,
  headers: { Accept: 'application/json' }, timeout: 15000,
});
if (useMock) api.defaults.adapter = async config => (await import('./mock/adapter')).mockAdapter(config);
api.interceptors.request.use(config => {
  config.headers.set('Accept-Language', i18n.language === 'en' ? 'en' : 'fa-AF');
  const token = useAuthStore.getState().token;
  if (!cookieAuth && token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});
api.interceptors.response.use(response => response, (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) {
      const wasSignedIn = !!useAuthStore.getState().user;
      useAuthStore.getState().clearSession();
      if (wasSignedIn) toast.error(i18n.t('sessionExpired'));
    } else if (status === 403) {
      toast.error(apiErrorMessage(error, 'common:forbiddenTitle'));
    } else if (status !== 422 && status !== 404 && !axios.isCancel(error)) {
      toast.error(i18n.t(status ? 'requestFailed' : 'networkError'));
    }
  }
  return Promise.reject(error);
});

export async function csrfCookie(): Promise<void> {
  if (cookieAuth) await api.get('/sanctum/csrf-cookie', { baseURL: origin });
}

export function apiErrorMessage(error: unknown, fallback = 'common:requestFailed'): string {
  if (!axios.isAxiosError<ValidationError>(error)) return i18n.t(fallback);
  const message = error.response?.data?.message;
  if (message && i18n.exists(message)) return i18n.t(message);
  // Real API text is returned in the requested Accept-Language.
  return message || i18n.t(error.response ? fallback : 'common:networkError');
}

export function applyValidationErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: readonly Path<T>[]): boolean {
  if (!axios.isAxiosError<ValidationError>(error) || error.response?.status !== 422) return false;
  let mapped = false;
  Object.entries(error.response.data.errors ?? {}).forEach(([field, messages]) => {
    if (!fields.includes(field as Path<T>) || !messages.length) return;
    setError(field as Path<T>, { type: 'server', message: i18n.exists(messages[0]) ? i18n.t(messages[0]) : messages[0] }, { shouldFocus: !mapped });
    mapped = true;
  });
  return mapped;
}
