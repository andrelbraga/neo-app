import { api } from "@/app/providers/api/client";
import type { Account, LoginRequest, Profile, Session, SignupRequest, User } from "../model/auth.types";

export const authService = {
  login: (req: LoginRequest) => api.post<Session>("/auth/login", req),
  signup: (req: SignupRequest) => api.post<Session>("/auth/signup", req),
  me: () => api.get<User>("/auth/me"),
  updateProfile: (p: Profile) => api.put<User>("/me/profile", p),
  /** Foto do corretor no cartão da apresentação (RN-01.11, ADR-0029). */
  setPhoto: (photo: Blob) => {
    const form = new FormData();
    form.set("file", photo, "foto.jpg");
    return api.put<{ photo_path: string }>("/me/photo", form, { "Content-Type": "multipart/form-data" });
  },
  removePhoto: () => api.delete<{ photo_path: string }>("/me/photo"),
  /** Troca a própria senha (a atual ou a provisória, e a nova). */
  changePassword: (current_password: string, new_password: string) => api.put<User>("/auth/password", { current_password, new_password }),
};

/** Usuários da plataforma no admin, com o reset por senha provisória (ADR-0020). */
export const accountAdminService = {
  list: () => api.get<Account[]>("/admin/users"),
  resetPassword: (id: string) => api.post<{ temporary_password: string }>(`/admin/users/${id}/reset-password`),
};
