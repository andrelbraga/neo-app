import { api } from "@/app/providers/api/client";
import type { Activity, ApiProposal, Lead, LeadDetail, LeadFilter, StageChange, Summary } from "../model/lead.types";

function query(f: LeadFilter): string {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => v && p.set(k, v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** CRM do corretor: só os clientes de que ele é dono. */
export const myLeadService = {
  list: (f: LeadFilter = {}) => api.get<Lead[]>(`/me/leads${query(f)}`),
  get: (id: string) => api.get<LeadDetail>(`/me/leads/${id}`),
  setStage: (id: string, change: StageChange) => api.patch<Lead>(`/me/leads/${id}/stage`, change),
  /** Ajuste do corretor sobre uma proposta (RN-03.12): grava uma nova versão, sem apagar a anterior. */
  adjust: (id: string, body: { based_on?: string; condition: Record<string, unknown>; summary: string; note: string }) =>
    api.post<ApiProposal>(`/me/leads/${id}/proposals`, body),
  summary: () => api.get<Summary>("/me/summary"),
  activity: () => api.get<Activity[]>("/me/activity"),
};

/** Visão de todos os clientes no admin. */
export const adminLeadService = {
  list: (f: LeadFilter = {}) => api.get<Lead[]>(`/admin/leads${query(f)}`),
  get: (id: string) => api.get<LeadDetail>(`/admin/leads/${id}`),
  summary: () => api.get<Summary>("/admin/summary"),
  activity: () => api.get<Activity[]>("/admin/activity"),
};
