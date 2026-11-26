import type { ReactNode } from "react";
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
/** Selo de propostas não abertas; `compact` ("2 novas") é o da lista, para o nome do cliente caber inteiro. */
export function NewProposalsBadge({ count, compact = false }: { count: number; compact?: boolean }) {
  if (count <= 0) return null;
  const full = count === 1 ? "1 proposta nova" : `${count} propostas novas`;
  return (
    <span
      className="inline-flex shrink-0 animate-pop items-center gap-1 whitespace-nowrap rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white"
      title="Propostas que você ainda não abriu"
      aria-label={full}
    >
      {compact ? (count === 1 ? "1 nova" : `${count} novas`) : full}
    </span>
  );
}

/** Seleção de clientes na lista (ADR-0028): só quem tem WhatsApp pode ser marcado. */
export interface LeadSelection {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

/**
 * Lista de clientes: tabela no desktop, cartões no celular e no tablet. `showBroker` mostra o dono (visão do
 * admin); `actions` põe o menu ⋮ no fim da linha (corretor); `selection` põe um checkbox no começo (corretor).
 */
export function LeadsTable({
  leads,
  basePath,
  showBroker = false,
  actions,
  empty,
  selection,
}: {
  leads: Lead[];
  basePath: string;
  showBroker?: boolean;
  actions?: (l: Lead) => ReactNode;
  empty?: ReactNode;
  selection?: LeadSelection;
}) {
  const navigate = useNavigate();
  if (leads.length === 0) {
    return empty ?? <EmptyState title="Nenhum cliente ainda" text="Quando alguém abrir um link, ele aparece aqui com o que viu na página." />;
  }
  const columns: Column<Lead>[] = [
    ...(selection ? [selectColumn(leads, selection)] : []),
    {
      key: "cliente",
      header: "Cliente",
      width: "30%",
      minWidth: "190px",
      cell: (l) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={leadName(l)} size="sm" />
          <span className="min-w-0 flex-1">
            <Link
              to={`${basePath}/${l.id}`}
              onClick={(e) => e.stopPropagation()}
              title={leadName(l)}
              className="block truncate font-semibold text-ink hover:text-forest hover:underline"
            >
              {leadName(l)}
            </Link>
            {(l.phone || l.new_proposals > 0) && (
              <span className="mt-0.5 flex min-w-0 items-center gap-2">
                <NewProposalsBadge count={l.new_proposals} compact />
                {l.phone && <span className="truncate text-xs text-ink-muted">{formatPhone(l.phone)}</span>}
              </span>
            )}
          </span>
        </span>
      ),
    },
    { key: "empreendimento", header: "Empreendimento", width: "20%", cell: (l) => <span title={l.development_name}>{l.development_name}</span> },
    ...(showBroker
      ? [
          {
            key: "corretor",
            header: "Corretor",
            width: "16%",
            minWidth: "120px",
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
    // Larguras mínimas: quatro ícones, o nome da etapa mais longo ("Em atendimento") e "há 59 min" inteiros.
    { key: "interesse", header: "Interesse", width: "14%", minWidth: "120px", cell: (l) => <SignalIcons signals={l.signals} max={4} /> },
    { key: "etapa", header: "Etapa", width: "16%", minWidth: "168px", cell: (l) => <StageBadge stage={l.stage} /> },
    {
      key: "atividade",
      header: "Atividade",
      width: "12%",
      minWidth: "104px",
      align: "right",
      cell: (l) => <span className="whitespace-nowrap text-ink-muted">{timeAgo(l.last_activity_at)}</span>,
    },
    ...(actions ? [{ key: "acoes", header: "Ações", width: "64px", cell: (l: Lead) => actions(l) }] : []),
  ];
  return (
    <ResponsiveTable
      label="Clientes"
      // Com o menu lateral, as sete colunas só cabem inteiras a partir de 1280 px; abaixo, cartões.
      from="xl"
      rows={leads}
      columns={columns}
      rowKey={(l) => l.id}
      onRowClick={(l) => navigate(`${basePath}/${l.id}`)}
      card={(l) => (
        <div className="relative h-full">
          {selection && (
            <span className="absolute left-4 top-6 z-10">
              <LeadCheckbox lead={l} selection={selection} />
            </span>
          )}
          <Link
            to={`${basePath}/${l.id}`}
            className={cn("card card-hover flex h-full flex-col gap-3 p-4", selection && "pl-11", l.new_proposals > 0 && "ring-2 ring-rose-300")}
          >
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
              <NewProposalsBadge count={l.new_proposals} compact />
              {actions && <span className="w-7 shrink-0" aria-hidden="true" />}
            </span>
            <span className="mt-auto flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <StageBadge stage={l.stage} />
                <SignalIcons signals={l.signals} max={4} />
              </span>
              <small className="shrink-0 text-xs text-ink-muted">{timeAgo(l.last_activity_at)}</small>
            </span>
          </Link>
          {actions && <div className="absolute right-2 top-2">{actions(l)}</div>}
        </div>
      )}
    />
  );
}

function LeadCheckbox({ lead, selection }: { lead: Lead; selection: LeadSelection }) {
  const toggle = () => {
    const next = new Set(selection.selected);
    if (!next.delete(lead.id)) next.add(lead.id);
    selection.onChange(next);
  };
  return (
    <input
      type="checkbox"
      className="size-4 accent-forest"
      checked={selection.selected.has(lead.id)}
      disabled={!lead.phone}
      title={lead.phone ? undefined : "Sem WhatsApp cadastrado"}
      aria-label={`Selecionar ${leadName(lead)}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onChange={toggle}
    />
  );
}

function selectColumn(leads: Lead[], selection: LeadSelection): Column<Lead> {
  const ids = leads.filter((l) => l.phone).map((l) => l.id);
  const allOn = ids.length > 0 && ids.every((id) => selection.selected.has(id));
  return {
    key: "selecionar",
    width: "48px",
    header: (
      <input
        type="checkbox"
        className="size-4 accent-forest"
        checked={allOn}
        disabled={ids.length === 0}
        aria-label="Selecionar todos com WhatsApp"
        onChange={() => selection.onChange(allOn ? new Set() : new Set(ids))}
      />
    ),
    cell: (l) => <LeadCheckbox lead={l} selection={selection} />,
  };
}
