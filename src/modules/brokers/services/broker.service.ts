import { api } from "@/app/providers/api/client";
import type { Broker, Profile } from "@/modules/auth/model/auth.types";

export interface BrokerCreateRequest extends Profile {
  email: string;
  password: string;
  agency_id: string | null;
}

export interface BrokerUpdateRequest extends Profile {
  agency_id: string | null;
  active: boolean;
}

/** Imobiliária pré-cadastrada (ADR-0010), para ligar ao profissional. */
export interface Agency {
  id: string;
  name: string;
  logo_url: string;
  city: string;
  active: boolean;
}

/** Cadastro de profissionais no admin. */
export const brokerService = {
  list: () => api.get<Broker[]>("/admin/brokers"),
  agencies: () => api.get<Agency[]>("/admin/organizations?kind=imobiliaria"),
  create: (r: BrokerCreateRequest) => api.post<Broker>("/admin/brokers", r),
  update: (id: string, r: BrokerUpdateRequest) => api.put<Broker>(`/admin/brokers/${id}`, r),
};
