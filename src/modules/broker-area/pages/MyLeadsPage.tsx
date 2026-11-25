import { useQuery } from "@tanstack/react-query";
import { Archive, Search, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LeadActionsMenu } from "@/modules/leads/components/LeadActionsMenu";
import { LeadsTable } from "@/modules/leads/components/LeadParts";
import { matchesLead } from "@/modules/leads/model/lead.types";
import { myLeadService } from "@/modules/leads/services/lead.service";
import { cn } from "@/shared/lib/cn";
import { Button, EmptyState, PageHeader } from "@/shared/ui/ui";
import { Skeleton } from "@/shared/ui/visuals";
import { AddClientsDialog } from "../components/AddClientsDialog";

/** Clientes do corretor em lista, com o menu ⋮ por cliente (ADR-0025). Atualiza sozinho. */
export function MyLeadsPage() {
  const [params, setParams] = useSearchParams();
  const archived = params.get("ver") === "arquivados";
  const [q, setQ] = useState(params.get("q") ?? "");
  const [adding, setAdding] = useState(false);
  useEffect(() => setQ(params.get("q") ?? ""), [params]);
  const leads = useQuery({
    queryKey: ["my-leads", archived ? "arquivados" : "ativos"],
    queryFn: () => myLeadService.list(archived ? { arquivados: "1" } : {}),
    refetchInterval: 10_000,
  });
  const filtered = useMemo(() => (leads.data ?? []).filter((l) => matchesLead(l, q)), [leads.data, q]);

  return (
    <>
      <PageHeader
        title="Meus clientes"
        subtitle="Use o menu ⋮ de cada cliente para editar, mandar mensagem, mudar de etapa ou arquivar. Quem mandou proposta nova aparece em destaque."
        action={
          <Button onClick={() => setAdding(true)}>
            <UserPlus size={16} /> Adicionar clientes
          </Button>
        }
      />
      {adding && <AddClientsDialog onClose={() => setAdding(false)} />}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[14rem] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <span className="sr-only">Buscar cliente</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, WhatsApp ou empreendimento"
            className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-teal focus:ring-4 focus:ring-teal-soft/40"
          />
        </label>
        <div className="inline-flex rounded-full border border-line bg-white p-1" role="group" aria-label="Clientes ativos ou arquivados">
          {[
            { id: "ativos", label: "Ativos", icon: Users },
            { id: "arquivados", label: "Arquivados", icon: Archive },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={(id === "arquivados") === archived}
              onClick={() => setParams(id === "arquivados" ? { ver: "arquivados" } : {})}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition",
                (id === "arquivados") === archived ? "bg-forest text-cream" : "text-ink-muted hover:text-forest",
              )}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>
      {leads.isPending ? (
        <Skeleton className="h-64" />
      ) : (
        <LeadsTable
          leads={filtered}
          basePath="/painel/clientes"
          actions={(l) => <LeadActionsMenu lead={l} basePath="/painel/clientes" />}
          empty={
            archived ? (
              <EmptyState title="Nenhum cliente arquivado" text="Arquivar tira o cliente da lista sem apagar nada; ele volta pelo menu ⋮." />
            ) : undefined
          }
        />
      )}
    </>
  );
}
