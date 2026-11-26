import { useQuery } from "@tanstack/react-query";
import { Archive, ArchiveRestore, ArrowRight, CalendarDays, Clock3, FileSignature, MessageCircle, Pencil, Phone, PencilLine, Plus, Star, Tag, X } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { formatBRL, formatDateTime, formatPhone, timeAgo } from "@/shared/lib/format";
import { waChat } from "@/shared/lib/whatsapp";
import { buttonClass } from "@/shared/ui/styles";
import { Badge, EmptyState } from "@/shared/ui/ui";
import { Avatar, Skeleton } from "@/shared/ui/visuals";
import { Journey, type JourneyFilter } from "../components/Journey";
import { LeadList } from "../components/LeadList";
import { SignalIcons, StageBadge } from "../components/LeadParts";
import { ProposalEditor } from "../components/ProposalEditor";
import { ProposalSheet } from "../components/ProposalSheet";
import { StageControl } from "../components/StageControl";
import { useArchive } from "../hooks/useArchive";
import { formatDuration, metricsOf, topActions } from "../model/journey";
import { leadName, profileLabel } from "../model/lead.types";
import { proposalsOf, type Proposal } from "../model/proposal";
import { adminLeadService, myLeadService } from "../services/lead.service";
import { EditLeadDialog } from "../components/EditLeadDialog";
import { MessageComposer } from "../components/MessageComposer";

/** Informação com ícone num círculo branco, como as datas do pedido na referência de layout. */
function InfoChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream-card text-ink-muted shadow-soft ring-1 ring-line/70">{icon}</span>
      <div>
        <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">{label}</dt>
        <dd className="text-sm font-medium text-ink">{value}</dd>
      </div>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="rounded-2xl bg-cream-card p-5 shadow-soft ring-1 ring-line/70">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const iconBtn = "inline-flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink transition hover:bg-forest-soft hover:text-forest";

type Tab = "resumo" | "propostas" | "atividades";

/**
 * Ficha do cliente (ADR-0015): Resumo (etapa e desfecho, última proposta e o interesse em números),
 * Propostas (do cliente e ajustes do corretor) e Atividades (jornada no estilo do Google Analytics).
 * A conversa acontece no WhatsApp. O corretor muda a etapa e ajusta propostas; o admin só lê, e abrir a
 * ficha no admin não marca as propostas como vistas para o corretor.
 */
