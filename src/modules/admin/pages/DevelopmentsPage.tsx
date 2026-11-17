import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { statusLabel } from "@/modules/developments/model/development.types";
import { developmentService } from "@/modules/developments/services/development.service";
import { Badge, EmptyState, Loading, PageHeader } from "@/shared/ui/ui";
import { buttonClass } from "@/shared/ui/styles";

export function DevelopmentsPage() {
  const list = useQuery({ queryKey: ["admin-developments"], queryFn: developmentService.list });
  return (
    <>
      <PageHeader
        title="Empreendimentos"
        subtitle="O conteúdo que aparece no showroom. Só os publicados ficam disponíveis para os corretores."
        action={
          <Link to="/admin/empreendimentos/novo" className={buttonClass()}>
            <Plus size={16} /> Novo empreendimento
          </Link>
        }
      />
      {list.isPending && <Loading />}
      {list.data?.length === 0 && <EmptyState title="Nenhum empreendimento cadastrado" />}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.data?.map((d) => (
          <Link key={d.id} to={`/admin/empreendimentos/${d.id}`} className="card overflow-hidden transition hover:border-forest">
            {d.cover_image_url ? <img src={d.cover_image_url} alt="" className="h-36 w-full object-cover" /> : <div className="h-36 bg-forest-soft" />}
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg text-ink">{d.name}</h2>
                {d.published ? <Badge>Publicado</Badge> : <Badge tone="gray">Rascunho</Badge>}
              </div>
              <p className="text-sm text-ink-muted">
                {[d.city, d.state].filter(Boolean).join(" · ")} · {statusLabel[d.status]}
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                {d.developer_name || "Sem incorporadora"} · {d.leads_count} clientes
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
