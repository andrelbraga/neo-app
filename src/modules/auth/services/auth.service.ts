import { api } from "@/app/providers/api/client";
import type { Account, LoginRequest, Profile, Session, SignupRequest, User } from "../model/auth.types";

export const authService = {
  login: (req: LoginRequest) => api.post<Session>("/auth/login", req),
  signup: (req: SignupRequest) => api.post<Session>("/auth/signup", req),
  me: () => api.get<User>("/auth/me"),
  updateProfile: (p: Profile) => api.put<User>("/me/profile", p),
  /** Troca a própria senha (a atual ou a provisória, e a nova). */
  changePassword: (current_password: string, new_password: string) => api.put<User>("/auth/password", { current_password, new_password }),
};

/** Usuários da plataforma no admin, com o reset por senha provisória (ADR-0020). */
export const accountAdminService = {
  list: () => api.get<Account[]>("/admin/users"),
  resetPassword: (id: string) => api.post<{ temporary_password: string }>(`/admin/users/${id}/reset-password`),
};
