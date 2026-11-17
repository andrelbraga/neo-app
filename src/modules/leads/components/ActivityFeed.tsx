import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { timeAgo } from "@/shared/lib/format";
import { LiveDot, Skeleton } from "@/shared/ui/visuals";
import { eventLabel, stageLabel, stages, type Activity, type Summary } from "../model/lead.types";
import { iconFor } from "./eventIcon";

/** Feed "ao vivo" do que os clientes fizeram por último. */
export function ActivityFeed({ items, basePath, showBroker = false, loading = false }: { items?: Activity[]; basePath: string; showBroker?: boolean; loading?: boolean }) {
  return (
    <section className="card p-5">
      <header className="mb-4 flex items-center gap-2">
        <LiveDot />
        <h2 className="text-xl text-ink">Ao vivo</h2>
        <small className="text-xs text-ink-muted">atualiza sozinho</small>
      </header>
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      )}
      {items && items.length === 0 && <p className="py-6 text-center text-sm text-ink-muted">Quando um cliente abrir um link, a movimentação aparece aqui.</p>}
      <ul className="-mr-2 max-h-[30rem] space-y-1 overflow-y-auto pr-2">
        {items?.slice(0, 12).map((a, i) => {
          const { icon: Icon, tone } = iconFor(a.kind);
          return (
            <li key={`${a.lead_id}-${a.created_at}-${i}`} className="animate-rise" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
              <Link to={`${basePath}/${a.lead_id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-teal-soft/20">
                <span className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full", tone)}>
                  <Icon size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">
                    <b className="font-semibold text-ink">{a.lead_name || "Visitante"}</b> <span className="text-ink">{eventLabel(a).toLowerCase()}</span>
                  </span>
                  <span className="block truncate text-xs text-ink-muted">
                    {a.development_name}
                    {showBroker && ` · ${a.broker_name}`}
                  </span>
                </span>
                <small className="shrink-0 text-[11px] text-ink-muted">{timeAgo(a.created_at)}</small>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Funil em barras horizontais, proporcionais ao total. */
export function FunnelBars({ summary }: { summary?: Summary }) {
  const total = Math.max(1, ...stages.map((s) => summary?.by_stage[s] ?? 0));
  // Mesmas cores das etiquetas de etapa (StageBadge).
  const colors = ["bg-teal", "bg-gold", "bg-coral", "bg-ok", "bg-ink-muted/50"];
  return (
    <section className="card p-5">
      <h2 className="mb-4 text-xl text-ink">Funil</h2>
      <div className="space-y-3">
        {stages.map((s, i) => {
          const n = summary?.by_stage[s] ?? 0;
          return (
            <div key={s}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-ink">{stageLabel[s]}</span>
                <span className="text-ink-muted">{n}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-line/50">
                <div className={cn("h-full rounded-full transition-all duration-700", colors[i])} style={{ width: `${(n / total) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
