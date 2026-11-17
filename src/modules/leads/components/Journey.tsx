import { CalendarClock, ChevronDown, Clock3, Eye, MousePointerClick, Sparkles, Star, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { formatDateTime } from "@/shared/lib/format";
import { eventLabel, readingTime, signalLabel, type LeadEvent } from "../model/lead.types";
import { formatDuration, isKeyEvent, metricsOf, sessionsOf, topActions } from "../model/journey";
import { iconFor } from "./eventIcon";

/** Filtro da jornada: pelo rótulo exato quando há (tipos diferentes podem ter o mesmo rótulo), senão pelo tipo. */
export interface JourneyFilter {
  kind: string;
  label?: string;
}

const matches = (e: LeadEvent, f?: JourneyFilter) => !f || (f.label ? eventLabel(e) === f.label : e.kind === f.kind);
const time = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-cream-card p-4 shadow-soft ring-1 ring-line/70">
      <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
        {icon}
        {label}
      </span>
      <b className="mt-1.5 block text-2xl text-ink">{value}</b>
    </div>
  );
}

/**
 * Análise do cliente (aba Atividades), no formato do explorador de usuário do Google Analytics: números do
 * topo, jornada por visita (com hora, duração e eventos-chave marcados), onde passou mais tempo e as
 * principais ações. Um clique numa ação filtra a jornada.
 */
