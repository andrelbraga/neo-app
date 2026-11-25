import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import { formatPhone } from "@/shared/lib/format";
import { inputClass } from "@/shared/ui/styles";
import { Button, Dialog, Field } from "@/shared/ui/ui";
import { profileLabel, profiles, type Lead, type Profile } from "../model/lead.types";
import { myLeadService } from "../services/lead.service";

/**
 * Edição do cliente pelo corretor (RN-03.18): nome, WhatsApp e perfil de compra. O WhatsApp novo não pode já
 * ser cliente no mesmo empreendimento; o nome e o WhatsApp de antes ficam na atividade.
 */
export function EditLeadDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(lead.name);
  const [phone, setPhone] = useState(lead.phone ? formatPhone(lead.phone) : "");
  const [profile, setProfile] = useState<Profile>(lead.profile ?? "");
  const save = useMutation({
    mutationFn: () => myLeadService.update(lead.id, { name, phone, profile }),
    onSuccess: (l) => {
      toast.success(`${l.name} atualizado`);
      qc.invalidateQueries({ queryKey: ["lead"] });
      qc.invalidateQueries({ queryKey: ["my-leads"] });
      onClose();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <Dialog title="Editar cliente" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="e-name" label="Nome do cliente">
            <input id="e-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
          </Field>
          <Field id="e-phone" label="WhatsApp com DDD" hint={lead.phone ? undefined : "Opcional enquanto o cliente não deixar o contato."}>
            <input
              id="e-phone"
              type="tel"
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(54) 99999-0000"
              required={!!lead.phone}
            />
          </Field>
        </div>
        <Field id="e-profile" label="Perfil de compra" hint="Define o texto sugerido nas mensagens do WhatsApp.">
          <select id="e-profile" className={inputClass} value={profile} onChange={(e) => setProfile(e.target.value as Profile)}>
            {profiles.map((p) => (
              <option key={p} value={p}>
                {profileLabel[p]}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
