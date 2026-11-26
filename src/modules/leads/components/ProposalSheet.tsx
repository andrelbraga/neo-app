import { BadgeCheck, Car, Check, Copy, FileSignature, KeyRound, MessageCircle, PencilLine, Quote, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/cn";
import { formatBRL, formatDateTime, formatPhone } from "@/shared/lib/format";
import { buttonClass } from "@/shared/ui/styles";
import { Badge } from "@/shared/ui/ui";
import { conditionText, paymentParts, type Proposal } from "../model/proposal";

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
}

/** Fotos dos veículos que o cliente anexou à proposta (RN-03.23); clique abre a foto inteira. */
function VehiclePhotos({ ids, load }: { ids: string[]; load: (id: string) => Promise<Blob> }) {
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const key = ids.join(",");
  useEffect(() => {
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

  return (
    <section aria-label="Fotos dos veículos">
      <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Fotos dos veículos</h4>
      <ul className="flex flex-wrap gap-2">
        {ids.map((id, i) => {
          const url = urls[id];
          return (
            <li key={id} className="h-24 w-24 overflow-hidden rounded-xl bg-cream/60">
              {url ? (
                <a href={url} target="_blank" rel="noreferrer" aria-label={`Abrir foto ${i + 1}`}>
                  <img src={url} alt={`Foto ${i + 1} do veículo`} className="h-full w-full object-cover" />
                </a>
              ) : (
                <span className="flex h-full items-center justify-center px-2 text-center text-[11px] text-ink-muted">{url === null ? "Foto indisponível" : "Carregando…"}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Proposta formatada como um documento (ADR-0014, ADR-0015): autor, situação, preço, como paga (barra e
 * lista), veículos, observação e o texto original. Ajustes do corretor aparecem como nova versão. Propostas
 * antigas, sem os números, mostram só o texto.
 */
export function ProposalSheet({ proposal: p, number, baseNumber, clientName, whatsapp, onAdjust, isSale, photo }: Props) {
  const [copied, setCopied] = useState(false);
  const c = p.condicao;
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
      {/* Cabeçalho do documento */}
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-xl", fromBroker ? "bg-forest-soft text-forest" : "bg-coral-soft text-coral")}>
            {fromBroker ? <PencilLine size={19} /> : <FileSignature size={19} />}
          </span>
          <div>
            <h3 className="text-lg text-ink">Proposta {number}</h3>
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-ink-muted">
              {fromBroker ? <PencilLine size={12} /> : <UserRound size={12} />}
              {fromBroker ? "Ajuste do corretor" : p.clientName ? `Enviada por ${p.clientName}${p.clientPhone ? ` · ${formatPhone(p.clientPhone)}` : ""}` : "Enviada pelo cliente"}
              {baseNumber ? ` sobre a proposta ${baseNumber}` : ""} · {formatDateTime(p.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isSale && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ok px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-white">
              <BadgeCheck size={13} /> Base da venda
            </span>
          )}
          {p.pediuContrato && <Badge tone="coral">Pediu para seguir ao contrato</Badge>}
          {c?.sujeitaAprovacao !== undefined && (c.sujeitaAprovacao ? <Badge tone="gold">Sujeita à aprovação especial</Badge> : <Badge tone="ok">Dentro das regras da campanha</Badge>)}
        </div>
      </header>

      <div className="space-y-6 px-5 py-5 sm:px-6">
        {c ? (
          <>
            {/* Preço */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Figure label="Valor da proposta" value={formatBRL(c.preco)} strong />
              {c.precoReferencia > c.preco && <Figure label="Valor de referência" value={formatBRL(c.precoReferencia)} strike />}
              {(c.campanha || c.validade) && <Figure label="Campanha" value={[c.campanha, c.validade && `até ${c.validade}`].filter(Boolean).join(" · ")} />}
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

            {c.veiculos.length > 0 && (
              <section aria-label="Veículos na negociação">
                <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Veículos na negociação</h4>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {c.veiculos.map((v, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl bg-cream/60 px-4 py-3">
                      <Car size={17} className="shrink-0 text-ink-muted" />
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm text-ink">{v.modelo || "Modelo não informado"}</b>
                        <small className="block text-xs text-ink-muted">{[v.ano && `ano ${v.ano}`, v.km && `${v.km} km`].filter(Boolean).join(" · ") || "sem ano e km"}</small>
                      </span>
                      <b className="whitespace-nowrap text-sm text-ink">{formatBRL(v.valor)}</b>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {c.fotos.length > 0 && photo && <VehiclePhotos ids={c.fotos} load={photo} />}
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
      <b className={cn("mt-1 block", strong ? "truncate text-2xl text-ink" : "text-sm leading-snug text-ink", strike && "text-ink-muted line-through")}>{value}</b>
    </div>
  );
}
