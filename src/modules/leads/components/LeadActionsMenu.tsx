import { useQuery } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
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

/** Altura aproximada do menu aberto, para decidir se abre para baixo ou para cima. */
const MENU_HEIGHT = 380;

/**
 * Posição do menu junto ao botão, em coordenadas da janela. O menu vai para o `body` (portal): dentro da
 * tabela, a célula corta o que passa da borda.
 */
function placeMenu(button: HTMLElement): CSSProperties {
  const r = button.getBoundingClientRect();
  const right = Math.max(8, window.innerWidth - r.right);
  const below = window.innerHeight - r.bottom;
  return below >= MENU_HEIGHT || below >= r.top
    ? { position: "fixed", top: r.bottom + 4, right }
    : { position: "fixed", bottom: window.innerHeight - r.top + 4, right };
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
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});
  const change = useStageChange();
  const archive = useArchive();
  useEffect(() => {
    if (!open) return;
    // O menu está fora da linha (portal): clicar nele não conta como clique fora.
    const out = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!box.current?.contains(t) && !menu.current?.contains(t)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    // Posição fixa na janela: rolar ou redimensionar fecha o menu, em vez de deixá-lo solto.
    const close = () => setOpen(false);
    document.addEventListener("mousedown", out);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", out);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
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
        ref={button}
        onClick={() => {
          if (!open && button.current) setStyle(placeMenu(button.current));
          setOpen((v) => !v);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-cream hover:text-forest"
      >
        <MoreVertical size={16} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label={`Ações de ${leadName(lead)}`}
            style={style}
            className="z-50 max-h-[80vh] w-56 overflow-y-auto rounded-xl border border-line bg-white p-1.5 text-left shadow-xl"
          >
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
          </div>,
          document.body,
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
