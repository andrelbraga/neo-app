import { useQuery } from "@tanstack/react-query";
import { ArrowRightLeft } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { formatBRL, timeAgo } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/visuals";
import { isOutcome, leadName, stageLabel, stages, type Lead, type Stage, type StageChange } from "../model/lead.types";
import { proposalsOf } from "../model/proposal";
import { myLeadService } from "../services/lead.service";
import { NewProposalsBadge, SignalIcons } from "./LeadParts";
import { OutcomeDialog } from "./StageControl";

// Faixa no topo da coluna com a cor da situação (mesmas cores das etiquetas).
const columnTone: Record<Stage, string> = {
  novo: "border-t-teal",
  em_atendimento: "border-t-gold",
  proposta: "border-t-coral",
  fechado: "border-t-ok",
  encerrado: "border-t-ink-muted/40",
};

interface Props {
  leads: Lead[];
  basePath: string;
  /** Sem `onMove`, o quadro é só leitura (admin). */
  onMove?: (lead: Lead, change: StageChange) => void;
  showBroker?: boolean;
}

/** Menu "Mover para", no cartão: a forma de mudar de coluna no celular e pelo teclado. */
function MoveMenu({ lead, onPick }: { lead: Lead; onPick: (s: Stage) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const out = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", out);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", out);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Mover ${leadName(lead)} para outra etapa`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition hover:bg-cream hover:text-forest"
      >
        <ArrowRightLeft size={14} />
      </button>
      {open && (
        <div role="menu" aria-label="Mover para" className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl bg-cream-card p-1.5 shadow-lift ring-1 ring-line">
          <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Mover para</p>
          {stages
            .filter((s) => s !== lead.stage)
            .map((s) => (
              <button
                key={s}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onPick(s);
                }}
                className="block w-full rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-cream"
              >
                {stageLabel[s]}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

/** Diálogo de desfecho a partir do quadro: busca as propostas do cliente para sugerir o valor. */
function BoardOutcome({ lead, stage, onConfirm, onClose }: { lead: Lead; stage: "fechado" | "encerrado"; onConfirm: (c: StageChange) => void; onClose: () => void }) {
  const detail = useQuery({ queryKey: ["lead", "corretor", lead.id], queryFn: () => myLeadService.get(lead.id), enabled: stage === "fechado" });
  if (stage === "fechado" && detail.isPending) return null;
  return <OutcomeDialog lead={lead} stage={stage} proposals={proposalsOf(detail.data?.proposals ?? [])} onConfirm={onConfirm} onClose={onClose} />;
}

/**
 * Funil em colunas (RN-03.6). As colunas são as etapas: o corretor arrasta o cartão (computador) ou usa o
 * "Mover para" do cartão (celular e teclado). Ir para venda fechada ou sem venda abre o registro do desfecho
 * antes de mover (RN-03.13). A mudança aparece na hora e volta se a API recusar.
 */
export function KanbanBoard({ leads, basePath, onMove, showBroker = false }: Props) {
  const [over, setOver] = useState<Stage | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{ lead: Lead; stage: "fechado" | "encerrado" } | null>(null);

  const move = (lead: Lead, stage: Stage) => {
    if (!onMove || lead.stage === stage) return;
    if (isOutcome(stage)) setOutcome({ lead, stage: stage as "fechado" | "encerrado" });
    else onMove(lead, { stage });
  };
  const drop = (stage: Stage) => (e: DragEvent) => {
    e.preventDefault();
    setOver(null);
    const lead = leads.find((l) => l.id === e.dataTransfer.getData("text/lead"));
    if (lead) move(lead, stage);
  };

  return (
    <>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-7 lg:px-7 xl:mx-0 xl:grid xl:grid-cols-5 xl:overflow-visible xl:px-0">
        {stages.map((stage) => {
          const items = leads.filter((l) => l.stage === stage);
          const total = stage === "fechado" ? items.reduce((a, l) => a + (l.sale_value ?? 0), 0) : 0;
          return (
            <section
              key={stage}
              aria-label={`Etapa ${stageLabel[stage]}`}
              onDragOver={(e) => {
                if (!onMove) return;
                e.preventDefault();
                setOver(stage);
              }}
              onDragLeave={() => setOver((s) => (s === stage ? null : s))}
              onDrop={drop(stage)}
              className={cn(
                "flex min-h-[16rem] w-[78vw] max-w-[18rem] shrink-0 snap-start flex-col rounded-2xl border-t-4 bg-line/50 p-3 transition xl:w-auto xl:max-w-none",
                columnTone[stage],
                over === stage && "ring-4 ring-forest/20",
              )}
            >
              <header className="mb-3 flex items-center justify-between gap-2 px-1">
                <h3 className="truncate font-sans text-sm font-semibold text-ink">{stageLabel[stage]}</h3>
                <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-ink-muted">{items.length}</span>
              </header>
              {total > 0 && <p className="-mt-2 mb-2 px-1 text-xs font-semibold text-ok">{formatBRL(total)} vendidos</p>}
              <div className="flex flex-1 flex-col gap-2">
                {items.length === 0 && <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-ink-muted">{onMove ? "Arraste um cliente para cá" : "Nenhum cliente"}</p>}
                {items.map((l) => (
                  <article
                    key={l.id}
                    draggable={Boolean(onMove)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/lead", l.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragging(l.id);
                    }}
                    onDragEnd={() => setDragging(null)}
                    className={cn("card card-hover animate-rise p-3", onMove && "cursor-grab active:cursor-grabbing", dragging === l.id && "rotate-1 opacity-60", l.new_proposals > 0 && "ring-2 ring-rose-300")}
                  >
                    <div className="flex items-start gap-2">
                      <Link to={`${basePath}/${l.id}`} className="flex min-w-0 flex-1 items-start gap-2.5">
                        <Avatar name={leadName(l)} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">{leadName(l)}</span>
                          <span className="block truncate text-xs text-ink-muted">{l.development_name}</span>
                          {showBroker && <span className="block truncate text-xs text-ink-muted">{l.broker_name}</span>}
                        </span>
                      </Link>
                      {onMove && <MoveMenu lead={l} onPick={(s) => move(l, s)} />}
                    </div>
                    {l.new_proposals > 0 && (
                      <div className="mt-2">
                        <NewProposalsBadge count={l.new_proposals} />
                      </div>
                    )}
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      {l.stage === "fechado" && l.sale_value ? <b className="text-xs text-ok">{formatBRL(l.sale_value)}</b> : <SignalIcons signals={l.signals} max={4} />}
                      <small className="shrink-0 text-[11px] text-ink-muted">{timeAgo(l.last_activity_at)}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {outcome && onMove && (
        <BoardOutcome
          lead={outcome.lead}
          stage={outcome.stage}
          onClose={() => setOutcome(null)}
          onConfirm={(c) => {
            onMove(outcome.lead, c);
            setOutcome(null);
          }}
        />
      )}
    </>
  );
}
