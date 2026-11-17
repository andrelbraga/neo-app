import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import { statusLabel, type DevelopmentRequest, type DevelopmentStatus } from "@/modules/developments/model/development.types";
import { developmentService } from "@/modules/developments/services/development.service";
import { Button, Card, Field, Loading, PageHeader } from "@/shared/ui/ui";
import { inputClass } from "@/shared/ui/styles";

const blank: DevelopmentRequest = {
  slug: "",
  name: "",
  developer_id: null,
  city: "",
  state: "",
  status: "lancamento",
  published: false,
  headline: "",
  description: "",
  cover_image_url: "",
  tour_url: "",
  presentation_url: "",
  gallery: [],
  highlights: [],
};

/** Cadastro do empreendimento no admin: textos, imagens, tour 3D e destaques que o showroom mostra. */
export function DevelopmentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const existing = useQuery({ queryKey: ["admin-development", id], queryFn: () => developmentService.get(id!), enabled: Boolean(id) });
  const [form, setForm] = useState<DevelopmentRequest>(blank);

  useEffect(() => {
    const d = existing.data;
    if (d) {
      setForm({
        slug: d.slug,
        name: d.name,
        developer_id: d.developer_id,
        city: d.city,
        state: d.state,
        status: d.status,
        published: d.published,
        headline: d.headline,
        description: d.description,
        cover_image_url: d.cover_image_url,
        tour_url: d.tour_url,
        presentation_url: d.presentation_url,
        gallery: d.gallery,
        highlights: d.highlights,
      });
    }
  }, [existing.data]);

  const save = useMutation({
    mutationFn: (r: DevelopmentRequest) => (id ? developmentService.update(id, r) : developmentService.create(r)),
    onSuccess: (d) => {
      toast.success("Empreendimento salvo");
      qc.invalidateQueries({ queryKey: ["admin-developments"] });
      qc.invalidateQueries({ queryKey: ["admin-development", d.id] });
      if (!id) navigate(`/admin/empreendimentos/${d.id}`, { replace: true });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (id && existing.isPending) return <Loading />;

  const set = (k: keyof DevelopmentRequest) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(form);
  };

  return (
    <>
      <Link to="/admin/empreendimentos" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-forest">
        <ArrowLeft size={15} /> Empreendimentos
      </Link>
      <PageHeader title={id ? form.name || "Empreendimento" : "Novo empreendimento"} />
      <form onSubmit={submit} className="space-y-4">
        <Card className="grid gap-4 sm:grid-cols-2">
          <Field id="d-name" label="Nome">
            <input id="d-name" className={inputClass} value={form.name} onChange={set("name")} required />
          </Field>
          <Field id="d-slug" label="Endereço (slug)" hint="Vazio: gerado a partir do nome. Mudar quebra links já enviados.">
            <input id="d-slug" className={inputClass} value={form.slug} onChange={set("slug")} placeholder="boa-vista-residencial" />
          </Field>
          <Field id="d-status" label="Situação">
            <select id="d-status" className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DevelopmentStatus })}>
              {Object.entries(statusLabel).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field id="d-city" label="Cidade">
            <input id="d-city" className={inputClass} value={form.city} onChange={set("city")} />
          </Field>
          <Field id="d-state" label="UF">
            <input id="d-state" className={inputClass} value={form.state} onChange={set("state")} maxLength={2} />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Publicado (corretores podem gerar o link e o showroom abre para clientes)
          </label>
        </Card>

        <Card className="grid gap-4">
          <h2 className="text-xl text-ink">Showroom</h2>
          <Field id="d-headline" label="Título da página">
            <input id="d-headline" className={inputClass} value={form.headline} onChange={set("headline")} />
          </Field>
          <Field id="d-desc" label="Descrição">
            <textarea id="d-desc" rows={3} className={inputClass} value={form.description} onChange={set("description")} />
          </Field>
          <Field id="d-cover" label="Imagem de capa" hint="https:// ou caminho do próprio app, como /showroom/boa-vista/img/hero.jpg">
            <input id="d-cover" className={inputClass} value={form.cover_image_url} onChange={set("cover_image_url")} />
          </Field>
          <Field id="d-tour" label="Tour 3D" hint="Página da maquete 3D, aberta dentro do showroom.">
            <input id="d-tour" className={inputClass} value={form.tour_url} onChange={set("tour_url")} />
          </Field>
          <Field
            id="d-presentation"
            label="Página de apresentação própria (opcional)"
            hint="Caminho de uma página HTML do próprio app, como /showroom/boa-vista/index.html. Preenchida, ela substitui o modelo padrão do showroom."
          >
            <input id="d-presentation" className={inputClass} value={form.presentation_url} onChange={set("presentation_url")} />
          </Field>
        </Card>

        <ListEditor
          title="Destaques"
          items={form.highlights}
          fields={[
            { key: "label", label: "Nome", placeholder: "Área privativa" },
            { key: "value", label: "Valor", placeholder: "54 m²" },
          ]}
          empty={{ label: "", value: "" }}
          onChange={(highlights) => setForm({ ...form, highlights })}
        />
        <ListEditor
          title="Galeria"
          items={form.gallery}
          fields={[
            { key: "url", label: "Imagem", placeholder: "/showroom/boa-vista/img/fachada.jpg" },
            { key: "caption", label: "Legenda", placeholder: "Fachada" },
          ]}
          empty={{ url: "", caption: "" }}
          onChange={(gallery) => setForm({ ...form, gallery })}
        />

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={save.isPending}>
            Salvar
          </Button>
          {id && form.published && (
            <span className="self-center text-sm text-ink-muted">
              Endereço do showroom: /e/{form.slug}/CÓDIGO-DO-CORRETOR
            </span>
          )}
        </div>
      </form>
    </>
  );
}

interface ListEditorProps<T extends Record<string, string>> {
  title: string;
  items: T[];
  fields: { key: keyof T & string; label: string; placeholder: string }[];
  empty: T;
  onChange: (items: T[]) => void;
}

/** Lista editável de pares (destaques e galeria). */
function ListEditor<T extends Record<string, string>>({ title, items, fields, empty, onChange }: ListEditorProps<T>) {
  const update = (i: number, key: keyof T, value: string) => onChange(items.map((it, j) => (j === i ? { ...it, [key]: value } : it)));
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl text-ink">{title}</h2>
        <Button variant="outline" onClick={() => onChange([...items, { ...empty }])}>
          <Plus size={15} /> Adicionar
        </Button>
      </div>
      {items.length === 0 && <p className="text-sm text-ink-muted">Nenhum item.</p>}
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-line/70 p-2 sm:grid-cols-[1fr_1fr_auto] sm:border-0 sm:p-0">
            {fields.map((f) => (
              <input
                key={f.key}
                aria-label={`${f.label} ${i + 1}`}
                placeholder={f.placeholder}
                className={inputClass.replace("mt-1.5 ", "")}
                value={it[f.key]}
                onChange={(e) => update(i, f.key, e.target.value)}
                required
              />
            ))}
            <button type="button" aria-label={`Remover ${title.toLowerCase()} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))} className="justify-self-end rounded-xl p-2 text-ink-muted hover:text-rose-700">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
