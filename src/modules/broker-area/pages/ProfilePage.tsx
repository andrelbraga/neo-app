import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import type { Profile } from "@/modules/auth/model/auth.types";
import { authService } from "@/modules/auth/services/auth.service";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { formatPhone } from "@/shared/lib/format";
import { mediaUrl, shrinkImage } from "@/shared/lib/media";
import { Button, Card, Field, PageHeader } from "@/shared/ui/ui";
import { inputClass } from "@/shared/ui/styles";

/** Foto do corretor no cartão "Seu consultor" da apresentação (RN-01.11); sem foto, o cartão mostra as iniciais. */
function PhotoCard() {
  const { user, setUser } = useAuthStore();
  const b = user?.broker;
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  if (!user || !b) return null;
  const initials = [b.first_name, b.last_name].map((n) => n.charAt(0).toUpperCase()).join("");
  const save = (photo_path: string) => setUser({ ...user, broker: { ...b, photo_path } });

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      save((await authService.setPhoto(await shrinkImage(file, 640))).photo_path);
      toast.success("Foto atualizada");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await authService.removePhoto();
      save("");
      toast.success("Foto removida");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-4 flex max-w-xl flex-wrap items-center gap-4">
      {b.photo_path ? (
        <img src={mediaUrl(b.photo_path)} alt="Sua foto" className="h-20 w-20 rounded-full object-cover" />
      ) : (
        <span aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full bg-gold text-2xl font-extrabold text-ink">
          {initials}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-ink">Sua foto</h2>
        <p className="text-sm text-ink-muted">Aparece no seu cartão na apresentação do empreendimento. Sem foto, o cliente vê as suas iniciais.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="hidden" aria-label="Escolher foto" onChange={pick} />
          <Button type="button" disabled={busy} onClick={() => input.current?.click()}>
            {b.photo_path ? "Trocar foto" : "Enviar foto"}
          </Button>
          {b.photo_path && (
            <Button type="button" variant="ghost" disabled={busy} onClick={remove}>
              Remover foto
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Dados que o cliente vê no showroom: nome, WhatsApp, CRECI e foto (RN-01.2, RN-01.11). */
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
      <PhotoCard />
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
