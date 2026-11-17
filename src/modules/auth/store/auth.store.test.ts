import { canOpen, homeFor, roleLabel, useAuthStore } from "./auth.store";
import type { User } from "../model/auth.types";

const broker: User = { id: "u1", name: "Fabiano", email: "f@x.com", role: "corretor", permissions: ["area.corretor"] };

describe("auth store", () => {
  it("guarda e limpa a sessão, respeitando a expiração", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    useAuthStore.getState().setSession({ token: "t", expires_at: future, user: broker });
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);

    useAuthStore.getState().setSession({ token: "t", expires_at: new Date(Date.now() - 1).toISOString(), user: broker });
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);

    useAuthStore.getState().clear();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("leva cada papel para a sua área", () => {
    expect(homeFor({ ...broker, role: "admin", permissions: ["admin"] })).toBe("/admin");
    expect(homeFor(broker)).toBe("/painel");
    expect(homeFor(null)).toBe("/");
  });
});

describe("canOpen e roleLabel", () => {
  const admin: User = { ...broker, role: "admin", permissions: ["admin"] };
  it("só deixa voltar para a área do próprio papel", () => {
    expect(canOpen(admin, "/admin/clientes")).toBe(true);
    expect(canOpen(admin, "/painel")).toBe(false);
    expect(canOpen(broker, "/painel/clientes/l1")).toBe(true);
    expect(canOpen(broker, "/admin")).toBe(false);
    expect(canOpen(broker, "/e/boa-vista/FAB-0001")).toBe(true);
    expect(canOpen(null, "/admin")).toBe(false);
  });

  it("nomeia o papel", () => {
    expect(roleLabel(admin)).toBe("administrador");
    expect(roleLabel(broker)).toBe("corretor");
    expect(roleLabel(null)).toBe("sem perfil");
  });
});
