import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Building2, Trophy, UserCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { brokerService } from "@/modules/brokers/services/broker.service";
import { developmentService } from "@/modules/developments/services/development.service";
import { ActivityFeed, FunnelBars } from "@/modules/leads/components/ActivityFeed";
import { LeadsTable } from "@/modules/leads/components/LeadParts";
import { adminLeadService } from "@/modules/leads/services/lead.service";
import { formatBRL } from "@/shared/lib/format";
import { Avatar, KpiCard } from "@/shared/ui/visuals";

/** Visão geral do admin: números da plataforma, funil, quem mais atrai clientes e o que acontece agora. */
export function AdminHomePage() {
  const summary = useQuery({ queryKey: ["admin", "summary"], queryFn: adminLeadService.summary, refetchInterval: 10_000 });
  const activity = useQuery({ queryKey: ["admin", "activity"], queryFn: adminLeadService.activity, refetchInterval: 10_000 });
  const brokers = useQuery({ queryKey: ["admin-brokers"], queryFn: brokerService.list });
  const developments = useQuery({ queryKey: ["admin-developments"], queryFn: developmentService.list });
  const leads = useQuery({ queryKey: ["admin-leads", {}], queryFn: () => adminLeadService.list(), refetchInterval: 15_000 });
  const ranking = [...(brokers.data ?? [])].filter((b) => b.leads_count > 0).sort((a, b) => b.leads_count - a.leads_count).slice(0, 5);
  const topCount = Math.max(1, ...ranking.map((b) => b.leads_count));

  return (
    <div className="space-y-6">
      <section className="hero-grad relative animate-rise overflow-hidden rounded-3xl p-6 text-cream shadow-lift md:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal-soft/20 blur-3xl" />
        <h1 className="relative text-3xl md:text-4xl">Visão geral</h1>
        <p className="relative mt-2 max-w-xl text-sm text-cream/80">Tudo o que acontece na plataforma, de todos os corretores e empreendimentos, atualizado sozinho.</p>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard icon={<UserCheck size={16} />} label="Corretores ativos" value={brokers.data?.filter((b) => b.active).length} />
        <KpiCard icon={<Building2 size={16} />} label="Empreendimentos publicados" value={developments.data?.filter((d) => d.published).length} tone="gold" />
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
        <div className="md:col-span-2 xl:col-span-1">
          <ActivityFeed items={activity.data} loading={activity.isPending} basePath="/admin/clientes" showBroker />
        </div>
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
