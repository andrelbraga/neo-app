import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import { templateProfileLabel, templateProfiles, toneLabel, type MessageTemplate, type TemplateProfile } from "@/modules/leads/model/lead.types";
import { myLeadService } from "@/modules/leads/services/lead.service";
import { cn } from "@/shared/lib/cn";
import { inputClass } from "@/shared/ui/styles";
import { Badge, Button, PageHeader } from "@/shared/ui/ui";
import { Skeleton } from "@/shared/ui/visuals";

const key = ["message-templates"];

/** Um modelo: o texto do tom, salvar e voltar ao padrão. */
function TemplateCard({ t }: { t: MessageTemplate }) {
  const qc = useQueryClient();
  const [body, setBody] = useState(t.body);
  useEffect(() => setBody(t.body), [t.body]);
  const done = (msg: string) => () => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: key });
  };
  const save = useMutation({
    mutationFn: () => myLeadService.saveTemplate(t.profile, t.tone, body),
    onSuccess: done("Modelo salvo"),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const reset = useMutation({
    mutationFn: () => myLeadService.resetTemplate(t.profile, t.tone),
    onSuccess: done("Modelo de volta ao padrão"),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const id = `t-${t.profile}-${t.tone}`;
  return (
    <section aria-labelledby={`${id}-h`} className="card p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id={`${id}-h`} className="font-sans text-base font-semibold text-ink">
          {toneLabel[t.tone]}
        </h2>
        <Badge tone={t.custom ? "green" : "gray"} pill={false}>
          {t.custom ? "Seu texto" : "Padrão"}
        </Badge>
      </div>
      <label htmlFor={id} className="sr-only">
        Texto {toneLabel[t.tone]} para {templateProfileLabel[t.profile]}
      </label>
      <textarea id={id} rows={7} maxLength={1000} className={inputClass} value={body} onChange={(e) => setBody(e.target.value)} />
      {!body.includes("{link}") && <p className="mt-1 text-xs text-coral">Sem {"{link}"}, a mensagem vai sem a apresentação.</p>}
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {t.custom && (
          <Button variant="ghost" onClick={() => reset.mutate()} disabled={reset.isPending}>
            Voltar ao padrão
          </Button>
        )}
        <Button onClick={() => save.mutate()} disabled={save.isPending || body.trim() === "" || body === t.body}>
          {save.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </section>
  );
}

/**
 * Meus modelos (RN-03.20): os textos das mensagens do WhatsApp por perfil de compra e tom. Começam no padrão;
 * o corretor ajusta e salva os dele. Na ficha, o texto ainda pode ser editado antes de cada envio.
 */
export function MessageTemplatesPage() {
  const templates = useQuery({
    queryKey: key,
    queryFn: myLeadService.templates,
  });
  const [profile, setProfile] = useState<TemplateProfile>("geral");
  return (
    <>
      <PageHeader
        title="Meus modelos"
        subtitle="Textos das mensagens do WhatsApp por perfil do cliente e tom. Use {nome}, {empreendimento}, {link} e {corretor}: a ficha troca pelos dados do cliente."
      />
      <div className="mb-5 inline-flex flex-wrap rounded-full border border-line bg-white p-1" role="tablist" aria-label="Perfil do cliente">
        {templateProfiles.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={profile === p}
            onClick={() => setProfile(p)}
            className={cn("rounded-full px-4 py-1.5 text-sm transition", profile === p ? "bg-forest text-cream" : "text-ink-muted hover:text-forest")}
          >
            {templateProfileLabel[p]}
          </button>
        ))}
      </div>
      {templates.isPending ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {templates.data
            ?.filter((t) => t.profile === profile)
            .map((t) => (
              <TemplateCard key={`${t.profile}-${t.tone}`} t={t} />
            ))}
        </div>
      )}
    </>
  );
}
