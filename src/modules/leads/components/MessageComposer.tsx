import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { waChat } from "@/shared/lib/whatsapp";
import { buttonClass, inputClass } from "@/shared/ui/styles";
import { Dialog, Field } from "@/shared/ui/ui";
import { leadName, templateProfileLabel, templateProfiles, toneLabel, tones, type Lead, type MessageTone, type TemplateProfile } from "../model/lead.types";
import { fillTemplate, findTemplate, templateProfileOf } from "../model/message";
import { myLeadService } from "../services/lead.service";

/**
 * Mensagem para o cliente no WhatsApp (RN-03.20). Começa no perfil do cliente; o corretor escolhe o tom, pode
 * trocar o perfil desta mensagem e editar o texto antes de abrir o WhatsApp. A edição vale só para este envio;
 * os modelos ficam em "Meus modelos".
 */
export function MessageComposer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const templates = useQuery({
    queryKey: ["message-templates"],
    queryFn: myLeadService.templates,
  });
  const [profile, setProfile] = useState<TemplateProfile>(templateProfileOf(lead));
  const [tone, setTone] = useState<MessageTone>("proximo");
  const [text, setText] = useState("");
  const body = findTemplate(templates.data, profile, tone)?.body;
  useEffect(() => {
    if (body !== undefined) setText(fillTemplate(body, lead));
  }, [body, lead]);

  return (
    <Dialog title={`Mensagem para ${leadName(lead)}`} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Field id="m-profile" label="Perfil do cliente">
          <select id="m-profile" className={inputClass} value={profile} onChange={(e) => setProfile(e.target.value as TemplateProfile)}>
            {templateProfiles.map((p) => (
              <option key={p} value={p}>
                {templateProfileLabel[p]}
              </option>
            ))}
          </select>
        </Field>
        <div className="inline-flex rounded-full border border-line bg-white p-1" role="radiogroup" aria-label="Tom da mensagem">
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
      </div>
      <Field id="m-text" label="Mensagem" hint="O que você mudar aqui vale só para este envio." className="mt-4">
        <textarea
          id="m-text"
          rows={8}
          className={inputClass}
          value={templates.isPending ? "Carregando os modelos…" : text}
          onChange={(e) => setText(e.target.value)}
          disabled={templates.isPending}
        />
      </Field>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/painel/mensagens" className="text-sm font-semibold text-forest hover:underline">
          Editar meus modelos
        </Link>
        {lead.phone ? (
          <a
            href={waChat(lead.phone, text)}
            target="_blank"
            rel="noreferrer"
            className={buttonClass("whatsapp", !text.trim() ? "pointer-events-none opacity-50" : undefined)}
            onClick={onClose}
          >
            <MessageCircle size={16} /> Abrir no WhatsApp
          </a>
        ) : (
          <p className="text-sm text-ink-muted">Este cliente ainda não tem WhatsApp. Edite o cliente para incluir.</p>
        )}
      </div>
    </Dialog>
  );
}
