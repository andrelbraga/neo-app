import axios, { AxiosError, type AxiosInstance } from "axios";
import { useAuthStore } from "@/modules/auth/store/auth.store";

export interface ApiResponse<T> {
  status: number;
  data: T;
}

export interface ApiErrorBody {
  error: string;
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().clear();
    }
    return Promise.reject(error);
  },
);

/** Devolve só o payload (`data`) do envelope `{ status, data }` da API. */
export const api = {
  get: async <T>(url: string, headers?: Record<string, string>) =>
    (await axiosInstance.get<ApiResponse<T>>(url, { headers })).data.data,
  post: async <T>(url: string, body?: unknown, headers?: Record<string, string>) =>
    (await axiosInstance.post<ApiResponse<T>>(url, body, { headers })).data.data,
  put: async <T>(url: string, body?: unknown, headers?: Record<string, string>) =>
    (await axiosInstance.put<ApiResponse<T>>(url, body, { headers })).data.data,
  patch: async <T>(url: string, body?: unknown) => (await axiosInstance.patch<ApiResponse<T>>(url, body)).data.data,
  delete: async <T>(url: string) => (await axiosInstance.delete<ApiResponse<T>>(url)).data.data,
};

export function apiErrorMessage(error: unknown, fallback = "Não foi possível concluir a operação."): string {
  if (axios.isAxiosError<ApiResponse<ApiErrorBody>>(error)) {
    if (!error.response) return "Sem conexão com o servidor.";
    return error.response.data?.data?.error ?? fallback;
  }
  return fallback;
}
