import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { Box, MapPin, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { API_BASE_URL, apiErrorMessage } from "@/app/providers/api/client";
import { statusLabel, type Image } from "@/modules/developments/model/development.types";
import { formatPhone } from "@/shared/lib/format";
import { waChat } from "@/shared/lib/whatsapp";
import { Button, Field, Loading, Logo } from "@/shared/ui/ui";
import { inputClass, buttonClass } from "@/shared/ui/styles";
import { WhatsAppButton } from "../components/WhatsAppButton";
import { layoutFrom, presentationSrc } from "../lib/presentation";
import { useVisit } from "../hooks/useVisit";
import { showroomService, type Showroom } from "../services/showroom.service";

/** Seção do showroom que avisa uma vez quando metade dela aparece na tela (RN-03.3). */
function Section({ id, onSeen, className, children }: { id: string; onSeen: (id: string) => void; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let seen = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !seen) {
          seen = true;
          onSeen(id);
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id, onSeen]);
  return (
    <section id={id} ref={ref} className={className}>
      {children}
    </section>
  );
}

/** Página que o cliente abre pelo link exclusivo do corretor: /e/:slug/:code. */
export function ShowroomPage() {
  const { slug = "", code = "" } = useParams();
  const [search] = useSearchParams();
  const room = useQuery({ queryKey: ["showroom", slug, code], queryFn: () => showroomService.get(slug, code), retry: false });
  const presentation = room.data?.development.presentation_url;
  // Link de convite do cliente cadastrado pelo corretor (RN-03.16): a visita cai na ficha dele.
  const invite = search.get("convite") ?? "";

  if (presentation) {
    // Página própria do empreendimento (ADR-0008): a ponte dentro dela abre a visita e grava a proposta.
    // Layout do link (`?layout=a|b`) ou, sem ele, o padrão do empreendimento escolhido pelo admin (ADR-0019).
    return (
      <iframe
        title={room.data!.development.name}
        src={presentationSrc(presentation, layoutFrom(search.get("layout") ?? room.data!.development.default_layout ?? null), { slug, code, api: API_BASE_URL, ...(invite ? { convite: invite } : {}) })}
        className="fixed inset-0 h-[100dvh] w-full border-0"
        allow="fullscreen; xr-spatial-tracking; clipboard-write"
      />
    );
  }
  return <TemplateShowroom room={room} slug={slug} code={code} invite={invite} />;
}

