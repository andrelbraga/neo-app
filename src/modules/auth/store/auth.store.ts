import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, User } from "../model/auth.types";

interface AuthState {
  token: string | null;
  expiresAt: string | null;
  user: User | null;
  setSession: (session: Session) => void;
  setUser: (user: User) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresAt: null,
      user: null,
      setSession: (s) => set({ token: s.token, expiresAt: s.expires_at, user: s.user }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, expiresAt: null, user: null }),
      isAuthenticated: () => {
        const { token, expiresAt } = get();
        return Boolean(token && expiresAt && new Date(expiresAt).getTime() > Date.now());
      },
    }),
    { name: "neo360-auth" },
  ),
);

/** Nome do papel para mostrar na tela. */
export function roleLabel(user: User | null): string {
  if (user?.permissions.includes("admin")) return "administrador";
  if (user?.permissions.includes("area.corretor")) return "corretor";
  return "sem perfil";
}

/** Se a conta pode abrir o caminho: /admin pede admin e /painel pede a área do corretor (RN-01.4). */
export function canOpen(user: User | null, path: string): boolean {
  if (path.startsWith("/admin")) return Boolean(user?.permissions.includes("admin"));
  if (path.startsWith("/painel")) return Boolean(user?.permissions.includes("area.corretor"));
  return true;
}

/** Para onde a pessoa vai depois de entrar: admin para o painel administrativo, corretor para a área dele. */
export function homeFor(user: User | null): string {
  if (user?.permissions.includes("admin")) return "/admin";
  if (user?.permissions.includes("area.corretor")) return "/painel";
  return "/";
}
