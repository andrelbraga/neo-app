import { useQuery } from "@tanstack/react-query";
import { Columns3, List } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { brokerService } from "@/modules/brokers/services/broker.service";
import { developmentService } from "@/modules/developments/services/development.service";
import { KanbanBoard } from "@/modules/leads/components/KanbanBoard";
import { LeadsTable } from "@/modules/leads/components/LeadParts";
import { matchesLead, stageLabel, stages, type LeadFilter } from "@/modules/leads/model/lead.types";
import { adminLeadService } from "@/modules/leads/services/lead.service";
import { cn } from "@/shared/lib/cn";
import { inputClass } from "@/shared/ui/styles";
import { PageHeader } from "@/shared/ui/ui";
import { Skeleton } from "@/shared/ui/visuals";

/** Todos os clientes, em quadro (só leitura) ou lista, com filtro por corretor, empreendimento e etapa. */
export function AdminLeadsPage() {
  const [filter, setFilter] = useState<LeadFilter>({});
  const [view, setView] = useState<"quadro" | "lista">("lista");
  const leads = useQuery({ queryKey: ["admin-leads", filter], queryFn: () => adminLeadService.list(filter), refetchInterval: 15_000 });
  const brokers = useQuery({ queryKey: ["admin-brokers"], queryFn: brokerService.list });
  const developments = useQuery({ queryKey: ["admin-developments"], queryFn: developmentService.list });
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const rows = (leads.data ?? []).filter((l) => matchesLead(l, q));
  const set = (k: keyof LeadFilter) => (e: { target: { value: string } }) => setFilter({ ...filter, [k]: e.target.value });

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Cada cliente tem um dono: o corretor do link da primeira visita."
        action={
          <div className="inline-flex rounded-full border border-line bg-white p-1" role="group" aria-label="Modo de exibição">
            {[
              { id: "lista" as const, label: "Lista", icon: List },
              { id: "quadro" as const, label: "Quadro", icon: Columns3 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                onClick={() => setView(id)}
                className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition", view === id ? "bg-forest text-cream" : "text-ink-muted hover:text-forest")}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <select aria-label="Corretor" className={inputClass} value={filter.broker ?? ""} onChange={set("broker")}>
          <option value="">Todos os corretores</option>
          {brokers.data?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.first_name} {b.last_name} · {b.code}
            </option>
          ))}
        </select>
        <select aria-label="Empreendimento" className={inputClass} value={filter.development ?? ""} onChange={set("development")}>
          <option value="">Todos os empreendimentos</option>
          {developments.data?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select aria-label="Etapa" className={inputClass} value={filter.stage ?? ""} onChange={set("stage")}>
          <option value="">Todas as etapas</option>
          {stages.map((s) => (
            <option key={s} value={s}>
              {stageLabel[s]}
            </option>
          ))}
        </select>
      </div>
      {leads.isPending ? (
        <Skeleton className="h-64" />
      ) : view === "quadro" ? (
        <KanbanBoard leads={rows} basePath="/admin/clientes" showBroker />
      ) : (
        <LeadsTable leads={rows} basePath="/admin/clientes" showBroker />
      )}
    </>
  );
}