export function LeadDetailPage({ mode }: { mode: "corretor" | "admin" }) {
  const { id = "" } = useParams();
  const [tab, setTab] = useState<Tab>("resumo");
  const [filter, setFilter] = useState<JourneyFilter | undefined>();
  const [editing, setEditing] = useState<{ base?: Proposal } | null>(null);
  // Edição do cliente e mensagem no WhatsApp com tom e perfil (ADR-0025).
  const [dialog, setDialog] = useState<"editar" | "mensagem" | null>(null);
  const archive = useArchive();
  const broker = mode === "corretor";
  const back = broker ? "/painel/clientes" : "/admin/clientes";
  // Fotos dos veículos das propostas (RN-03.23): pedem o login, então vêm pelo serviço.
  const photo = useCallback((photoId: string) => (broker ? myLeadService.photo(id, photoId) : adminLeadService.photo(id, photoId)), [broker, id]);
  const lead = useQuery({ queryKey: ["lead", mode, id], queryFn: () => (broker ? myLeadService.get(id) : adminLeadService.get(id)), refetchInterval: 15_000 });

  const showActivity = (f?: JourneyFilter) => {
    // Proposta tem aba própria, formatada; o resto vai para a jornada filtrada.
    if (f?.kind === "proposta") return setTab("propostas");
    setFilter(f);
    setTab("atividades");
  };

  if (lead.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (!lead.data) return <EmptyState title="Cliente não encontrado" action={<Link to={back} className={buttonClass("outline")}>Voltar</Link>} />;

  const l = lead.data;
  const name = leadName(l);
  const proposals = proposalsOf(l.proposals ?? []);
  const numberOf = (pid: string | null) => (pid && proposals.some((p) => p.id === pid) ? proposals.length - proposals.findIndex((p) => p.id === pid) : undefined);
  const latest = proposals[0];
  const metrics = metricsOf(l.events);
  const keyActions = topActions(l.events)
    .filter((a) => a.key)
    .slice(0, 4);
  const wa = broker && l.phone ? (text: string) => waChat(l.phone, text) : undefined;
  const tabs: { id: Tab; label: string; count?: number; alert?: boolean }[] = [
    { id: "resumo", label: "Resumo" },
    { id: "propostas", label: "Propostas", count: proposals.length, alert: l.new_proposals > 0 },
    { id: "atividades", label: "Atividades" },
  ];

  return (
    <div className="xl:grid xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] xl:items-start xl:gap-6">
      <aside className="sticky top-[96px] hidden h-[calc(100vh-128px)] xl:block">
        <LeadList mode={mode} activeId={l.id} />
      </aside>

      <article className="card animate-rise overflow-hidden">
        {/* Abas e ações, como o topo do detalhe da referência */}
        <div className="flex items-center gap-2 border-b border-line px-4 sm:px-6">
          <div role="tablist" aria-label="Seções da ficha" className="-mb-px flex min-w-0 flex-1 gap-4 overflow-x-auto [scrollbar-width:none] sm:gap-7">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => (t.id === "atividades" ? showActivity() : setTab(t.id))}
                className={cn("relative shrink-0 border-b-2 py-5 text-xs font-bold uppercase tracking-[0.08em] transition", tab === t.id ? "border-forest text-forest" : "border-transparent text-ink-muted hover:text-ink")}
              >
                {t.label}
                {t.count ? <span className={cn("ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]", t.alert ? "bg-rose-500 text-white" : "bg-cream text-ink-muted")}>{t.count}</span> : null}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {broker && (
              <>
                <button type="button" onClick={() => setDialog("mensagem")} aria-label="Mensagem no WhatsApp" title="Mensagem no WhatsApp" className={cn(iconBtn, "hidden sm:inline-flex")}>
                  <MessageCircle size={16} />
                </button>
                <button type="button" onClick={() => setDialog("editar")} aria-label="Editar cliente" title="Editar cliente" className={iconBtn}>
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => archive.mutate(l)}
                  disabled={archive.isPending}
                  aria-label={l.archived_at ? "Restaurar cliente" : "Arquivar cliente"}
                  title={l.archived_at ? "Restaurar cliente" : "Arquivar cliente"}
                  className={iconBtn}
                >
                  {l.archived_at ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                </button>
              </>
            )}
            {l.phone && (
              <a href={`tel:+${l.phone}`} aria-label="Ligar" title={formatPhone(l.phone)} className={cn(iconBtn, "hidden sm:inline-flex")}>
                <Phone size={16} />
              </a>
            )}
            <Link to={back} aria-label="Fechar ficha" title="Voltar para a lista" className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-cream hover:text-ink">
              <X size={18} />
            </Link>
          </div>
        </div>

        <div className="space-y-7 p-4 sm:p-6 lg:p-8">
          {l.archived_at && (
            <p role="status" className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink">
              Cliente arquivado em {formatDateTime(l.archived_at)}. Ele não aparece na lista nem nos números; propostas e histórico continuam aqui.
              {broker && " Restaure pelo botão de arquivo no topo."}
            </p>
          )}
          <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0">
              <h1 className="truncate text-3xl text-ink sm:text-[34px]">{name}</h1>
              <p className="mt-1 truncate text-sm font-medium text-ink-muted">
                #{l.development_name}
                {!broker && ` · ${l.broker_code}`}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StageBadge stage={l.stage} pill />
                {l.profile && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-gold" title="Perfil de compra">
                    <Tag size={11} /> {profileLabel[l.profile]}
                  </span>
                )}
                {l.layout && (
                  <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted" title="Layout da apresentação na primeira visita">
                    Layout {l.layout.toUpperCase()}
                  </span>
                )}
                <SignalIcons signals={l.signals} max={7} onSelect={(kind) => showActivity({ kind })} />
              </div>
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
                <InfoChip
                  icon={<CalendarDays size={16} />}
                  label={l.origin === "corretor" ? (broker ? "Cadastrado por você em" : "Cadastrado pelo corretor em") : "Chegou em"}
                  value={formatDateTime(l.created_at)}
                />
                <InfoChip icon={<Clock3 size={16} />} label="Última atividade" value={timeAgo(l.last_activity_at)} />
              </dl>
            </div>
            <aside className="rounded-2xl bg-cream-card p-5 shadow-soft ring-1 ring-line/70">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">{broker ? "Contato" : "Contato e dono"}</p>
              <Avatar name={name} size="md" className="mt-3" />
              <b className="mt-3 block truncate text-sm text-forest">{name}</b>
              <p className="mt-1 text-sm leading-relaxed text-ink">
                {l.phone ? formatPhone(l.phone) : "Ainda sem WhatsApp"}
                <br />
                {l.development_name}
              </p>
              {!broker && (
                <p className="mt-3 border-t border-line pt-3 text-sm text-ink">
                  {l.broker_name} · {l.broker_code}
                  <small className="mt-1 block text-xs text-ink-muted">O dono é quem trouxe o cliente primeiro (link ou cadastro) e não muda.</small>
                </p>
              )}
              {broker && (
                <button type="button" onClick={() => setDialog("mensagem")} className={buttonClass("whatsapp", "mt-4 w-full px-3 py-2 text-xs")}>
                  <MessageCircle size={14} /> Mensagem no WhatsApp
                </button>
              )}
            </aside>
          </header>

          {tab === "resumo" && (
            <div className="space-y-6">
              <StageControl lead={l} proposals={proposals} readOnly={!broker} />

              <div className="grid items-start gap-6 lg:grid-cols-2">
                <Panel
                  title={latest ? "Última proposta" : "Proposta"}
                  action={
                    proposals.length > 0 && (
                      <button type="button" onClick={() => setTab("propostas")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.08em] text-forest">
                        Ver {proposals.length > 1 ? `as ${proposals.length}` : ""} <ArrowRight size={13} />
                      </button>
                    )
                  }
                >
                  {latest ? (
                    <button type="button" onClick={() => setTab("propostas")} className="flex w-full items-center gap-4 rounded-xl bg-coral-soft/40 p-4 text-left ring-1 ring-coral/20 transition hover:shadow-lift">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-coral">
                        {latest.author === "corretor" ? <PencilLine size={19} /> : <FileSignature size={19} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block text-sm text-ink">{latest.condicao ? `${formatBRL(latest.condicao.preco)} · entrada de ${formatBRL(latest.condicao.entrada)}` : "Proposta em texto"}</b>
                        <small className="block truncate text-xs text-ink-muted">
                          {latest.author === "corretor" ? "Ajuste do corretor" : "Enviada pelo cliente"} · {formatDateTime(latest.createdAt)}
                        </small>
                      </span>
                      {latest.pediuContrato && <Badge tone="coral">Pediu contrato</Badge>}
                    </button>
                  ) : (
                    <div className="rounded-xl bg-cream px-4 py-5 text-sm text-ink-muted">
                      O cliente ainda não enviou proposta pela apresentação.
                      {broker && (
                        <button type="button" onClick={() => setEditing({})} className="mt-3 flex items-center gap-1.5 font-semibold text-forest">
                          <Plus size={15} /> Registrar uma proposta combinada no WhatsApp
                        </button>
                      )}
                    </div>
                  )}
                </Panel>

                <Panel
                  title="Interesse"
                  action={
                    <button type="button" onClick={() => showActivity()} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.08em] text-forest">
                      Ver jornada <ArrowRight size={13} />
                    </button>
                  }
                >
                  <dl className="grid grid-cols-3 gap-3 text-center">
                    {[
                      ["Visitas", String(metrics.visits)],
                      ["Tempo lendo", metrics.readingSeconds ? formatDuration(metrics.readingSeconds) : "—"],
                      ["Eventos-chave", String(metrics.keyEvents)],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-cream px-2 py-3">
                        <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">{k}</dt>
                        <dd className="mt-0.5 text-lg font-bold text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {keyActions.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {keyActions.map((a) => (
                        <li key={a.label}>
                          <button type="button" onClick={() => showActivity({ kind: a.kind, label: a.label })} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink hover:bg-cream">
                            <Star size={12} className="shrink-0 fill-gold text-gold" />
                            <span className="min-w-0 flex-1 truncate">{a.label}</span>
                            <b className="text-xs text-ink-muted">{a.n}×</b>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>
            </div>
          )}

          {tab === "propostas" && (
            <section aria-label="Propostas do cliente" className="space-y-5">
              {broker && (
                <div className="flex flex-col gap-3 rounded-2xl bg-cream px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="min-w-0 flex-1 text-sm text-ink-muted">A negociação segue no WhatsApp. Ajuste uma versão e envie ao cliente; a anterior fica no histórico.</p>
                  <button type="button" onClick={() => setEditing({ base: latest })} className={buttonClass("primary")}>
                    {latest ? <PencilLine size={15} /> : <Plus size={15} />} {latest ? "Ajustar a última" : "Registrar proposta"}
                  </button>
                </div>
              )}
              {proposals.length === 0 ? (
                <p className="rounded-2xl bg-cream px-5 py-8 text-center text-sm text-ink-muted">O cliente ainda não enviou proposta pela apresentação.</p>
              ) : (
                proposals.map((p, i) => (
                  <ProposalSheet
                    key={p.id}
                    proposal={p}
                    number={proposals.length - i}
                    baseNumber={numberOf(p.basedOn)}
                    clientName={name}
                    whatsapp={wa}
                    onAdjust={broker ? () => setEditing({ base: p }) : undefined}
                    isSale={l.stage === "fechado" && l.sale_proposal_id === p.id}
                    photo={photo}
                    defaultOpen={i === 0}
                  />
                ))
              )}
            </section>
          )}

          {tab === "atividades" && <Journey events={l.events} filter={filter} onFilter={setFilter} />}
        </div>
      </article>

      {editing && <ProposalEditor leadId={l.id} base={editing.base} onClose={() => setEditing(null)} onSaved={() => setTab("propostas")} />}
      {dialog === "editar" && <EditLeadDialog lead={l} onClose={() => setDialog(null)} />}
      {dialog === "mensagem" && <MessageComposer lead={l} onClose={() => setDialog(null)} />}
    </div>
  );
}
