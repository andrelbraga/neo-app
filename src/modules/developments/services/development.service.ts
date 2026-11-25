import { api } from "@/app/providers/api/client";
import type { Development, DevelopmentRequest } from "../model/development.types";

export const developmentService = {
  /** Os publicados, que o corretor pode ofertar. */
  published: () => api.get<Development[]>("/me/developments"),
  list: () => api.get<Development[]>("/admin/developments"),
  get: (id: string) => api.get<Development>(`/admin/developments/${id}`),
  create: (r: DevelopmentRequest) => api.post<Development>("/admin/developments", r),
  update: (id: string, r: DevelopmentRequest) => api.put<Development>(`/admin/developments/${id}`, r),
};

/** Link exclusivo do corretor para um empreendimento (RN-02.1). */
/** Link exclusivo do corretor. Com `layout`, o link fixa o layout da apresentação (ADR-0019). */
export function brokerLink(slug: string, code: string, origin = window.location.origin, layout?: "a" | "b"): string {
  return `${origin}/e/${slug}/${code}${layout ? `?layout=${layout}` : ""}`;
}

/** Link de convite de um cliente cadastrado pelo corretor (RN-03.16): o link exclusivo com o código do cliente. */
export function inviteLink(slug: string, code: string, invite: string, origin = window.location.origin): string {
  return `${brokerLink(slug, code, origin)}?convite=${encodeURIComponent(invite)}`;
}
