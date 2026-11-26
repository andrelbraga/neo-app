import { BadgeCheck, Car, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, FileSignature, KeyRound, MessageCircle, PencilLine, Quote, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/cn";
import { formatBRL, formatDateTime, formatPhone } from "@/shared/lib/format";
import { buttonClass } from "@/shared/ui/styles";
import { Badge, Dialog } from "@/shared/ui/ui";
import { conditionText, formatKm, paymentParts, photosByVehicle, type Condition, type Proposal } from "../model/proposal";

// Cores das partes: as mesmas da linha do tempo de pagamento da apresentação, no tom do painel.
const partColor: Record<string, string> = { entrada: "bg-forest", veiculo: "bg-ink-muted", parcelas: "bg-teal", reforcos: "bg-gold", chaves: "bg-coral" };

interface Props {
  proposal: Proposal;
  number: number;
  /** Número da versão em que o ajuste se baseou. */
  baseNumber?: number;
  clientName: string;
  /** WhatsApp do cliente; recebe o texto da mensagem. Sem ele, não há botão. */
  whatsapp?: (text: string) => string;
  /** Corretor: abre o ajuste a partir desta versão. */
  onAdjust?: () => void;
  /** Esta versão é a base da venda fechada. */
  isSale?: boolean;
  /** Carrega uma foto de veículo com o login (corretor ou admin); sem ele, as fotos não aparecem. */
  photo?: (id: string) => Promise<Blob>;
  /** Acordeão: começa aberta (a mais recente) ou fechada, só com o cabeçalho. */
  defaultOpen?: boolean;
}

/** Carrega as fotos dos veículos com o login (corretor ou admin) e libera os endereços ao sair. */
function usePhotoUrls(ids: string[], load?: (id: string) => Promise<Blob>) {
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const key = ids.join(",");
  useEffect(() => {
    if (!load || !key) return;
    let alive = true;
    const made: string[] = [];
    key.split(",").forEach((id) => {
      load(id)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          made.push(url);
          if (alive) setUrls((u) => ({ ...u, [id]: url }));
        })
        .catch(() => alive && setUrls((u) => ({ ...u, [id]: null })));
    });
    return () => {
      alive = false;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [key, load]);
  return urls;
}

/** Miniaturas que abrem a foto ampliada. */
function Thumbs({ ids, urls, label, onOpen }: { ids: string[]; urls: Record<string, string | null>; label: string; onOpen: (i: number) => void }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {ids.map((id, i) => {
        const url = urls[id];
        return (
          <li key={id} className="h-20 w-20 overflow-hidden rounded-lg bg-cream">
            {url ? (
              <button type="button" onClick={() => onOpen(i)} aria-label={`Ampliar foto ${i + 1} de ${label}`} className="block h-full w-full transition hover:opacity-90">
                <img src={url} alt={`Foto ${i + 1} de ${label}`} className="h-full w-full object-cover" />
              </button>
            ) : (
              <span className="flex h-full items-center justify-center px-2 text-center text-[11px] text-ink-muted">{url === null ? "Foto indisponível" : "Carregando…"}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Foto ampliada, com a anterior e a próxima do mesmo veículo. */
function PhotoViewer({ list, index, label, urls, onClose, onMove }: { list: string[]; index: number; label: string; urls: Record<string, string | null>; onClose: () => void; onMove: (i: number) => void }) {
  const url = urls[list[index]];
  return (
    <Dialog title={`${label} · foto ${index + 1} de ${list.length}`} onClose={onClose}>
      <div className="flex min-h-64 items-center justify-center rounded-xl bg-ink/5">
        {url ? <img src={url} alt={`Foto ${index + 1} de ${label}`} className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain" /> : <p className="text-sm text-ink-muted">Foto indisponível</p>}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button type="button" className={buttonClass("outline")} disabled={index === 0} onClick={() => onMove(index - 1)}>
            <ChevronLeft size={16} /> Anterior
          </button>
          <button type="button" className={buttonClass("outline")} disabled={index >= list.length - 1} onClick={() => onMove(index + 1)}>
            Próxima <ChevronRight size={16} />
          </button>
        </div>
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className={buttonClass("ghost")}>
            Abrir em tamanho real
          </a>
        )}
      </div>
    </Dialog>
  );
}

/**
 * Veículos da proposta (RN-03.23): um cartão por veículo com modelo, ano, km, valor estimado, as observações do
 * cliente e as fotos dele. Fotos sem veículo definido aparecem em "Outras fotos".
 */
function Vehicles({ c, load }: { c: Condition; load?: (id: string) => Promise<Blob> }) {
  const { vehicles, others } = photosByVehicle(c);
  const urls = usePhotoUrls(load ? [...vehicles.flat(), ...others] : [], load);
  const [view, setView] = useState<{ list: string[]; index: number; label: string } | null>(null);
  const total = c.veiculos.reduce((a, v) => a + v.valor, 0);
  if (c.veiculos.length === 0 && others.length === 0) return null;
  return (
    <section aria-label="Veículos na negociação">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Veículos na negociação</h4>
        {c.veiculos.length > 1 && <span className="text-xs text-ink-muted">Total estimado: <b className="text-ink">{formatBRL(total)}</b></span>}
      </div>
      <ul className="grid gap-3">
        {c.veiculos.map((v, i) => {
          const label = `Veículo ${i + 1}`;
          const photos = vehicles[i];
          return (
            <li key={i} aria-label={`${label}: ${v.modelo || "modelo não informado"}`} className="flex flex-col gap-3 rounded-xl bg-cream/60 p-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream-card text-ink-muted">
                  <Car size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <small className="block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">{label}</small>
                  <b className="block break-words text-sm text-ink">{v.modelo || "Modelo não informado"}</b>
                  <small className="block text-xs text-ink-muted">{[v.ano && `ano ${v.ano}`, v.km && `${formatKm(v.km)} km`].filter(Boolean).join(" · ") || "sem ano e km"}</small>
                </span>
                {/* No celular o valor desce para baixo do modelo, que fica inteiro. */}
                <span className="w-full pl-12 sm:w-auto sm:shrink-0 sm:pl-0 sm:text-right">
                  <small className="block text-[10px] uppercase tracking-[0.12em] text-ink-muted">Valor estimado</small>
                  <b className="whitespace-nowrap text-sm text-ink">{formatBRL(v.valor)}</b>
                </span>
              </div>
              {v.estado && (
                <p className="rounded-lg bg-cream-card px-3 py-2 text-sm text-ink">
                  <small className="block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Observações do cliente</small>
                  {v.estado}
                </p>
              )}
              {load && photos.length > 0 ? (
                <Thumbs ids={photos} urls={urls} label={label} onOpen={(index) => setView({ list: photos, index, label })} />
              ) : (
                <small className="text-xs text-ink-muted">Sem fotos deste veículo.</small>
              )}
            </li>
          );
        })}
      </ul>
      {load && others.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Outras fotos</p>
          <Thumbs ids={others} urls={urls} label="outras fotos" onOpen={(index) => setView({ list: others, index, label: "Outras fotos" })} />
        </div>
      )}
      {view && <PhotoViewer {...view} urls={urls} onClose={() => setView(null)} onMove={(index) => setView({ ...view, index })} />}
    </section>
  );
}

/**
 * Proposta formatada como um documento (ADR-0014, ADR-0015): autor, situação, preço, como paga (barra e
 * lista), veículos, observação e o texto original. Ajustes do corretor aparecem como nova versão. Propostas
 * antigas, sem os números, mostram só o texto.
 */
export function ProposalSheet({ proposal: p, number, baseNumber, clientName, whatsapp, onAdjust, isSale, photo, defaultOpen = true }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = `proposta-${p.id}`;
  const c = p.condicao;
  const badges = isSale || p.pediuContrato || c?.sujeitaAprovacao !== undefined;
  const parts = c ? paymentParts(c, formatBRL) : [];
  const total = parts.reduce((a, x) => a + x.value, 0) || 1;
  const fromBroker = p.author === "corretor";
  const firstName = clientName.split(" ")[0];
  const message = c
    ? `Olá, ${firstName}! ${fromBroker ? "Ajustei a sua proposta" : "Sobre a sua proposta"}:\n${conditionText(c, formatBRL)}${p.observacao ? `\n${p.observacao}` : ""}`
    : `Olá, ${firstName}! Recebi a sua proposta. Vamos conversar?`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(c ? `Proposta ${number} de ${clientName} (${formatDateTime(p.createdAt)})\n${conditionText(c, formatBRL)}${p.observacao ? `\nObservação: ${p.observacao}` : ""}` : `Proposta ${number} de ${clientName}: ${p.resumo}`);
      setCopied(true);
      toast.success("Proposta copiada");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <article aria-label={`Proposta ${number}`} className="overflow-hidden rounded-2xl bg-cream-card shadow-soft ring-1 ring-line/70">
      {/* Cabeçalho do documento: é o botão do acordeão; fechado, mostra o valor, quem mandou e quando. */}
      <header className={cn("border-line", open && "border-b")}>
        <h3>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen(!open)}
            className="flex w-full items-center gap-3 px-4 py-4 text-left font-sans transition hover:bg-cream/50 sm:px-6"
          >
            <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", fromBroker ? "bg-forest-soft text-forest" : "bg-coral-soft text-coral")}>
              {fromBroker ? <PencilLine size={18} /> : <FileSignature size={18} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-serif text-lg text-ink">Proposta {number}</span>
                {c && <span className="whitespace-nowrap text-sm font-bold text-forest">{formatBRL(c.preco)}</span>}
              </span>
              <span className="flex items-start gap-1.5 text-xs font-medium text-ink-muted">
                <span className="mt-0.5 shrink-0">{fromBroker ? <PencilLine size={12} /> : <UserRound size={12} />}</span>
                <span className="min-w-0 break-words">
                  {fromBroker ? "Ajuste do corretor" : p.clientName ? `Enviada por ${p.clientName}${p.clientPhone ? ` · ${formatPhone(p.clientPhone)}` : ""}` : "Enviada pelo cliente"}
                  {baseNumber ? ` sobre a proposta ${baseNumber}` : ""} · {formatDateTime(p.createdAt)}
                </span>
              </span>
            </span>
            <ChevronDown size={18} className={cn("shrink-0 text-ink-muted transition", open && "rotate-180")} />
          </button>
        </h3>
        {badges && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3 sm:px-6">
          {isSale && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ok px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-white">
              <BadgeCheck size={13} /> Base da venda
            </span>
          )}
          {p.pediuContrato && <Badge tone="coral">Pediu para seguir ao contrato</Badge>}
          {c?.sujeitaAprovacao !== undefined && (c.sujeitaAprovacao ? <Badge tone="gold">Sujeita à aprovação especial</Badge> : <Badge tone="ok">Dentro das regras da campanha</Badge>)}
        </div>
        )}
      </header>

      <div id={bodyId} hidden={!open} className="space-y-6 px-4 py-5 sm:px-6">
        {c ? (
          <>
            {/* Preço */}
            <div className="grid grid-cols-2 gap-3">
              <Figure label="Valor da proposta" value={formatBRL(c.preco)} strong />
              {c.precoReferencia > c.preco && <Figure label="Valor de referência" value={formatBRL(c.precoReferencia)} strike />}
              {(c.campanha || c.validade) && (
                <div className="col-span-2">
                  <Figure label="Campanha" value={[c.campanha, c.validade && `até ${c.validade}`].filter(Boolean).join(" · ")} />
                </div>
              )}
            </div>

            {/* Como paga */}
            <section aria-label="Como o cliente paga">
              <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Como o cliente paga</h4>
              <div className="flex h-3 overflow-hidden rounded-full bg-cream" role="img" aria-label="Divisão do pagamento">
                {parts.map((x) => (
                  <span key={x.key} className={cn("h-full transition-all duration-700", partColor[x.key])} style={{ width: `${(x.value / total) * 100}%` }} />
                ))}
              </div>
              <ol className="mt-3 divide-y divide-line rounded-xl bg-cream/60">
                {parts.map((x) => (
                  <li key={x.key} className="grid grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                    <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", partColor[x.key])} />
                    <span className="min-w-0">
                      <b className="block text-sm text-ink">{x.label}</b>
                      <small className="block text-xs text-ink-muted">
                        {[x.detail, `${Math.round((x.value / total) * 100)}% do total`].filter(Boolean).join(" · ")}
                      </small>
                    </span>
                    <b className="whitespace-nowrap text-right text-sm text-ink">{formatBRL(x.value)}</b>
                  </li>
                ))}
                <li className="grid grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                  <span />
                  <b className="text-sm text-ink">Total da condição</b>
                  <b className="whitespace-nowrap text-right text-base text-forest">{formatBRL(total)}</b>
                </li>
              </ol>
              {c.saldo < 0 && <p className="mt-2 text-xs font-medium text-gold">A soma passou do valor da proposta em {formatBRL(-c.saldo)}.</p>}
              {c.saldo > 0 && c.parcelas === 0 && <p className="mt-2 text-xs font-medium text-gold">Faltam {formatBRL(c.saldo)} sem forma de pagamento.</p>}
            </section>

            <Vehicles c={c} load={photo} />
          </>
        ) : (
          <p className="flex items-start gap-2 rounded-xl bg-cream/60 px-4 py-3 text-xs text-ink-muted">
            <KeyRound size={14} className="mt-0.5 shrink-0" /> Proposta enviada antes do detalhamento em números: abaixo, o resumo que o cliente montou.
          </p>
        )}

        {p.observacao && (
          <blockquote className="flex gap-3 rounded-xl border-l-4 border-coral bg-coral-soft/40 px-4 py-3">
            <Quote size={16} className="mt-0.5 shrink-0 text-coral" />
            <span>
              <small className="block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">{fromBroker ? "Observação do corretor" : "Observação do cliente"}</small>
              <span className="text-sm italic text-ink">{p.observacao}</span>
            </span>
          </blockquote>
        )}

        {p.resumo && (
          <details className="group rounded-xl bg-cream/60 px-4 py-3" open={!c}>
            <summary className="cursor-pointer text-xs font-semibold text-ink-muted marker:text-ink-muted">{fromBroker ? "Resumo do ajuste" : "Texto enviado pelo cliente"}</summary>
            <p className="mt-2 text-sm text-ink">{p.resumo}</p>
          </details>
        )}

        <div className="flex flex-wrap gap-2">
          {onAdjust && (
            <button type="button" onClick={onAdjust} className={buttonClass("primary")}>
              <PencilLine size={15} /> Ajustar proposta
            </button>
          )}
          {whatsapp && (
            <a href={whatsapp(message)} target="_blank" rel="noreferrer" className={buttonClass("whatsapp")}>
              <MessageCircle size={15} /> {fromBroker ? "Enviar ajuste no WhatsApp" : "Responder no WhatsApp"}
            </a>
          )}
          <button type="button" onClick={copy} className={buttonClass("outline")}>
            {copied ? <Check size={15} /> : <Copy size={15} />} Copiar proposta
          </button>
        </div>
        <p className="text-[11px] text-ink-muted">Simulação sem juros ou correção monetária, sujeita às regras comerciais e à análise da incorporadora.</p>
      </div>
    </article>
  );
}

function Figure({ label, value, strong, strike }: { label: string; value: string; strong?: boolean; strike?: boolean }) {
  return (
    <div className="rounded-xl bg-cream/60 px-4 py-3">
      <small className="block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">{label}</small>
      <b className={cn("mt-1 block", strong ? "whitespace-nowrap text-xl text-ink sm:text-2xl" : "text-sm leading-snug text-ink", strike && "text-ink-muted line-through")}>{value}</b>
    </div>
  );
}
