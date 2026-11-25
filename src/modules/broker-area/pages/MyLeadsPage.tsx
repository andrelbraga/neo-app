import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Columns3, List, Search, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import { KanbanBoard } from "@/modules/leads/components/KanbanBoard";
import { LeadsTable } from "@/modules/leads/components/LeadParts";
import { leadName, matchesLead, stageLabel, type Lead, type StageChange } from "@/modules/leads/model/lead.types";
import { myLeadService } from "@/modules/leads/services/lead.service";
import { cn } from "@/shared/lib/cn";
import { Button, PageHeader } from "@/shared/ui/ui";
import { Skeleton } from "@/shared/ui/visuals";
import { AddClientsDialog } from "../components/AddClientsDialog";

/** Clientes do corretor no funil (quadro arrastável) ou em lista. Atualiza sozinho. */
export function MyLeadsPage() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const view = params.get("ver") === "lista" ? "lista" : "quadro";
  const [q, setQ] = useState(params.get("q") ?? "");
  const [adding, setAdding] = useState(false);
  useEffect(() => setQ(params.get("q") ?? ""), [params]);
  const key = ["my-leads"];
  const leads = useQuery({ queryKey: key, queryFn: () => myLeadService.list(), refetchInterval: 10_000 });
  const filtered = useMemo(() => (leads.data ?? []).filter((l) => matchesLead(l, q)), [leads.data, q]);

  const move = useMutation({
    mutationFn: ({ lead, change }: { lead: Lead; change: StageChange }) => myLeadService.setStage(lead.id, change),
    onMutate: async ({ lead, change }) => {
      await qc.cancelQueries({ queryKey: key });
      const before = qc.getQueryData<Lead[]>(key);
      qc.setQueryData<Lead[]>(key, (list) => list?.map((l) => (l.id === lead.id ? { ...l, stage: change.stage, sale_value: change.sale_value ?? null } : l)));
      return { before };
    },
    onSuccess: (_, { lead, change }) => {
      toast.success(`${leadName(lead)} → ${stageLabel[change.stage]}`);
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e, _, ctx) => {
      qc.setQueryData(key, ctx?.before);
      toast.error(apiErrorMessage(e));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["corretor", "summary"] }),
  });

  return (
    <>
      <PageHeader
        title="Meus clientes"
        subtitle="Arraste o cartão ou use “Mover para”. Quem mandou proposta nova aparece em destaque."
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
        <div className="inline-flex rounded-full border border-line bg-white p-1" role="group" aria-label="Modo de exibição">
          {[
            { id: "quadro", label: "Quadro", icon: Columns3 },
            { id: "lista", label: "Lista", icon: List },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setParams(id === "lista" ? { ver: "lista" } : {})}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition", view === id ? "bg-forest text-cream" : "text-ink-muted hover:text-forest")}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>
      {leads.isPending ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : view === "quadro" ? (
        <KanbanBoard leads={filtered} basePath="/painel/clientes" onMove={(lead, change) => move.mutate({ lead, change })} />
      ) : (
        <LeadsTable leads={filtered} basePath="/painel/clientes" />
      )}
    </>
  );
}
