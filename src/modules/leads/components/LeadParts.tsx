import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { formatPhone, timeAgo } from "@/shared/lib/format";
import { Badge, EmptyState, type Tone } from "@/shared/ui/ui";
import { ResponsiveTable, type Column } from "@/shared/ui/ResponsiveTable";
import { Avatar } from "@/shared/ui/visuals";
import { leadName, signalLabel, signalOrder, stageLabel, type Lead, type Stage } from "../model/lead.types";
import { iconFor } from "./eventIcon";

// Novo em azul, atendimento em amarelo, proposta em coral, venda fechada em verde e sem venda em cinza.
const stageTone: Record<Stage, Tone> = { novo: "blue", em_atendimento: "gold", proposta: "coral", fechado: "ok", encerrado: "gray" };

export function StageBadge({ stage, pill = false }: { stage: Stage; pill?: boolean }) {
  return (
    <Badge tone={stageTone[stage]} pill={pill}>
      {stageLabel[stage]}
    </Badge>
  );
}

/**
 * Ícones do que o cliente já fez, do sinal mais forte ao mais fraco. Com `onSelect`, cada ícone vira botão
 * (na ficha, abre a atividade filtrada por aquele tipo); sem ele, só mostra o nome ao passar o mouse.
 */
export function SignalIcons({ signals, max = 5, onSelect }: { signals: string[]; max?: number; onSelect?: (kind: string) => void }) {
  const shown = signalOrder.filter((s) => signals.includes(s)).slice(0, max);
  if (shown.length === 0) return null;
  return (
    <span className="flex shrink-0 gap-1">
      {shown.map((s) => {
        const { icon: Icon, tone } = iconFor(s);
        if (onSelect) {
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              title={`${signalLabel[s]}: ver na atividade`}
              aria-label={`Ver na atividade: ${signalLabel[s]}`}
              className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:scale-110 hover:ring-2 hover:ring-forest/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest", tone)}
            >
              <Icon size={13} />
            </button>
          );
        }
        return (
          <span key={s} title={signalLabel[s]} aria-label={signalLabel[s]} className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full", tone)}>
            <Icon size={13} />
          </span>
        );
      })}
    </span>
  );
}

/** Propostas do cliente que o corretor ainda não abriu, pulsando. */
export function NewProposalsBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex shrink-0 animate-pop items-center gap-1 whitespace-nowrap rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white" title="Propostas que você ainda não abriu">
      {count === 1 ? "1 proposta nova" : `${count} propostas novas`}
    </span>
  );
}

/** Lista de clientes: tabela no desktop, cartões no celular e no tablet. `showBroker` mostra o dono (visão do admin). */
export function LeadsTable({ leads, basePath, showBroker = false }: { leads: Lead[]; basePath: string; showBroker?: boolean }) {
  const navigate = useNavigate();
  if (leads.length === 0) {
    return <EmptyState title="Nenhum cliente ainda" text="Quando alguém abrir um link, ele aparece aqui com o que viu na página." />;
  }
  const columns: Column<Lead>[] = [
    {
      key: "cliente",
      header: "Cliente",
      width: showBroker ? "26%" : "30%",
      cell: (l) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={leadName(l)} size="sm" />
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-2">
              <Link to={`${basePath}/${l.id}`} onClick={(e) => e.stopPropagation()} className="truncate font-semibold text-ink hover:text-forest hover:underline">
                {leadName(l)}
              </Link>
              <NewProposalsBadge count={l.new_proposals} />
            </span>
            {l.phone && <span className="block truncate text-xs text-ink-muted">{formatPhone(l.phone)}</span>}
          </span>
        </span>
      ),
    },
    { key: "empreendimento", header: "Empreendimento", width: showBroker ? "18%" : "22%", cell: (l) => <span title={l.development_name}>{l.development_name}</span> },
    ...(showBroker
      ? [
          {
            key: "corretor",
            header: "Corretor",
            width: "16%",
            cell: (l: Lead) => (
              <>
                <span className="block truncate" title={l.broker_name}>
                  {l.broker_name}
                </span>
                <span className="block truncate text-xs text-ink-muted">{l.broker_code}</span>
              </>
            ),
          },
        ]
      : []),
    { key: "interesse", header: "Interesse", width: "14%", cell: (l) => <SignalIcons signals={l.signals} max={4} /> },
    { key: "etapa", header: "Etapa", width: showBroker ? "13%" : "16%", cell: (l) => <StageBadge stage={l.stage} /> },
    { key: "atividade", header: "Atividade", width: "13%", align: "right", cell: (l) => <span className="text-ink-muted">{timeAgo(l.last_activity_at)}</span> },
  ];
  return (
    <ResponsiveTable
      label="Clientes"
      rows={leads}
      columns={columns}
      rowKey={(l) => l.id}
      onRowClick={(l) => navigate(`${basePath}/${l.id}`)}
      card={(l) => (
        <Link to={`${basePath}/${l.id}`} className={cn("card card-hover flex h-full flex-col gap-3 p-4", l.new_proposals > 0 && "ring-2 ring-rose-300")}>
          <span className="flex min-w-0 items-start gap-3">
            <Avatar name={leadName(l)} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink">{leadName(l)}</span>
              <span className="block truncate text-xs text-ink-muted">
                {l.development_name}
                {l.phone && ` · ${formatPhone(l.phone)}`}
              </span>
              {showBroker && (
                <span className="block truncate text-xs text-ink-muted">
                  {l.broker_name} · {l.broker_code}
                </span>
              )}
            </span>
            <NewProposalsBadge count={l.new_proposals} />
          </span>
          <span className="mt-auto flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <StageBadge stage={l.stage} />
              <SignalIcons signals={l.signals} max={4} />
            </span>
            <small className="shrink-0 text-xs text-ink-muted">{timeAgo(l.last_activity_at)}</small>
          </span>
        </Link>
      )}
    />
  );
}