export function Journey({ events, filter, onFilter }: { events: LeadEvent[]; filter?: JourneyFilter; onFilter: (f?: JourneyFilter) => void }) {
  const m = metricsOf(events);
  const sessions = sessionsOf(events)
    .map((s) => ({ ...s, shown: s.events.filter((e) => matches(e, filter)) }))
    .filter((s) => s.shown.length > 0)
    .reverse();
  const reading = readingTime(events);
  const maxRead = Math.max(1, ...reading.map((r) => r.seconds));
  const actions = topActions(events);
  const [open, setOpen] = useState<Set<number>>(() => new Set(sessions.slice(0, 1).map((s) => s.index)));
  const toggle = (i: number) => setOpen((o) => new Set(o.has(i) ? [...o].filter((x) => x !== i) : [...o, i]));
  const filterLabel = filter && (filter.label ?? (signalLabel as Record<string, string>)[filter.kind] ?? filter.kind);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={<CalendarClock size={13} />} label="Visitas" value={m.visits} />
        <Metric icon={<Clock3 size={13} />} label="Tempo lendo" value={m.readingSeconds ? formatDuration(m.readingSeconds) : "—"} />
        <Metric icon={<Eye size={13} />} label="Seções vistas" value={m.sectionsSeen} />
        <Metric icon={<Star size={13} />} label="Eventos-chave" value={m.keyEvents} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Jornada por visita */}
        <section aria-label="Jornada do cliente" className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base text-ink">Jornada</h2>
            {m.firstSeen && (
              <small className="text-xs text-ink-muted">
                Primeira visita {formatDateTime(m.firstSeen)} · última {formatDateTime(m.lastSeen!)}
              </small>
            )}
          </div>
          {filter && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              Mostrando só:
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-soft py-1 pl-3 pr-1 font-semibold text-forest">
                {filterLabel}
                <button type="button" onClick={() => onFilter(undefined)} aria-label="Mostrar toda a atividade" className="inline-flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white">
                  <X size={13} />
                </button>
              </span>
            </p>
          )}
          {sessions.length === 0 && <p className="rounded-2xl bg-cream px-5 py-8 text-center text-sm text-ink-muted">Nada registrado ainda.</p>}
          {sessions.map((s) => {
            const expanded = open.has(s.index) || Boolean(filter);
            return (
              <article key={s.index} className="overflow-hidden rounded-2xl bg-cream-card shadow-soft ring-1 ring-line/70">
                <button type="button" onClick={() => toggle(s.index)} aria-expanded={expanded} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-cream/60 sm:px-5">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-soft text-xs font-bold text-forest">{s.index}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-sm text-ink">
                      Visita {s.index} · {formatDateTime(s.start)}
                    </b>
                    <small className="block truncate text-xs text-ink-muted">
                      {s.minutes > 0 ? `${s.minutes} min` : "menos de 1 min"} · {s.events.length} {s.events.length === 1 ? "evento" : "eventos"}
                      {s.via && ` · pelo link ${s.via}`}
                    </small>
                  </span>
                  {s.keyEvents > 0 && (
                    <span className="hidden shrink-0 items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-bold text-gold sm:inline-flex">
                      <Star size={11} className="fill-current" /> {s.keyEvents}
                    </span>
                  )}
                  <ChevronDown size={16} className={cn("shrink-0 text-ink-muted transition", expanded && "rotate-180")} />
                </button>
                {expanded && (
                  <ol className="relative border-t border-line px-4 py-3 sm:px-5">
                    {s.shown.map((e) => {
                      const { icon: Icon, tone } = iconFor(e.kind);
                      const key = isKeyEvent(e);
                      return (
                        <li key={e.id} className="relative grid grid-cols-[44px_28px_minmax(0,1fr)] items-start gap-2 py-1.5">
                          <time className="pt-1 text-[11px] font-semibold tabular-nums text-ink-muted">{time(e.created_at)}</time>
                          <span className={cn("relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full", key ? tone : "bg-cream text-ink-muted")}>
                            <Icon size={13} />
                          </span>
                          <span className={cn("pt-1 text-sm", key ? "font-semibold text-ink" : "text-ink-muted")}>
                            {eventLabel(e)}
                            {key && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gold-soft px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-[0.06em] text-gold">
                                <Star size={9} className="fill-current" /> chave
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </article>
            );
          })}
        </section>

        <aside className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-1">
          <section aria-label="Onde passou mais tempo" className="rounded-2xl bg-cream-card p-5 shadow-soft ring-1 ring-line/70">
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
              <Clock3 size={13} /> Onde passou mais tempo
            </h2>
            {reading.length === 0 ? (
              <p className="text-sm text-ink-muted">Sem tempo de leitura registrado (depende do aceite de medição na página).</p>
            ) : (
              <ul className="space-y-3">
                {reading.slice(0, 7).map((r) => (
                  <li key={r.id}>
                    <div className="mb-1 flex justify-between gap-2 text-xs">
                      <span className="truncate first-letter:uppercase">{r.label}</span>
                      <span className="shrink-0 font-semibold text-ink-muted">{formatDuration(r.seconds)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-cream">
                      <div className="h-full rounded-full bg-forest transition-all duration-700" style={{ width: `${(r.seconds / maxRead) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Principais ações" className="rounded-2xl bg-cream-card p-5 shadow-soft ring-1 ring-line/70">
            <h2 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
              <MousePointerClick size={13} /> Principais ações
            </h2>
            {actions.length === 0 ? (
              <p className="text-sm text-ink-muted">Só abriu o link até agora.</p>
            ) : (
              <ul className="space-y-1">
                {actions.slice(0, 10).map((a) => {
                  const { icon: Icon, tone } = iconFor(a.kind);
                  const on = filter?.label === a.label;
                  return (
                    <li key={a.label}>
                      <button
                        type="button"
                        onClick={() => onFilter(on ? undefined : { kind: a.kind, label: a.label })}
                        aria-pressed={on}
                        aria-label={`${a.label}, ${a.n} ${a.n === 1 ? "vez" : "vezes"}: filtrar a jornada`}
                        className={cn("flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm transition hover:bg-cream", on && "bg-forest-soft")}
                      >
                        <span className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full", tone)}>
                          <Icon size={13} />
                        </span>
                        <span className={cn("min-w-0 flex-1 truncate", a.key ? "font-semibold text-ink" : "text-ink")}>{a.label}</span>
                        {a.key && <Sparkles size={12} className="shrink-0 text-gold" aria-label="evento-chave" />}
                        <b className="shrink-0 rounded-full bg-cream px-2 text-xs">{a.n}×</b>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
