import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileUp, MessageCircle } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import { developmentService } from "@/modules/developments/services/development.service";
import { inviteMessage } from "@/modules/leads/model/invite";
import { importStatusLabel, type ImportReport, type Lead } from "@/modules/leads/model/lead.types";
import { myLeadService } from "@/modules/leads/services/lead.service";
import { cn } from "@/shared/lib/cn";
import { formatPhone } from "@/shared/lib/format";
import { waChat } from "@/shared/lib/whatsapp";
import { buttonClass, inputClass } from "@/shared/ui/styles";
import { Button, Dialog, Field } from "@/shared/ui/ui";

type Mode = "manual" | "planilha";

const template = "nome;telefone\nMaria Souza;(54) 99999-0000\n";

/**
 * Cadastro de clientes pelo corretor (RN-03.16): um a um ou por planilha CSV (nome e telefone). O cliente
 * entra em "novo", e o corretor manda o convite pelo WhatsApp, com o link próprio do cliente.
 */
export function AddClientsDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const developments = useQuery({ queryKey: ["developments", "published"], queryFn: developmentService.published });
  const [developmentId, setDevelopmentId] = useState("");
  const [mode, setMode] = useState<Mode>("manual");
  useEffect(() => {
    if (!developmentId && developments.data?.length) setDevelopmentId(developments.data[0].id);
  }, [developmentId, developments.data]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["my-leads"] });
    qc.invalidateQueries({ queryKey: ["corretor", "summary"] });
  };

  return (
    <Dialog title="Adicionar clientes" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-muted">O cliente entra como novo e fica com você. Depois, mande o convite pelo WhatsApp: o link abre a apresentação já com o nome dele.</p>
      <Field id="c-dev" label="Empreendimento" className="mb-4">
        <select id="c-dev" className={inputClass} value={developmentId} onChange={(e) => setDevelopmentId(e.target.value)} disabled={!developments.data?.length}>
          {developments.data?.length ? (
            developments.data.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))
          ) : (
            <option value="">{developments.isPending ? "Carregando…" : "Nenhum empreendimento publicado"}</option>
          )}
        </select>
      </Field>
      <div className="mb-5 inline-flex rounded-full border border-line bg-white p-1" role="tablist" aria-label="Como adicionar">
        {(
          [
            ["manual", "Um cliente"],
            ["planilha", "Planilha CSV"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={cn("rounded-full px-4 py-1.5 text-sm transition", mode === id ? "bg-forest text-cream" : "text-ink-muted hover:text-forest")}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "manual" ? <ManualForm developmentId={developmentId} onCreated={refresh} /> : <CsvImport developmentId={developmentId} onImported={refresh} onClose={onClose} />}
    </Dialog>
  );
}

function ManualForm({ developmentId, onCreated }: { developmentId: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [created, setCreated] = useState<Lead | null>(null);
  const save = useMutation({
    mutationFn: () => myLeadService.create({ development_id: developmentId, name, phone }),
    onSuccess: (l) => {
      toast.success(`${l.name} cadastrado`);
      setCreated(l);
      setName("");
      setPhone("");
      onCreated();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="c-name" label="Nome do cliente">
          <input id="c-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoComplete="off" />
        </Field>
        <Field id="c-phone" label="WhatsApp com DDD">
          <input id="c-phone" type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(54) 99999-0000" required autoComplete="off" />
        </Field>
      </div>
      {created && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-forest-soft/60 p-4 text-sm text-forest">
          <span className="min-w-0 flex-1">
            <b>{created.name}</b> · {formatPhone(created.phone)} está nos seus clientes.
          </span>
          <a href={waChat(created.phone, inviteMessage(created))} target="_blank" rel="noreferrer" className={buttonClass("whatsapp", "px-4 py-2 text-xs")}>
            <MessageCircle size={14} /> Enviar convite
          </a>
        </div>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={!developmentId || save.isPending}>
          {save.isPending ? "Cadastrando…" : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}

function CsvImport({ developmentId, onImported, onClose }: { developmentId: string; onImported: () => void; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const check = useMutation({
    mutationFn: (f: File) => myLeadService.importCsv(developmentId, f, true),
    onSuccess: setReport,
    onError: (e) => {
      setReport(null);
      toast.error(apiErrorMessage(e));
    },
  });
  const run = useMutation({
    mutationFn: () => myLeadService.importCsv(developmentId, file!, false),
    onSuccess: (r) => {
      toast.success(r.created === 1 ? "1 cliente cadastrado" : `${r.created} clientes cadastrados`);
      onImported();
      onClose();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  // Trocar o empreendimento muda a conferência: o mesmo WhatsApp pode estar livre num e ocupado no outro.
  useEffect(() => {
    if (file && developmentId) check.mutate(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, developmentId]);

  const problems = report?.rows.filter((r) => r.status !== "ok") ?? [];
  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([template], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-clientes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className={buttonClass("outline", "cursor-pointer")}>
          <FileUp size={16} /> {file ? "Trocar planilha" : "Escolher planilha"}
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label="Planilha CSV de clientes"
            onChange={(e) => {
              setReport(null);
              setFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </label>
        <Button variant="ghost" onClick={downloadTemplate}>
          <Download size={15} /> Baixar modelo
        </Button>
      </div>
      <p className="text-xs text-ink-muted">CSV com as colunas nome e telefone (ou WhatsApp), até 500 clientes. Pode salvar direto do Excel ou do Google Planilhas.</p>

      {file && check.isPending && <p className="text-sm text-ink-muted">Conferindo {file.name}…</p>}
      {report && (
        <div className="space-y-3" aria-live="polite">
          <p className="text-sm text-ink">
            <b>{file?.name}</b>: {report.valid} de {report.total} {report.total === 1 ? "linha pronta" : "linhas prontas"} para cadastrar.
          </p>
          {problems.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-2xl border border-line">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Linhas que ficam de fora</caption>
                <thead className="bg-cream text-[11px] uppercase tracking-[0.06em] text-ink-muted">
                  <tr>
                    <th className="px-3 py-2">Linha</th>
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">Fica de fora porque</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((r) => (
                    <tr key={r.line} className="border-t border-line">
                      <td className="px-3 py-2 text-ink-muted">{r.line}</td>
                      <td className="px-3 py-2">
                        {r.name || "—"}
                        <small className="block text-xs text-ink-muted">{r.phone || "sem telefone"}</small>
                      </td>
                      <td className="px-3 py-2">{importStatusLabel[r.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => run.mutate()} disabled={report.valid === 0 || run.isPending}>
              {run.isPending ? "Cadastrando…" : report.valid === 1 ? "Cadastrar 1 cliente" : `Cadastrar ${report.valid} clientes`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
