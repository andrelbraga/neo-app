import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Eye, EyeOff, Monitor, RotateCcw, Search, Smartphone } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import {
  blockOn,
  changesIn,
  isHidden,
  pageFrom,
  samePage,
  setBlock,
  setHidden,
  setText,
  tagLabel,
  textOf,
  type OutlineSection,
  type PageConfig,
} from "@/modules/developments/model/page";
import { developmentService } from "@/modules/developments/services/development.service";
import { presentationSrc, type Layout } from "@/modules/showroom/lib/presentation";
import { cn } from "@/shared/lib/cn";
import { buttonClass, inputClass } from "@/shared/ui/styles";
import { Button, EmptyState, Loading } from "@/shared/ui/ui";

const MSG = "neo-cms";

/** Liga e desliga, como um interruptor. */
function Switch({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full transition", on ? "bg-forest" : "bg-line")}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

/** Uma seção na lista: olho para mostrar ou ocultar e, aberta, os blocos e os textos. */
function SectionItem({
  s,
  draft,
  open,
  onOpen,
  onChange,
  onFocusText,
}: {
  s: OutlineSection;
  draft: PageConfig;
  open: boolean;
  onOpen: () => void;
  onChange: (c: PageConfig) => void;
  onFocusText: (from?: string) => void;
}) {
  const hidden = isHidden(draft, s.key);
  const changes = changesIn(draft, s);
  const [q, setQ] = useState("");
  const texts = s.texts.map((t, i) => ({ ...t, i })).filter((t) => !q || t.text.toLowerCase().includes(q.toLowerCase()));
  return (
    <li className={cn("rounded-2xl border bg-white transition", open ? "border-forest/40 shadow-soft" : "border-line")}>
      <div className="flex items-center gap-2 p-2 pl-3">
        <button type="button" aria-expanded={open} onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left">
          <ChevronDown size={16} className={cn("shrink-0 text-ink-muted transition", open && "rotate-180")} />
          <span className={cn("truncate text-sm font-semibold", hidden ? "text-ink-muted line-through" : "text-ink")}>{s.label}</span>
          {changes > 0 && <span className="shrink-0 rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-gold">{changes}</span>}
        </button>
        <button
          type="button"
          aria-pressed={hidden}
          aria-label={hidden ? `Mostrar ${s.label}` : `Ocultar ${s.label}`}
          title={hidden ? "Mostrar seção" : "Ocultar seção"}
          onClick={() => onChange(setHidden(draft, s.key, !hidden))}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-cream hover:text-forest"
        >
          {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {open && (
        <div className="space-y-4 border-t border-line px-3 pb-4 pt-3">
          {hidden && <p className="rounded-xl bg-cream px-3 py-2 text-xs text-ink-muted">Seção oculta: não aparece para o cliente.</p>}
          {s.blocks.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Blocos</p>
              {s.blocks.map((b) => (
                <div key={b.key} className="flex items-center justify-between gap-3 text-sm text-ink">
                  <span>{b.label}</span>
                  <Switch on={blockOn(draft, b.key)} onChange={(on) => onChange(setBlock(draft, b.key, on))} label={b.label} />
                </div>
              ))}
            </div>
          )}
          {s.texts.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Textos</p>
              {s.texts.length > 8 && (
                <label className="relative block">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <span className="sr-only">Buscar texto em {s.label}</span>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar texto" className={cn(inputClass, "mt-0 py-2 pl-8 text-sm")} />
                </label>
              )}
              {texts.map((t) => {
                const value = textOf(draft, s.key, t.text);
                const changed = value !== t.text;
                const id = `cms-${s.key}-${t.i}`;
                return (
                  <div key={t.i}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <label htmlFor={id} className="text-xs font-semibold text-ink-muted">
                        {tagLabel(t.tag)}
                      </label>
                      {changed && (
                        <button
                          type="button"
                          onClick={() => onChange(setText(draft, s.key, t.text, t.text))}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
                        >
                          <RotateCcw size={12} /> Restaurar
                        </button>
                      )}
                    </div>
                    <textarea
                      id={id}
                      data-from={t.text}
                      rows={t.text.length > 90 ? 4 : t.text.length > 40 ? 2 : 1}
                      className={cn(inputClass, "mt-0 resize-y text-sm", changed && "border-gold")}
                      value={value}
                      onFocus={() => onFocusText(t.text)}
                      onChange={(e) => onChange(setText(draft, s.key, t.text, e.target.value))}
                    />
                    {changed && value.trim() === "" && <p className="mt-1 text-xs text-coral">Vazio: o texto some da página.</p>}
                  </div>
                );
              })}
            </div>
          )}
          {s.texts.length === 0 && s.blocks.length === 0 && <p className="text-xs text-ink-muted">Esta seção só pode ser mostrada ou ocultada.</p>}
        </div>
      )}
    </li>
  );
}

/**
 * Editor da página de apresentação (ADR-0027), no modelo dos editores de tema (Shopify) e do Personalizar do
 * WordPress: seções à esquerda (mostrar ou ocultar, blocos e textos), prévia ao vivo à direita, A ou B e
 * computador ou celular. Nada vai para o cliente até "Publicar". Clicar num texto da prévia abre o campo dele.
 */
export function PageEditorPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const dev = useQuery({ queryKey: ["admin-development", id], queryFn: () => developmentService.get(id) });
  const [saved, setSaved] = useState<PageConfig | null>(null);
  const [draft, setDraft] = useState<PageConfig | null>(null);
  const [outline, setOutline] = useState<OutlineSection[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout>("a");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const frame = useRef<HTMLIFrameElement>(null);
  const draftRef = useRef<PageConfig | null>(null);
  draftRef.current = draft;

  useEffect(() => {
    if (!dev.data || saved) return;
    const c = pageFrom(dev.data.page_config);
    setSaved(c);
    setDraft(c);
    setLayout(dev.data.default_layout ?? "a");
  }, [dev.data, saved]);

  const send = useCallback((msg: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage({ source: MSG, ...msg }, window.location.origin);
  }, []);

  // Mensagens da prévia: o que a página tem para editar e o texto clicado.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.origin !== window.location.origin || e.data?.source !== MSG) return;
      if (e.data.type === "outline") {
        setOutline(e.data.sections as OutlineSection[]);
        if (draftRef.current) send({ type: "config", config: draftRef.current });
      }
      if (e.data.type === "select") {
        setOpenKey(e.data.section);
        setTimeout(() => {
          const field = Array.from(document.querySelectorAll<HTMLTextAreaElement>(`textarea[id^="cms-${e.data.section}-"]`)).find(
            (t) => t.dataset.from === e.data.from,
          );
          field?.scrollIntoView({ behavior: "smooth", block: "center" });
          field?.focus({ preventScroll: true });
        }, 50);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send]);

  // Cada mudança aparece na prévia na hora.
  useEffect(() => {
    if (draft && outline.length) send({ type: "config", config: draft });
  }, [draft, outline.length, send]);

  const dirty = !!draft && !!saved && !samePage(draft, saved);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const publish = useMutation({
    mutationFn: () => developmentService.savePage(id, draft!),
    onSuccess: (d) => {
      const c = pageFrom(d.page_config);
      setSaved(c);
      setDraft(c);
      qc.invalidateQueries({ queryKey: ["admin-development", id] });
      toast.success("Página publicada: o cliente já vê assim.");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const src = useMemo(
    () => (dev.data?.presentation_url ? presentationSrc(dev.data.presentation_url, layout, { cms: "1", slug: dev.data.slug }) : ""),
    [dev.data?.presentation_url, dev.data?.slug, layout],
  );

  if (dev.isPending || (dev.data && !draft)) return <Loading />;
  if (!dev.data)
    return (
      <EmptyState
        title="Empreendimento não encontrado"
        action={
          <Link to="/admin/empreendimentos" className={buttonClass("outline")}>
            Voltar
          </Link>
        }
      />
    );
  if (!dev.data.presentation_url) {
    return (
      <EmptyState
        title="Este empreendimento usa o modelo padrão"
        text="O editor de página vale para empreendimentos com página de apresentação própria. Os textos do modelo padrão ficam no cadastro do empreendimento."
        action={
          <Link to={`/admin/empreendimentos/${id}`} className={buttonClass("outline")}>
            Voltar ao cadastro
          </Link>
        }
      />
    );
  }

  return (
    <div className="-mx-4 -my-2 flex h-[calc(100vh-120px)] flex-col sm:-mx-6 lg:-mx-7">
      <header className="flex flex-wrap items-center gap-3 border-b border-line bg-cream-card px-4 py-3 sm:px-6">
        <Link
          to={`/admin/empreendimentos/${id}`}
          aria-label="Voltar ao cadastro"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-cream hover:text-forest"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Página de apresentação</p>
          <h1 className="truncate font-sans text-lg font-semibold text-ink">{dev.data.name}</h1>
        </div>
        <span role="status" className={cn("text-xs font-semibold", dirty ? "text-gold" : "text-ink-muted")}>
          {dirty ? "Alterações não publicadas" : "Tudo publicado"}
        </span>
        <Button variant="ghost" disabled={!dirty || publish.isPending} onClick={() => setDraft(saved)}>
          Descartar
        </Button>
        <Button disabled={!dirty || publish.isPending} onClick={() => publish.mutate()}>
          {publish.isPending ? "Publicando…" : "Publicar"}
        </Button>
      </header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[400px_minmax(0,1fr)]">
        <aside aria-label="Seções da página" className="min-h-0 overflow-y-auto border-r border-line bg-cream p-4">
          <p className="mb-3 text-xs text-ink-muted">
            Oculte seções no olho, abra uma seção para desligar blocos e trocar textos, ou clique num texto na prévia. As mudanças valem nos layouts A e B.
          </p>
          {outline.length === 0 ? (
            <p className="text-sm text-ink-muted">Lendo a página…</p>
          ) : (
            <ul className="space-y-2">
              {outline.map((s) => (
                <SectionItem
                  key={s.key}
                  s={s}
                  draft={draft!}
                  open={openKey === s.key}
                  onOpen={() => {
                    setOpenKey(openKey === s.key ? null : s.key);
                    if (openKey !== s.key) send({ type: "focus", section: s.key });
                  }}
                  onChange={setDraft}
                  onFocusText={(from) => send({ type: "focus", section: s.key, from })}
                />
              ))}
            </ul>
          )}
        </aside>
        <section aria-label="Prévia" className="flex min-h-0 flex-col bg-line/40">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-4 py-2">
            <div className="inline-flex rounded-full border border-line p-0.5" role="group" aria-label="Layout da prévia">
              {(["a", "b"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={layout === l}
                  onClick={() => {
                    setOutline([]);
                    setLayout(l);
                  }}
                  className={cn("rounded-full px-3 py-1 text-xs font-semibold", layout === l ? "bg-forest text-cream" : "text-ink-muted")}
                >
                  Layout {l.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-full border border-line p-0.5" role="group" aria-label="Tamanho da prévia">
              {(
                [
                  ["desktop", "Computador", Monitor],
                  ["mobile", "Celular", Smartphone],
                ] as const
              ).map(([d, label, Icon]) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={device === d}
                  aria-label={label}
                  title={label}
                  onClick={() => setDevice(d)}
                  className={cn("rounded-full px-3 py-1", device === d ? "bg-forest text-cream" : "text-ink-muted")}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 justify-center overflow-auto p-3">
            <iframe
              key={layout}
              ref={frame}
              title="Prévia da página"
              src={src}
              className={cn("h-full rounded-xl border border-line bg-white shadow-soft", device === "mobile" ? "w-[390px] max-w-full" : "w-full")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
