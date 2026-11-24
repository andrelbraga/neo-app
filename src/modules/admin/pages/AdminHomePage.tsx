import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Building2, FileSignature, Handshake, Trophy, UserCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useSeeAsStore } from "@/modules/admin/store/seeAs.store";
import { brokerService } from "@/modules/brokers/services/broker.service";
import { developmentService } from "@/modules/developments/services/development.service";
import { ActivityFeed, FunnelBars } from "@/modules/leads/components/ActivityFeed";
import { LayoutComparison } from "@/modules/leads/components/LayoutComparison";
import { LeadsTable } from "@/modules/leads/components/LeadParts";
import { adminLeadService } from "@/modules/leads/services/lead.service";
import { formatBRL } from "@/shared/lib/format";
import { buttonClass } from "@/shared/ui/styles";
import { Avatar, KpiCard } from "@/shared/ui/visuals";

/** Visão geral do admin: números da plataforma, funil, quem mais atrai clientes e o que acontece agora. */
export function AdminHomePage() {
  // "Ver como" um corretor (RN-01.10): números, feed e clientes só dele; o ranking da plataforma sai.
  const seeAs = useSeeAsStore((s) => s.broker);
  const broker = seeAs?.id;
  const summary = useQuery({ queryKey: ["admin", "summary", broker], queryFn: () => adminLeadService.summary(broker), refetchInterval: 10_000 });
  const activity = useQuery({ queryKey: ["admin", "activity", broker], queryFn: () => adminLeadService.activity(broker), refetchInterval: 10_000 });
  const brokers = useQuery({ queryKey: ["admin-brokers"], queryFn: brokerService.list });
  const developments = useQuery({ queryKey: ["admin-developments"], queryFn: developmentService.list });
  const filter = broker ? { broker } : {};
  const leads = useQuery({ queryKey: ["admin-leads", filter], queryFn: () => adminLeadService.list(filter), refetchInterval: 15_000 });
  const ranking = [...(brokers.data ?? [])].filter((b) => b.leads_count > 0).sort((a, b) => b.leads_count - a.leads_count).slice(0, 5);
  const topCount = Math.max(1, ...ranking.map((b) => b.leads_count));

  return (
    <div className="space-y-6">
      <section className="hero-grad relative flex animate-rise flex-wrap items-center justify-between gap-6 overflow-hidden p-7 text-cream md:px-8">
        <div className="relative">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-soft/80">{seeAs ? `Neo360 / ${seeAs.name}` : "Neo360 / Administração"}</span>
          <h1 className="mt-1.5 text-3xl md:text-[34px]">{seeAs ? `A operação de ${seeAs.name}.` : "Sua operação, por inteiro."}</h1>
          <p className="mt-2 max-w-xl text-sm text-cream/75">
            {seeAs ? "Os números, o feed e os clientes abaixo são só deste corretor." : "Clientes, corretores e empreendimentos conectados, atualizados sozinhos."}
          </p>
        </div>
        <Link to="/admin/clientes" className={buttonClass("primary", "relative border-0 bg-gold-soft text-forest-deep hover:bg-gold-soft/90")}>
          Ver clientes →
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {seeAs ? (
          <>
            <KpiCard icon={<FileSignature size={16} />} label="Propostas novas" value={summary.data?.new_proposals} hint="ainda não abertas pelo corretor" />
            <KpiCard icon={<Handshake size={16} />} label="Em negociação" value={summary.data?.by_stage.proposta} tone="gold" hint="na etapa proposta" />
          </>
        ) : (
          <>
            <KpiCard icon={<UserCheck size={16} />} label="Corretores ativos" value={brokers.data?.filter((b) => b.active).length} />
            <KpiCard icon={<Building2 size={16} />} label="Empreendimentos publicados" value={developments.data?.filter((d) => d.published).length} tone="gold" />
          </>
        )}
        <KpiCard icon={<Users size={16} />} label="Clientes" value={summary.data?.leads} tone="teal" />
        <KpiCard
          icon={<BadgeCheck size={16} />}
          label="Vendas fechadas"
          value={summary.data?.sales}
          tone="gold"
          hint={summary.data?.sales_value ? `${formatBRL(summary.data.sales_value)} vendidos` : "nenhuma registrada ainda"}
        />
      </section>

      <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
        <FunnelBars summary={summary.data} />
        {seeAs ? (
          <div className="md:col-span-1 xl:col-span-2">
            <ActivityFeed items={activity.data} loading={activity.isPending} basePath="/admin/clientes" showBroker />
          </div>
        ) : (
        <section className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-xl text-ink">
            <Trophy size={18} className="text-gold" /> Quem mais atrai clientes
          </h2>
          {ranking.length === 0 && <p className="text-sm text-ink-muted">Ainda sem clientes.</p>}
          <ol className="space-y-3">
            {ranking.map((b, i) => (
              <li key={b.id} className="flex items-center gap-3">
                <span className="w-4 text-xs font-semibold text-ink-muted">{i + 1}</span>
                <Avatar name={`${b.first_name} ${b.last_name}`} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate font-medium">
                      {b.first_name} {b.last_name}
                    </span>
                    <b className="text-ink">{b.leads_count}</b>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/50">
                    <div className="h-full rounded-full bg-forest transition-all duration-700" style={{ width: `${(b.leads_count / topCount) * 100}%` }} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
        )}
        <div className="md:col-span-2 xl:col-span-3">
          <LayoutComparison summary={summary.data} />
        </div>
        {!seeAs && (
          <div className="md:col-span-2 xl:col-span-1">
            <ActivityFeed items={activity.data} loading={activity.isPending} basePath="/admin/clientes" showBroker />
          </div>
        )}
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-2xl text-ink">Clientes recentes</h2>
          <Link to="/admin/clientes" className="shrink-0 text-sm font-semibold text-forest underline">
            ver todos
          </Link>
        </div>
        <LeadsTable leads={(leads.data ?? []).slice(0, 8)} basePath="/admin/clientes" showBroker />
      </section>
    </div>
  );
}
