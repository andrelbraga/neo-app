import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSeeAsStore } from "@/modules/admin/store/seeAs.store";
import { brokerService } from "@/modules/brokers/services/broker.service";
import { developmentService } from "@/modules/developments/services/development.service";
import { LeadsTable } from "@/modules/leads/components/LeadParts";
import { matchesLead, stageLabel, stages, type LeadFilter } from "@/modules/leads/model/lead.types";
import { adminLeadService } from "@/modules/leads/services/lead.service";
import { inputClass } from "@/shared/ui/styles";
import { PageHeader } from "@/shared/ui/ui";
import { Skeleton } from "@/shared/ui/visuals";

/** Todos os clientes em lista (só leitura), com filtro por corretor, empreendimento e etapa. */
export function AdminLeadsPage() {
  // Começa no corretor do "ver como" (RN-01.10) e acompanha a troca feita na barra lateral.
  const seeAs = useSeeAsStore((s) => s.broker?.id);
  const [filter, setFilter] = useState<LeadFilter>(seeAs ? { broker: seeAs } : {});
  useEffect(() => setFilter((f) => ({ ...f, broker: seeAs })), [seeAs]);
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
        subtitle="Cada cliente tem um dono: quem trouxe primeiro, pelo link ou pelo cadastro."
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
      ) : (
        <LeadsTable leads={rows} basePath="/admin/clientes" showBroker />
      )}
    </>
  );
}
