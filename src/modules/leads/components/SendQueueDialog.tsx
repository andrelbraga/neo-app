import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { formatDayMonth } from "@/shared/lib/format";
import { waChat } from "@/shared/lib/whatsapp";
import { buttonClass, inputClass } from "@/shared/ui/styles";
import { Button, Dialog, Field } from "@/shared/ui/ui";
import { leadName, templateProfileLabel, toneLabel, tones, type Lead, type MessageTone } from "../model/lead.types";
import { fillTemplate, findTemplate, templateProfileOf } from "../model/message";
import { myLeadService } from "../services/lead.service";

/**
 * Fila de envio pelo WhatsApp (ADR-0028, RN-03.22). Sem a API do WhatsApp, a plataforma prepara a mensagem de
 * cada cliente (modelo do perfil dele no tom escolhido, com o link próprio) e abre o WhatsApp um por um; o
 * corretor envia lá e confirma aqui. A confirmação fica registrada e tira o cliente de "novo".
 */
export function SendQueueDialog({ leads, onClose }: { leads: Lead[]; onClose: () => void }) {
  const qc = useQueryClient();
  const withPhone = useMemo(() => leads.filter((l) => l.phone), [leads]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tone, setTone] = useState<MessageTone>("proximo");
  const [queue, setQueue] = useState<Lead[] | null>(null);
  const [sent, setSent] = useState(0);

  const close = () => {
    if (sent > 0) void qc.invalidateQueries({ queryKey: ["my-leads"] });
    onClose();
  };

  if (queue) {
    return (
      <Dialog title="Enviar mensagens" onClose={close}>
        <QueueRunner queue={queue} tone={tone} onSent={() => setSent((n) => n + 1)} sent={sent} onDone={close} />
      </Dialog>
    );
  }

  const allOn = withPhone.length > 0 && withPhone.every((l) => selected.has(l.id));
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <Dialog title="Enviar mensagens" onClose={close}>
      <p className="text-sm text-ink-muted">
        Escolha os clientes e o tom. Cada mensagem usa o seu modelo do perfil do cliente, com o link dele, e abre no WhatsApp para você enviar.
      </p>
      <div className="mt-4 inline-flex rounded-full border border-line bg-white p-1" role="radiogroup" aria-label="Tom da mensagem">
        {tones.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tone === t}
            onClick={() => setTone(t)}
            className={cn("rounded-full px-4 py-1.5 text-sm transition", tone === t ? "bg-forest text-cream" : "text-ink-muted hover:text-forest")}
          >
            {toneLabel[t]}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-b border-line pb-2">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={allOn} onChange={() => setSelected(allOn ? new Set() : new Set(withPhone.map((l) => l.id)))} />
          Selecionar todos ({withPhone.length})
        </label>
        {leads.length > withPhone.length && <small className="text-xs text-ink-muted">{leads.length - withPhone.length} sem WhatsApp ficam de fora</small>}
      </div>
      <ul className="max-h-72 divide-y divide-line overflow-y-auto" aria-label="Clientes para enviar">
        {withPhone.map((l) => (
          <li key={l.id}>
            <label className="flex cursor-pointer items-center gap-3 py-2.5">
              <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} aria-label={leadName(l)} />
              <span className="min-w-0 flex-1">
                <b className="block truncate text-sm text-ink">{leadName(l)}</b>
                <span className="block truncate text-xs text-ink-muted">
                  {l.development_name} · {templateProfileLabel[templateProfileOf(l)]}
                </span>
              </span>
              {l.last_message_at && (
                <small className="shrink-0 rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-semibold text-gold">
                  enviado em {formatDayMonth(l.last_message_at)}
                </small>
              )}
            </label>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-ink-muted">
        Muitas mensagens iguais em sequência podem fazer o WhatsApp sinalizar o seu número. Personalize quando puder.
      </p>
      <div className="mt-4 flex justify-end">
        <Button disabled={selected.size === 0} onClick={() => setQueue(withPhone.filter((l) => selected.has(l.id)))}>
          <MessageCircle size={16} /> Começar ({selected.size})
        </Button>
      </div>
    </Dialog>
  );
}

/** Um cliente por vez: mensagem editável, abrir no WhatsApp e confirmar o envio (ou pular). */
function QueueRunner({ queue, tone, sent, onSent, onDone }: { queue: Lead[]; tone: MessageTone; sent: number; onSent: () => void; onDone: () => void }) {
  const templates = useQuery({
    queryKey: ["message-templates"],
    queryFn: myLeadService.templates,
  });
  const [index, setIndex] = useState(0);
  const [opened, setOpened] = useState(false);
  const [text, setText] = useState("");
  const lead = queue[index];
  const profile = lead ? templateProfileOf(lead) : "geral";
  const body = findTemplate(templates.data, profile, tone)?.body;
  useEffect(() => {
    if (lead && body !== undefined) setText(fillTemplate(body, lead));
  }, [body, lead]);

  const next = () => {
    setOpened(false);
    setIndex((i) => i + 1);
  };
  const confirm = useMutation({
    mutationFn: () => myLeadService.messageSent(lead.id, { profile, tone }),
    onSuccess: () => {
      onSent();
      next();
    },
  });

  if (!lead) {
    return (
      <div className="text-center">
        <b className="block text-ink">Fila concluída</b>
        <p className="mt-1 text-sm text-ink-muted">
          {sent === 1 ? "1 mensagem enviada" : `${sent} mensagens enviadas`} de {queue.length}.
        </p>
        <Button className="mt-4" onClick={onDone}>
          Concluir
        </Button>
      </div>
    );
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {index + 1} de {queue.length}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-ink">{leadName(lead)}</h3>
      <p className="text-sm text-ink-muted">
        {lead.development_name} · {templateProfileLabel[profile]} · {toneLabel[tone]}
        {lead.last_message_at && ` · enviado em ${formatDayMonth(lead.last_message_at)}`}
      </p>
      <Field id="q-text" label="Mensagem" hint="O que você mudar aqui vale só para este envio." className="mt-4">
        <textarea
          id="q-text"
          rows={7}
          className={inputClass}
          value={templates.isPending ? "Carregando os modelos…" : text}
          onChange={(e) => setText(e.target.value)}
          disabled={templates.isPending}
        />
      </Field>
      {opened ? (
        <div className="mt-5 rounded-xl border border-line bg-cream p-4" role="group" aria-label="Confirmar envio">
          <b className="block text-sm text-ink">Enviou a mensagem para {leadName(lead)}?</b>
          {confirm.isError && <p className="mt-1 text-sm text-rose-700">Não deu para registrar. Tente de novo.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => confirm.mutate()} disabled={confirm.isPending}>
              Sim, enviei
            </Button>
            <Button variant="ghost" onClick={() => setOpened(false)}>
              Abrir de novo
            </Button>
            <Button variant="ghost" onClick={next}>
              Pular
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={next}>
            Pular
          </Button>
          <a
            href={waChat(lead.phone, text)}
            target="_blank"
            rel="noreferrer"
            className={buttonClass("whatsapp", !text.trim() || templates.isPending ? "pointer-events-none opacity-50" : undefined)}
            onClick={() => setOpened(true)}
          >
            <MessageCircle size={16} /> Abrir no WhatsApp
          </a>
        </div>
      )}
    </>
  );
}
