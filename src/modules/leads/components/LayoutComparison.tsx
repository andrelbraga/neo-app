import { FlaskConical, Trophy } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { formatBRL } from "@/shared/lib/format";
import { layoutRates } from "../model/layout";
import type { LayoutStats, Summary } from "../model/lead.types";

/**
 * Comparação dos layouts A e B da apresentação (ADR-0019): clientes, propostas e vendas de cada um, com a
 * conversão em proposta e em venda. Cada cliente conta no layout da primeira visita.
 */
export function LayoutComparison({ summary }: { summary?: Summary }) {
  const a = summary?.by_layout?.a ?? { leads: 0, with_proposal: 0, sales: 0, sales_value: 0 };
  const b = summary?.by_layout?.b ?? { leads: 0, with_proposal: 0, sales: 0, sales_value: 0 };
  const ra = layoutRates(a);
  const rb = layoutRates(b);
  const both = a.leads > 0 && b.leads > 0;
  const leader = !both || ra.proposal === rb.proposal ? null : ra.proposal > rb.proposal ? "a" : "b";
  const small = Math.min(a.leads, b.leads) < 30;
  const col = (key: "a" | "b", s: LayoutStats, r: { proposal: number; sale: number }) => (
    <div className={cn("rounded-xl p-4", leader === key ? "bg-forest-soft ring-2 ring-forest/30" : "bg-cream")}>
      <div className="flex items-center justify-between gap-2">
        <b className="text-sm text-ink">Layout {key.toUpperCase()}</b>
        {leader === key && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.06em] text-forest">
            <Trophy size={12} /> converte mais
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-muted">{key === "a" ? "apresentação clássica" : "página nova (v11)"}</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">Clientes</dt>
          <dd className="font-bold text-ink">{s.leads}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">Enviaram proposta</dt>
          <dd className="font-bold text-ink">
            {s.with_proposal} <span className="text-xs font-semibold text-ink-muted">· {r.proposal}%</span>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">Vendas</dt>
          <dd className="font-bold text-ink">
            {s.sales} <span className="text-xs font-semibold text-ink-muted">· {r.sale}%</span>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">Valor vendido</dt>
          <dd className="font-bold text-ink">{formatBRL(s.sales_value)}</dd>
        </div>
      </dl>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white" aria-hidden="true">
        <div className="h-full rounded-full bg-forest transition-all duration-700" style={{ width: `${r.proposal}%` }} />
      </div>
    </div>
  );
  return (
    <section className="card p-5" aria-label="Layout A × B">
      <h2 className="mb-1 flex items-center gap-2 text-xl text-ink">
        <FlaskConical size={18} className="text-forest" /> Layout A × B
      </h2>
      <p className="mb-4 text-xs text-ink-muted">Conversão da apresentação por layout. Cada cliente conta no layout da primeira visita.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {col("a", a, ra)}
        {col("b", b, rb)}
      </div>
      {small && <p className="mt-3 text-xs text-ink-muted">Com menos de 30 clientes em cada layout, a diferença ainda pode ser acaso.</p>}
    </section>
  );
}
