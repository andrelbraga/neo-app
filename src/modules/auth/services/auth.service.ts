import { api } from "@/app/providers/api/client";
import type { LoginRequest, Profile, Session, SignupRequest, User } from "../model/auth.types";

export const authService = {
  login: (req: LoginRequest) => api.post<Session>("/auth/login", req),
  signup: (req: SignupRequest) => api.post<Session>("/auth/signup", req),
  me: () => api.get<User>("/auth/me"),
  updateProfile: (p: Profile) => api.put<User>("/me/profile", p),
};