/** Modelo padrão do showroom, para empreendimentos sem página própria. */
function TemplateShowroom({ room, slug, code, invite }: { room: UseQueryResult<Showroom>; slug: string; code: string; invite: string }) {
  const { visit, setVisit, track } = useVisit(slug, code, room.isSuccess, invite);
  const [tourOpen, setTourOpen] = useState(false);
  const [photo, setPhoto] = useState<Image | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMsg, setContactMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const seenSections = useRef(new Set<string>());

  // Cada seção conta uma vez por visita; antes da visita abrir, o aviso é ignorado e volta quando ela abre.
  const onSeen = useCallback(
    (id: string) => {
      if (!visit || seenSections.current.has(id)) return;
      seenSections.current.add(id);
      track("secao", { id });
    },
    [visit, track],
  );

  useEffect(() => {
    if (visit?.name) setName(visit.name);
    if (visit?.phone) setPhone(formatPhone(visit.phone));
  }, [visit?.name, visit?.phone]);

  if (room.isPending) return <Loading />;
  if (room.isError || !room.data) {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <Logo />
        <h1 className="mt-8 text-2xl text-forest">Este link não está disponível</h1>
        <p className="mt-2 text-sm text-ink-muted">Peça um novo link ao seu corretor.</p>
      </main>
    );
  }

  const { development: d, broker } = room.data;
  const firstName = broker.name.split(" ")[0];
  const whatsappText = `Olá, ${firstName}! Vi o ${d.name} pelo seu link e quero saber mais.`;

  const sendContact = async (e: FormEvent) => {
    e.preventDefault();
    if (!visit) return;
    try {
      const v = await showroomService.contact(visit.token, name, phone);
      setVisit(v);
      setContactMsg({ ok: true, text: `Pronto! ${firstName} vai falar com você pelo WhatsApp informado.` });
    } catch (err) {
      setContactMsg({ ok: false, text: apiErrorMessage(err) });
    }
  };

  return (
    <div className="pb-24">
      <Section id="hero" onSeen={onSeen} className="relative isolate overflow-hidden bg-forest text-cream">
        {d.cover_image_url && <img src={d.cover_image_url} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />}
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:pb-24">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cream/80">{d.name}</p>
          <h1 className="mt-6 max-w-2xl text-4xl leading-tight sm:text-6xl">{d.headline || d.name}</h1>
          {d.description && <p className="mt-4 max-w-xl text-cream/85">{d.description}</p>}
          <p className="mt-4 flex items-center gap-1.5 text-sm text-cream/80">
            <MapPin size={15} /> {[d.city, d.state].filter(Boolean).join(" · ")} · {statusLabel[d.status]}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {d.tour_url && (
              <a href="#tour" className={buttonClass("primary", "bg-cream text-forest hover:bg-cream/90")}>
                <Box size={16} /> Explorar em 3D
              </a>
            )}
            <a href="#contato" className={buttonClass("outline", "border-cream/40 bg-transparent text-cream hover:border-cream")}>
              Quero saber mais
            </a>
          </div>
        </div>
      </Section>

      <main className="mx-auto max-w-5xl space-y-16 px-4 pt-12">
        {d.highlights.length > 0 && (
          <Section id="destaques" onSeen={onSeen}>
            <h2 className="text-2xl text-forest">Destaques</h2>
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {d.highlights.map((h) => (
                <div key={h.label} className="card p-4">
                  <dt className="text-xs text-ink-muted">{h.label}</dt>
                  <dd className="mt-1 font-serif text-xl font-semibold text-forest">{h.value}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {d.gallery.length > 0 && (
          <Section id="galeria" onSeen={onSeen}>
            <h2 className="text-2xl text-forest">Conheça o lugar</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {d.gallery.map((img) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => {
                    setPhoto(img);
                    track("galeria", { caption: img.caption });
                  }}
                  className="group overflow-hidden rounded-xl border border-line text-left"
                >
                  <img src={img.url} alt={img.caption} loading="lazy" className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.03]" />
                  {img.caption && <span className="block bg-cream-card px-3 py-2 text-xs text-ink-muted">{img.caption}</span>}
                </button>
              ))}
            </div>
          </Section>
        )}

        {d.tour_url && (
          <Section id="tour" onSeen={onSeen}>
            <h2 className="text-2xl text-forest">Maquete em 3D</h2>
            <p className="mt-1 text-sm text-ink-muted">Gire com um dedo, aproxime com dois. Funciona no celular.</p>
            <div className="card mt-5 overflow-hidden">
              {tourOpen ? (
                <iframe title={`Tour 3D do ${d.name}`} src={d.tour_url} className="h-[70vh] min-h-[420px] w-full" allow="fullscreen; xr-spatial-tracking" />
              ) : (
                <div className="flex h-72 flex-col items-center justify-center gap-4 bg-forest-soft p-6 text-center">
                  <Box size={36} className="text-forest" />
                  <Button
                    onClick={() => {
                      setTourOpen(true);
                      track("tour_3d");
                    }}
                  >
                    Abrir a maquete 3D
                  </Button>
                </div>
              )}
            </div>
          </Section>
        )}

        <Section id="contato" onSeen={onSeen} className="grid gap-6 sm:grid-cols-2">
          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Seu corretor</p>
            <h2 className="mt-2 text-2xl text-forest">{broker.name}</h2>
            {broker.creci && <p className="text-sm text-ink-muted">CRECI {broker.creci}</p>}
            <p className="mt-3 text-sm text-ink">Tire suas dúvidas pelo chat desta página ou pelo WhatsApp, como preferir.</p>
            <a href={waChat(broker.phone, whatsappText)} target="_blank" rel="noreferrer" onClick={() => track("whatsapp")} className={buttonClass("whatsapp", "mt-5")}>
              Falar pelo WhatsApp
            </a>
          </div>
          <form onSubmit={sendContact} className="card space-y-4 p-6">
            <h2 className="text-2xl text-forest">Quero que {firstName} me chame</h2>
            <Field id="c-name" label="Seu nome">
              <input id="c-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
            </Field>
            <Field id="c-phone" label="Seu WhatsApp">
              <input id="c-phone" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" placeholder="(54) 99999-0000" />
            </Field>
            {contactMsg && <p className={contactMsg.ok ? "text-sm text-forest" : "text-sm text-rose-700"}>{contactMsg.text}</p>}
            <Button type="submit" disabled={!visit}>
              Enviar
            </Button>
            <p className="text-xs text-ink-muted">
              Seus dados vão só para {firstName}, para ele retornar o contato. Esta página registra o que você abre aqui para ajudar no atendimento.
            </p>
          </form>
        </Section>

        <footer className="flex items-center justify-between border-t border-line pt-6 text-xs text-ink-muted">
          <Logo className="h-8" />
          <span>{d.developer_name && `Incorporação: ${d.developer_name}`}</span>
        </footer>
      </main>

      {photo && (
        <div role="dialog" aria-label={photo.caption || "Foto"} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPhoto(null)}>
          <button type="button" aria-label="Fechar foto" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white">
            <X size={20} />
          </button>
          <img src={photo.url} alt={photo.caption} className="max-h-full max-w-full rounded-xl" />
        </div>
      )}

      <WhatsAppButton broker={broker} text={whatsappText} onClick={() => track("whatsapp")} />
    </div>
  );
}
