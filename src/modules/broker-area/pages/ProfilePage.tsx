import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import type { Profile } from "@/modules/auth/model/auth.types";
import { authService } from "@/modules/auth/services/auth.service";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { formatPhone } from "@/shared/lib/format";
import { Button, Card, Field, PageHeader } from "@/shared/ui/ui";
import { inputClass } from "@/shared/ui/styles";

/** Dados que o cliente vê no showroom: nome, WhatsApp e CRECI (RN-01.2). */
export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const b = user?.broker;
  const [form, setForm] = useState<Profile>({
    first_name: b?.first_name ?? "",
    last_name: b?.last_name ?? "",
    phone: b ? formatPhone(b.phone) : "",
    creci: b?.creci ?? "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Profile) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      setUser(await authService.updateProfile(form));
      toast.success("Perfil atualizado");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Meu perfil" subtitle="É assim que o cliente vê você no showroom." />
      <Card className="max-w-xl">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field id="first_name" label="Nome">
            <input id="first_name" className={inputClass} value={form.first_name} onChange={set("first_name")} required />
          </Field>
          <Field id="last_name" label="Sobrenome">
            <input id="last_name" className={inputClass} value={form.last_name} onChange={set("last_name")} required />
          </Field>
          <Field id="phone" label="WhatsApp">
            <input id="phone" className={inputClass} value={form.phone} onChange={set("phone")} required inputMode="tel" />
          </Field>
          <Field id="creci" label="CRECI (opcional)">
            <input id="creci" className={inputClass} value={form.creci} onChange={set("creci")} />
          </Field>
          <p className="text-sm text-ink-muted sm:col-span-2">
            E-mail: {user?.email} · Código do link: {b?.code}
            {b?.agency_name && ` · Imobiliária: ${b.agency_name}`}
          </p>
          <Button type="submit" disabled={busy} className="sm:col-span-2 sm:justify-self-start">
            Salvar
          </Button>
        </form>
      </Card>
    </>
  );
}
