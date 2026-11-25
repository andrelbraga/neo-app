import { useQuery } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isOutcome, leadName, stageLabel, stages, type Lead, type Stage, type StageChange } from "../model/lead.types";
import { proposalsOf } from "../model/proposal";
import { useArchive } from "../hooks/useArchive";
import { useStageChange } from "../hooks/useStageChange";
import { myLeadService } from "../services/lead.service";
import { EditLeadDialog } from "./EditLeadDialog";
import { MessageComposer } from "./MessageComposer";
import { OutcomeDialog } from "./StageControl";

/** Desfecho pedido pelo menu: busca as propostas do cliente para sugerir o valor da venda (RN-03.13). */
function MenuOutcome({
  lead,
  stage,
  onConfirm,
  onClose,
}: {
  lead: Lead;
  stage: "fechado" | "encerrado";
  onConfirm: (c: StageChange) => void;
  onClose: () => void;
}) {
  const detail = useQuery({
    queryKey: ["lead", "corretor", lead.id],
    queryFn: () => myLeadService.get(lead.id),
    enabled: stage === "fechado",
  });
  if (stage === "fechado" && detail.isPending) return null;
  return <OutcomeDialog lead={lead} stage={stage} proposals={proposalsOf(detail.data?.proposals ?? [])} onConfirm={onConfirm} onClose={onClose} />;
}

const item = "block w-full rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-cream focus-visible:bg-cream focus-visible:outline-none";

/**
 * Menu ⋮ no fim da linha do cliente: abrir a ficha, editar, mensagem no WhatsApp, mover de etapa (desfecho abre
 * o registro da venda ou do motivo) e arquivar ou restaurar. Só o corretor dono vê (RN-03.6, RN-03.18).
 */
export function LeadActionsMenu({ lead, basePath }: { lead: Lead; basePath: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"editar" | "mensagem" | null>(null);
  const [outcome, setOutcome] = useState<"fechado" | "encerrado" | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const change = useStageChange();
  const archive = useArchive();
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
  const pick = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  const move = (s: Stage) => (isOutcome(s) ? setOutcome(s as "fechado" | "encerrado") : change.mutate({ lead, change: { stage: s } }));

  return (
    // O menu fica dentro da linha clicável: o clique não pode abrir a ficha.
    <div ref={box} className="relative inline-block" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Ações de ${leadName(lead)}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-cream hover:text-forest"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-56 rounded-xl border border-line bg-white p-1.5 text-left shadow-xl">
          <button type="button" role="menuitem" className={item} onClick={pick(() => navigate(`${basePath}/${lead.id}`))}>
            Abrir ficha
          </button>
          <button type="button" role="menuitem" className={item} onClick={pick(() => setDialog("editar"))}>
            Editar
          </button>
          <button type="button" role="menuitem" className={item} onClick={pick(() => setDialog("mensagem"))}>
            Mensagem no WhatsApp
          </button>
          {!lead.archived_at && (
            <>
              <p className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Mover para</p>
              {stages
                .filter((s) => s !== lead.stage)
                .map((s) => (
                  <button key={s} type="button" role="menuitem" className={item} onClick={pick(() => move(s))}>
                    {stageLabel[s]}
                  </button>
                ))}
            </>
          )}
          <div className="my-1 border-t border-line" />
          <button type="button" role="menuitem" className={item} onClick={pick(() => archive.mutate(lead))}>
            {lead.archived_at ? "Restaurar" : "Arquivar"}
          </button>
        </div>
      )}
      {dialog === "editar" && <EditLeadDialog lead={lead} onClose={() => setDialog(null)} />}
      {dialog === "mensagem" && <MessageComposer lead={lead} onClose={() => setDialog(null)} />}
      {outcome && (
        <MenuOutcome
          lead={lead}
          stage={outcome}
          onClose={() => setOutcome(null)}
          onConfirm={(c) => {
            setOutcome(null);
            change.mutate({ lead, change: c });
          }}
        />
      )}
    </div>
  );
}
