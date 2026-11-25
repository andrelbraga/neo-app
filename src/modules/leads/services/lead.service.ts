import { api } from "@/app/providers/api/client";
import type { Activity, ApiProposal, ImportReport, Lead, LeadDetail, LeadFilter, NewClient, StageChange, Summary } from "../model/lead.types";

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
  /** Cadastra um cliente à mão (RN-03.16). */
  create: (c: NewClient) => api.post<Lead>("/me/leads", c),
  /** Planilha CSV de clientes: `dryRun` só confere; sem ele, cadastra as linhas válidas. */
  importCsv: (developmentId: string, file: File, dryRun: boolean) => {
    const form = new FormData();
    form.set("development_id", developmentId);
    form.set("dry_run", String(dryRun));
    form.set("file", file);
    return api.post<ImportReport>("/me/leads/import", form, { "Content-Type": "multipart/form-data" });
  },
};

/** Visão de todos os clientes no admin. Com `broker`, só os de um corretor ("ver como", RN-01.10). */
export const adminLeadService = {
  list: (f: LeadFilter = {}) => api.get<Lead[]>(`/admin/leads${query(f)}`),
  get: (id: string) => api.get<LeadDetail>(`/admin/leads/${id}`),
  summary: (broker?: string) => api.get<Summary>(`/admin/summary${query({ broker })}`),
  activity: (broker?: string) => api.get<Activity[]>(`/admin/activity${query({ broker })}`),
};
