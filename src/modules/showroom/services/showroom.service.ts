import { api } from "@/app/providers/api/client";
import type { Development } from "@/modules/developments/model/development.types";

export interface PublicBroker {
  name: string;
  phone: string;
  creci: string;
  code: string;
  agency_name: string;
  agency_logo_url: string;
}

export interface Showroom {
  development: Development;
  broker: PublicBroker;
}

export interface Visit {
  token: string;
  name: string;
  phone: string;
}

export type PageEvent = "secao" | "galeria" | "tour_3d" | "whatsapp";

const KEY = "neo360-visit:";

/** Token da visita, por empreendimento: o mesmo cliente volta como o mesmo cliente (RN-03.1). */
export const visitorToken = {
  get: (slug: string): string => {
    try {
      return localStorage.getItem(KEY + slug) ?? "";
    } catch {
      return "";
    }
  },
  set: (slug: string, token: string) => {
    try {
      localStorage.setItem(KEY + slug, token);
    } catch {
      /* navegador sem armazenamento: a visita vale só nesta aba */
    }
  },
};

const header = (token: string) => ({ "X-Visitor-Token": token });

export const showroomService = {
  get: (slug: string, code: string) => api.get<Showroom>(`/public/showroom/${slug}/${code}`),
  /** `invite` é o código do link de convite do cliente cadastrado pelo corretor (RN-03.16). */
  visit: (slug: string, code: string, token: string, invite = "") =>
    api.post<Visit>(`/public/showroom/${slug}/${code}/visit${invite ? `?convite=${encodeURIComponent(invite)}` : ""}`, undefined, header(token)),
  track: (token: string, kind: PageEvent, data: Record<string, unknown> = {}) =>
    api.post<{ ok: boolean }>("/public/lead/events", { kind, data }, header(token)),
  contact: (token: string, name: string, phone: string) => api.put<Visit>("/public/lead/contact", { name, phone }, header(token)),
};
