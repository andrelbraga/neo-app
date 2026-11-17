import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Search, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { timeAgo } from "@/shared/lib/format";
import { Avatar, Skeleton } from "@/shared/ui/visuals";
import { leadName, matchesLead, stageLabel, stages, type Lead, type Stage } from "../model/lead.types";
import { adminLeadService, myLeadService } from "../services/lead.service";
import { StageBadge } from "./LeadParts";

/**
 * Coluna de clientes ao lado da ficha, como a lista de pedidos da referência de layout (ADR-0013):
 * cabeçalho com filtro por etapa e busca, cartões com avatar, situação, tempo e o cliente aberto em destaque.
 */
export function LeadList({ mode, activeId }: { mode: "corretor" | "admin"; activeId?: string }) {
  const broker = mode === "corretor";
  const basePath = broker ? "/painel/clientes" : "/admin/clientes";
  const leads = useQuery({
    queryKey: broker ? ["my-leads"] : ["admin-leads", {}],
    queryFn: () => (broker ? myLeadService.list() : adminLeadService.list()),
    refetchInterval: 10_000,
  });
  const [stage, setStage] = useState<Stage | "">("");
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const rows = (leads.data ?? []).filter((l) => (!stage || l.stage === stage) && matchesLead(l, q));

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="card flex h-14 items-center gap-2 px-4">
        {searching ? (
          <>
            <Search size={16} className="shrink-0 text-ink-muted" />
            <input autoFocus aria-label="Buscar na lista" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, WhatsApp…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            <button type="button" aria-label="Fechar busca" onClick={() => (setQ(""), setSearching(false))} className="rounded-full p-1.5 text-ink-muted hover:bg-cream hover:text-ink">
              <X size={15} />
            </button>
          </>
        ) : (
          <>
            <label className="relative flex min-w-0 flex-1 items-center">
              <span className="sr-only">Filtrar por etapa</span>
              <select value={stage} onChange={(e) => setStage(e.target.value as Stage | "")} className="min-w-0 cursor-pointer appearance-none truncate bg-transparent pr-5 text-sm font-bold text-ink outline-none">
                <option value="">Todos os clientes</option>
                {stages.map((s) => (
                  <option key={s} value={s}>
                    {stageLabel[s]}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none -ml-4 text-ink" />
            </label>
            <span className="text-xs font-semibold text-ink-muted">{rows.length}</span>
            <button type="button" aria-label="Buscar na lista" onClick={() => setSearching(true)} className="rounded-full p-2 text-ink-muted hover:bg-cream hover:text-ink">
              <Search size={16} />
            </button>
          </>
        )}
      </div>

      {leads.isPending && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[74px]" />)}
      {leads.data && rows.length === 0 && <p className="px-2 py-6 text-center text-sm text-ink-muted">Nenhum cliente com esse filtro.</p>}
      <ul className="-mx-1 flex-1 space-y-2.5 overflow-y-auto px-1 pb-2" aria-label="Clientes">
        {rows.map((l) => (
          <LeadListItem key={l.id} lead={l} href={`${basePath}/${l.id}`} active={l.id === activeId} showBroker={!broker} />
        ))}
      </ul>
    </div>
  );
}

function LeadListItem({ lead: l, href, active, showBroker }: { lead: Lead; href: string; active: boolean; showBroker: boolean }) {
  const name = leadName(l);
  return (
    <li>
      <Link
        to={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl p-3 pr-3.5 transition duration-200",
          active ? "bg-forest text-white shadow-lift" : "bg-cream-card shadow-soft hover:-translate-y-0.5 hover:shadow-lift",
        )}
      >
        {/* Proposta nova: anel índigo com selo, como os itens marcados da referência */}
        <span className={cn("relative shrink-0 rounded-full", l.new_proposals > 0 && (active ? "ring-2 ring-white" : "ring-2 ring-forest ring-offset-2"))}>
          <Avatar name={name} size="md" className={cn(active && "ring-white/40")} />
          {l.new_proposals > 0 && (
            <span className={cn("absolute -bottom-1 -right-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2", active ? "bg-white text-forest ring-forest" : "bg-forest text-white ring-white")}>
              {l.new_proposals}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <b className={cn("block truncate text-sm", active ? "text-white" : "text-ink")}>{name}</b>
          <span className={cn("mt-0.5 block", active && "[&_*]:!text-white/75 [&_span>span]:!bg-white/75")}>
            <StageBadge stage={l.stage} />
          </span>
        </span>
        <span className="shrink-0 text-right">
          <b className={cn("block text-sm", active ? "text-white" : "text-ink")}>{timeAgo(l.last_activity_at)}</b>
          <small className={cn("block max-w-[7.5rem] truncate text-[11px] font-semibold", active ? "text-white/60" : "text-ink-muted/80")}>{showBroker ? l.broker_code : l.development_name}</small>
        </span>
      </Link>
    </li>
  );
}
