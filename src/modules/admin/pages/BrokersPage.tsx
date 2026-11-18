import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import type { Broker } from "@/modules/auth/model/auth.types";
import { brokerService, type Agency } from "@/modules/brokers/services/broker.service";
import { formatPhone } from "@/shared/lib/format";
import { Badge, Button, Dialog, EmptyState, Field, Loading, PageHeader } from "@/shared/ui/ui";
import { buttonClass, inputClass } from "@/shared/ui/styles";
import { ResponsiveTable } from "@/shared/ui/ResponsiveTable";
import { Avatar } from "@/shared/ui/visuals";
import { PasswordInput } from "@/shared/ui/PasswordInput";

interface Form {
  first_name: string;
  last_name: string;
  phone: string;
  creci: string;
  email: string;
  password: string;
  agency_id: string;
  active: boolean;
}

const blank: Form = { first_name: "", last_name: "", phone: "", creci: "", email: "", password: "", agency_id: "", active: true };

/**
 * Escolha da imobiliária entre as pré-cadastradas (RN-01.6), em lista por nome. O logo dela só aparece na
 * apresentação do empreendimento. Inativas só aparecem se já forem a do profissional.
 */
function AgencySelect({ agencies, value, onChange }: { agencies: Agency[]; value: string; onChange: (id: string) => void }) {
  const options = agencies.filter((a) => a.active || a.id === value);
  // Agrupadas por cidade (Serra Gaúcha e Porto Alegre); sem cidade informada vão em "Outras".
  const groups = new Map<string, Agency[]>();
  options.forEach((a) => groups.set(a.city || "Outras", [...(groups.get(a.city || "Outras") ?? []), a]));
  const cities = [...groups.keys()].sort((x, y) => (x === "Outras" ? 1 : y === "Outras" ? -1 : x.localeCompare(y, "pt-BR")));
  return (
    <Field id="b-agency" label="Imobiliária" hint="O logo da imobiliária aparece na apresentação do empreendimento." className="sm:col-span-2">
      <select id="b-agency" className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Autônomo (sem imobiliária)</option>
        {cities.map((city) => (
          <optgroup key={city} label={city}>
            {groups
              .get(city)!
              .sort((x, y) => x.name.localeCompare(y.name, "pt-BR"))
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.active ? "" : " (inativa)"}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </Field>
  );
}

/** Profissionais: o admin vê todos, cadastra, edita (inclusive o e-mail de acesso), escolhe a imobiliária e desativa (RN-01.5, RN-01.6, RN-01.9). */
export function BrokersPage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["admin-brokers"], queryFn: brokerService.list });
  const agencies = useQuery({ queryKey: ["admin-agencies"], queryFn: brokerService.agencies });
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(null);

  const save = useMutation({
    mutationFn: ({ id, form }: { id?: string; form: Form }) => {
      const agency_id = form.agency_id || null;
      const profile = { first_name: form.first_name, last_name: form.last_name, phone: form.phone, creci: form.creci };
      return id
        ? brokerService.update(id, { ...profile, email: form.email, agency_id, active: form.active })
        : brokerService.create({ ...profile, email: form.email, password: form.password, agency_id });
    },
    onSuccess: () => {
      toast.success("Profissional salvo");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-brokers"] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const edit = (b: Broker) =>
    setEditing({
      id: b.id,
      form: { first_name: b.first_name, last_name: b.last_name, phone: formatPhone(b.phone), creci: b.creci, email: b.email, password: "", agency_id: b.agency_id ?? "", active: b.active },
    });
  const set = (k: keyof Form) => (e: { target: { value: string } }) => editing && setEditing({ ...editing, form: { ...editing.form, [k]: e.target.value } });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) save.mutate(editing);
  };

  return (
    <>
      <PageHeader
        title="Profissionais"
        subtitle="Corretores que se cadastraram ou foram cadastrados aqui."
        action={
          <Button onClick={() => setEditing({ form: blank })}>
            <Plus size={16} /> Novo profissional
          </Button>
        }
      />
      {list.isPending && <Loading />}
      {list.data?.length === 0 && <EmptyState title="Nenhum profissional cadastrado" text="Corretores que se cadastram pelo site aparecem aqui." />}
      {list.data && list.data.length > 0 && (
        <ResponsiveTable
          label="Profissionais"
          rows={list.data}
          rowKey={(b) => b.id}
          onRowClick={edit}
          columns={[
            {
              key: "nome",
              header: "Nome",
              width: "25%",
              cell: (b) => (
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar name={`${b.first_name} ${b.last_name}`} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">
                      {b.first_name} {b.last_name}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">{b.email}</span>
                  </span>
                </span>
              ),
            },
            { key: "codigo", header: "Código", width: "10%", cell: (b) => <span className="font-mono text-xs">{b.code}</span> },
            { key: "creci", header: "CRECI", width: "10%", cell: (b) => b.creci || "—" },
            { key: "whatsapp", header: "WhatsApp", width: "14%", cell: (b) => formatPhone(b.phone) },
            {
              key: "imobiliaria",
              header: "Imobiliária",
              width: "15%",
              cell: (b) => (b.agency_name ? <span title={b.agency_name}>{b.agency_name}</span> : <span className="text-ink-muted">Autônomo</span>),
            },
            { key: "clientes", header: "Clientes", width: "9%", align: "center", cell: (b) => b.leads_count },
            { key: "situacao", header: "Situação", width: "11%", cell: (b) => (b.active ? <Badge>Ativo</Badge> : <Badge tone="gray">Desativado</Badge>) },
            {
              key: "acoes",
              header: "",
              width: "6%",
              align: "right",
              cell: (b) => (
                <button
                  type="button"
                  aria-label={`Editar ${b.first_name} ${b.last_name}`}
                  title="Editar"
                  onClick={(e) => {
                    e.stopPropagation();
                    edit(b);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-cream-card text-forest transition hover:border-forest"
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
              ),
            },
          ]}
          card={(b) => (
            <button
              type="button"
              aria-label={`Editar ${b.first_name} ${b.last_name}`}
              onClick={() => edit(b)}
              className="card card-hover flex h-full w-full flex-col gap-3 p-4 text-left"
            >
              <span className="flex min-w-0 items-start gap-3">
                <Avatar name={`${b.first_name} ${b.last_name}`} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">
                    {b.first_name} {b.last_name}
                  </span>
                  <span className="block truncate text-xs text-ink-muted">{b.email}</span>
                </span>
                {b.active ? <Badge>Ativo</Badge> : <Badge tone="gray">Desativado</Badge>}
              </span>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <dt className="text-ink-muted">Código</dt>
                <dd className="truncate font-mono">{b.code}</dd>
                <dt className="text-ink-muted">WhatsApp</dt>
                <dd className="truncate">{formatPhone(b.phone)}</dd>
                <dt className="text-ink-muted">Imobiliária</dt>
                <dd className="truncate">{b.agency_name || "Autônomo"}</dd>
                <dt className="text-ink-muted">CRECI · Clientes</dt>
                <dd className="truncate">
                  {b.creci || "—"} · {b.leads_count}
                </dd>
              </dl>
              <span className={buttonClass("outline", "mt-auto self-start px-4 py-1.5 text-xs")} aria-hidden="true">
                <Pencil size={13} /> Editar
              </span>
            </button>
          )}
        />
      )}

      {editing && (
        <Dialog title={editing.id ? "Editar profissional" : "Novo profissional"} onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field id="b-first" label="Nome">
              <input id="b-first" className={inputClass} value={editing.form.first_name} onChange={set("first_name")} required />
            </Field>
            <Field id="b-last" label="Sobrenome">
              <input id="b-last" className={inputClass} value={editing.form.last_name} onChange={set("last_name")} required />
            </Field>
            <Field id="b-phone" label="WhatsApp">
              <input id="b-phone" className={inputClass} value={editing.form.phone} onChange={set("phone")} required />
            </Field>
            <Field id="b-creci" label="CRECI (opcional)">
              <input id="b-creci" className={inputClass} value={editing.form.creci} onChange={set("creci")} />
            </Field>
            <Field id="b-email" label="E-mail" hint={editing.id ? "É o e-mail de acesso: o profissional passa a entrar com o novo." : undefined}>
              <input id="b-email" type="email" className={inputClass} value={editing.form.email} onChange={set("email")} required />
            </Field>
            {!editing.id && (
              <>
                <Field id="b-pass" label="Senha inicial" hint="Pelo menos 8 caracteres. Passe ao profissional por um canal seguro.">
                  <PasswordInput id="b-pass" value={editing.form.password} onChange={set("password")} required minLength={8} autoComplete="new-password" />
                </Field>
              </>
            )}
            <AgencySelect agencies={agencies.data ?? []} value={editing.form.agency_id} onChange={(agency_id) => setEditing({ ...editing, form: { ...editing.form, agency_id } })} />
            {editing.id && (
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={editing.form.active} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, active: e.target.checked } })} />
                Conta ativa (desativada, o corretor perde o acesso e os links dele param de abrir)
              </label>
            )}
            <Button type="submit" disabled={save.isPending} className="sm:col-span-2 sm:justify-self-start">
              Salvar
            </Button>
          </form>
        </Dialog>
      )}
    </>
  );
}
