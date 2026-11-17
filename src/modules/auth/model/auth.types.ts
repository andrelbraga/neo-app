/** Papéis da API (neo360-api `internal/pkg/authz`). */
export type Role = "admin" | "corretor";

/** Permissões da API (RN-01.4): o menu e as guardas de rota usam a mesma lista. */
export type Permission = "admin" | "area.corretor";

export interface Broker {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  creci: string;
  code: string;
  agency_id: string | null;
  agency_name: string;
  agency_logo_url: string;
  active: boolean;
  leads_count: number;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
  broker?: Broker;
}

export interface Session {
  token: string;
  expires_at: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Profile {
  first_name: string;
  last_name: string;
  phone: string;
  creci: string;
}

export interface SignupRequest extends Profile {
  email: string;
  password: string;
}
