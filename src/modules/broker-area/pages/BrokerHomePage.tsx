import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Check, Copy, ExternalLink, FileSignature, Handshake, Share2, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { statusLabel, type Development } from "@/modules/developments/model/development.types";
import { brokerLink, developmentService } from "@/modules/developments/services/development.service";
import { ActivityFeed, FunnelBars } from "@/modules/leads/components/ActivityFeed";
import { LayoutComparison } from "@/modules/leads/components/LayoutComparison";
import { myLeadService } from "@/modules/leads/services/lead.service";
import { cn } from "@/shared/lib/cn";
import { formatBRL } from "@/shared/lib/format";
import { waShare } from "@/shared/lib/whatsapp";
import { buttonClass } from "@/shared/ui/styles";
import { EmptyState } from "@/shared/ui/ui";
import { KpiCard, Skeleton } from "@/shared/ui/visuals";

function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

/** Cartão do empreendimento com o link exclusivo do corretor (RN-02.1, RN-02.4). */
function LinkCard({ d, code }: { d: Development; code: string }) {
  const [copied, setCopied] = useState(false);
  // O corretor escolhe o layout da apresentação de cada envio; começa no padrão do empreendimento (ADR-0019).
  const [layout, setLayout] = useState<"a" | "b">(d.default_layout ?? "a");
  const link = brokerLink(d.slug, code, window.location.origin, layout);
  const message = `Olá! Separei para você o ${d.name}, em ${d.city}. Veja fotos, planta, condições e a maquete 3D: ${link}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar. Selecione o link e copie.");
    }
  };
  return (
    <article className="card card-hover group animate-rise overflow-hidden">
      <div className="relative h-44 overflow-hidden">
        {d.cover_image_url ? (
          <img src={d.cover_image_url} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="hero-grad h-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/20 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 text-cream">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] backdrop-blur">{statusLabel[d.status]}</span>
          <h3 className="mt-1 text-2xl">{d.name}</h3>
          <p className="text-xs text-cream/80">{[d.city, d.state].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <div className="p-4">
        {d.presentation_url && (
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Layout da apresentação</span>
            <div className="inline-flex rounded-full border border-line bg-white p-0.5" role="group" aria-label="Layout da apresentação">
              {(["a", "b"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={layout === l}
                  onClick={() => setLayout(l)}
                  className={cn("rounded-full px-3 py-1 text-xs font-semibold transition", layout === l ? "bg-forest text-white" : "text-ink-muted hover:text-ink")}
                >
                  {l.toUpperCase()}
                  {d.default_layout === l && <span className="ml-1 font-normal opacity-70">padrão</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted" htmlFor={`link-${d.id}`}>
          Seu link exclusivo
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-line bg-white p-1 pl-3">
          <input id={`link-${d.id}`} readOnly value={link} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          <button type="button" onClick={copy} aria-label="Copiar link" className="rounded-lg bg-forest-soft p-2 text-forest transition hover:bg-forest hover:text-cream">
            {copied ? <Check size={15} className="animate-pop" /> : <Copy size={15} />}
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <a href={waShare(message)} target="_blank" rel="noreferrer" className={buttonClass("whatsapp")}>
            <Share2 size={15} /> Enviar pelo WhatsApp
          </a>
          <a href={link} target="_blank" rel="noreferrer" className={buttonClass("outline")}>
            <ExternalLink size={15} /> Ver como cliente
          </a>
        </div>
      </div>
    </article>
  );
}

/** Início do corretor: indicadores, funil, links para ofertar e o que os clientes estão fazendo agora. */
export function BrokerHomePage() {
  const broker = useAuthStore((s) => s.user?.broker);
  const summary = useQuery({ queryKey: ["corretor", "summary"], queryFn: myLeadService.summary, refetchInterval: 10_000 });
  const activity = useQuery({ queryKey: ["corretor", "activity"], queryFn: myLeadService.activity, refetchInterval: 10_000 });
  const developments = useQuery({ queryKey: ["published-developments"], queryFn: developmentService.published });
  const s = summary.data;

  return (
    <div className="space-y-6">
      <section className="hero-grad relative flex animate-rise flex-wrap items-center justify-between gap-6 overflow-hidden p-7 text-cream md:px-8">
        <div className="relative">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-soft/80">
            {greeting()}, {broker?.first_name ?? "corretor"}
          </span>
          <h1 className="mt-1.5 text-3xl md:text-[34px]">Seu próximo atendimento começa aqui.</h1>
          <p className="mt-2 max-w-xl text-sm text-cream/75">
            Envie seu link, acompanhe quem abriu, receba a proposta e feche pelo WhatsApp. Seu código é <b className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-cream">{broker?.code}</b>.
          </p>
        </div>
        <Link to="/painel/clientes" className={buttonClass("primary", "relative border-0 bg-gold-soft text-forest-deep hover:bg-gold-soft/90")}>
          Ver meus clientes →
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard icon={<Users size={16} />} label="Clientes" value={s?.leads} hint="abriram seus links" />
        <KpiCard icon={<FileSignature size={16} />} label="Propostas novas" value={s?.new_proposals} tone={s?.new_proposals ? "rose" : "teal"} hint="ainda não abertas" />
        <KpiCard icon={<Handshake size={16} />} label="Em negociação" value={s?.by_stage.proposta} tone="gold" hint="na etapa proposta" />
        <KpiCard icon={<BadgeCheck size={16} />} label="Vendas fechadas" value={s?.sales} tone="teal" hint={s?.sales_value ? `${formatBRL(s.sales_value)} vendidos` : undefined} />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <h2 className="text-2xl text-ink">Empreendimentos para ofertar</h2>
          {developments.isPending && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          )}
          {developments.data?.length === 0 && <EmptyState title="Nenhum empreendimento publicado" text="Quando a Neo360 publicar um empreendimento, ele aparece aqui." />}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{broker && developments.data?.map((d) => <LinkCard key={d.id} d={d} code={broker.code} />)}</div>
        </div>
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-1">
          <ActivityFeed items={activity.data} loading={activity.isPending} basePath="/painel/clientes" />
          <FunnelBars summary={s} />
          <LayoutComparison summary={s} />
        </div>
      </div>
    </div>
  );
}
