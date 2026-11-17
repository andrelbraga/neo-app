import type { LayoutStats } from "./lead.types";

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

/** Taxas de um layout (ADR-0019): quanto dos clientes enviou proposta e quanto fechou, em %. */
export function layoutRates(s: LayoutStats) {
  return { proposal: pct(s.with_proposal, s.leads), sale: pct(s.sales, s.leads) };
}
