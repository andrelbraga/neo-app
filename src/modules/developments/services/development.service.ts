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
export function brokerLink(slug: string, code: string, origin = window.location.origin): string {
  return `${origin}/e/${slug}/${code}`;
}
