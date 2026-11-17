import { ArrowRight, BadgeCheck, Check, ChevronDown, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { formatBRL, formatDateTime } from "@/shared/lib/format";
import { buttonClass, inputClass } from "@/shared/ui/styles";
import { Button, Dialog, Field } from "@/shared/ui/ui";
import { useStageChange } from "../hooks/useStageChange";
import { isOutcome, leadName, openStages, stageLabel, type Lead, type Stage, type StageChange } from "../model/lead.types";
import type { Proposal } from "../model/proposal";

/**
 * Registro do desfecho (RN-03.13). Venda fechada pede o valor (sugerido pela última proposta) e a proposta de
 * base; sem venda pede o motivo, opcional. Usado na ficha e ao soltar o cartão nessas colunas do quadro.
 */
export function OutcomeDialog({ lead, stage, proposals, onConfirm, onClose, pending }: { lead: Lead; stage: "fechado" | "encerrado"; proposals: Proposal[]; onConfirm: (c: StageChange) => void; onClose: () => void; pending?: boolean }) {
  const withValue = proposals.filter((p) => p.condicao);
  const [proposalId, setProposalId] = useState(withValue[0]?.id ?? "");
  const [value, setValue] = useState(withValue[0]?.condicao?.preco ?? 0);
  const [note, setNote] = useState("");
  const sold = stage === "fechado";
  const pick = (id: string) => {
    setProposalId(id);
    const p = withValue.find((x) => x.id === id);
    if (p?.condicao) setValue(p.condicao.preco);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (sold && value <= 0) return;
    onConfirm(sold ? { stage, sale_value: value, proposal_id: proposalId || undefined, note: note.trim() } : { stage, note: note.trim() });
  };
  const number = (p: Proposal) => proposals.length - proposals.indexOf(p);

  return (
    <Dialog title={sold ? `Venda fechada · ${leadName(lead)}` : `Encerrar sem venda · ${leadName(lead)}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {sold ? (
          <>
            <p className="text-sm text-ink-muted">A negociação foi fechada pelo WhatsApp? Registre aqui o valor e a condição para o painel contar a venda.</p>
            {withValue.length > 0 && (
              <Field id="vd-base" label="Condição fechada">
                <select id="vd-base" value={proposalId} onChange={(e) => pick(e.target.value)} className={inputClass}>
                  {withValue.map((p) => (
                    <option key={p.id} value={p.id}>
                      Proposta {number(p)} · {p.author === "corretor" ? "ajuste do corretor" : "do cliente"} · {formatBRL(p.condicao!.preco)}
                    </option>
                  ))}
                  <option value="">Outra condição (não está nas propostas)</option>
                </select>
              </Field>
            )}
            <Field id="vd-valor" label="Valor da venda">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 mt-0.5 -translate-y-1/2 text-sm text-ink-muted">R$</span>
                <input id="vd-valor" type="number" min={1} step="any" required value={value || ""} onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))} className={cn(inputClass, "pl-10")} />
              </div>
            </Field>
            <Field id="vd-obs" label="Observação (opcional)">
              <textarea id="vd-obs" rows={2} maxLength={400} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="ex.: contrato assinado em 20/11" />
            </Field>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-muted">O cliente não vai seguir agora. O registro fica na ficha, e você pode reabrir a negociação quando quiser.</p>
            <Field id="sv-motivo" label="Motivo (opcional)">
              <textarea id="sv-motivo" rows={3} maxLength={400} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="ex.: preferiu outra região" />
            </Field>
          </>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending || (sold && value <= 0)} className={sold ? "bg-ok hover:bg-ok/90" : undefined}>
            {sold ? "Registrar venda" : "Encerrar sem venda"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Menu pequeno de "mudar para outra etapa em aberto" (voltar uma etapa, por exemplo). */
function OtherStages({ current, onPick, disabled }: { current: Stage; onPick: (s: Stage) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const out = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button type="button" disabled={disabled} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={buttonClass("ghost", "px-3")}>
        Outra etapa <ChevronDown size={14} />
      </button>
      {open && (
        <div role="menu" aria-label="Mudar para outra etapa" className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl bg-cream-card p-1.5 shadow-lift ring-1 ring-line">
          {openStages
            .filter((s) => s !== current)
            .map((s) => (
              <button
                key={s}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onPick(s);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-cream"
              >
                {stageLabel[s]}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

/**
 * Etapa da negociação na ficha (RN-03.6, RN-03.13). Em vez de clicar nos nomes das etapas, o corretor tem a
 * próxima ação em destaque ("Avançar para Proposta") e os dois desfechos ao lado; voltar fica num menu.
 * Fechada ou encerrada, a ficha mostra o registro e o "Reabrir negociação". O admin só vê.
 */
export function StageControl({ lead, proposals, readOnly = false }: { lead: Lead; proposals: Proposal[]; readOnly?: boolean }) {
  const change = useStageChange();
  const [outcome, setOutcome] = useState<"fechado" | "encerrado" | null>(null);
  const idx = openStages.indexOf(lead.stage);
  const next = idx >= 0 && idx < openStages.length - 1 ? openStages[idx + 1] : null;
  const closed = isOutcome(lead.stage);
  const go = (c: StageChange) => change.mutate({ lead, change: c }, { onSuccess: () => setOutcome(null) });
  const saleBase = proposals.find((p) => p.id === lead.sale_proposal_id);

  return (
    <section aria-label="Etapa da negociação" className="rounded-2xl bg-cream p-4 sm:p-5">
      {/* Trilho das etapas em aberto: mostra onde o cliente está; não é clicável */}
      <ol className="flex items-center gap-2" aria-label="Andamento">
        {openStages.map((s, i) => {
          const done = closed || i < idx;
          const on = s === lead.stage;
          return (
            <li key={s} className="flex min-w-0 flex-1 items-center gap-2" aria-current={on ? "step" : undefined}>
              <span className={cn("inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", on ? "bg-forest text-white ring-4 ring-forest/15" : done ? "bg-forest/80 text-white" : "bg-white text-ink-muted ring-1 ring-line")}>
                {done && !on ? <Check size={12} /> : i + 1}
              </span>
              <span className={cn("truncate text-xs", on ? "font-bold text-ink" : "text-ink-muted")}>{stageLabel[s]}</span>
              {i < openStages.length - 1 && <span aria-hidden="true" className={cn("hidden h-0.5 min-w-4 flex-1 rounded-full sm:block", done ? "bg-forest/60" : "bg-line")} />}
            </li>
          );
        })}
      </ol>

      {closed ? (
        <div className={cn("mt-4 flex flex-wrap items-center gap-4 rounded-xl p-4", lead.stage === "fechado" ? "bg-ok/10" : "bg-white")}>
          <span className={cn("inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full", lead.stage === "fechado" ? "bg-ok text-white" : "bg-line text-ink-muted")}>
            {lead.stage === "fechado" ? <BadgeCheck size={20} /> : <XCircle size={20} />}
          </span>
          <div className="min-w-0 flex-1">
            <b className="block text-base text-ink">
              {lead.stage === "fechado" ? `Venda fechada${lead.sale_value ? ` · ${formatBRL(lead.sale_value)}` : ""}` : "Encerrado sem venda"}
            </b>
            <small className="block text-xs text-ink-muted">
              {lead.outcome_at && `Registrado em ${formatDateTime(lead.outcome_at)}`}
              {saleBase && ` · condição da proposta ${proposals.length - proposals.indexOf(saleBase)}`}
            </small>
            {lead.outcome_note && <p className="mt-1 text-sm text-ink">{lead.outcome_note}</p>}
          </div>
          {!readOnly && (
            <Button variant="outline" disabled={change.isPending} onClick={() => go({ stage: proposals.length ? "proposta" : "em_atendimento" })}>
              <RotateCcw size={15} /> Reabrir negociação
            </Button>
          )}
        </div>
      ) : (
        !readOnly && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {next && (
              <Button disabled={change.isPending} onClick={() => go({ stage: next })}>
                Avançar para {stageLabel[next]} <ArrowRight size={15} />
              </Button>
            )}
            <Button disabled={change.isPending} onClick={() => setOutcome("fechado")} className="bg-ok hover:bg-ok/90">
              <BadgeCheck size={15} /> Venda fechada
            </Button>
            <Button variant="outline" disabled={change.isPending} onClick={() => setOutcome("encerrado")}>
              <XCircle size={15} /> Sem venda
            </Button>
            <span className="ml-auto">
              <OtherStages current={lead.stage} disabled={change.isPending} onPick={(s) => go({ stage: s })} />
            </span>
          </div>
        )
      )}

      {outcome && <OutcomeDialog lead={lead} stage={outcome} proposals={proposals} pending={change.isPending} onConfirm={go} onClose={() => setOutcome(null)} />}
    </section>
  );
}
