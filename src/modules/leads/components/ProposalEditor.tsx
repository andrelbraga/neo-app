import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import { cn } from "@/shared/lib/cn";
import { formatBRL } from "@/shared/lib/format";
import { inputClass } from "@/shared/ui/styles";
import { Button, Dialog, Field } from "@/shared/ui/ui";
import { conditionText, paymentParts, recompute, toApiCondition, type Condition, type Proposal } from "../model/proposal";
import { myLeadService } from "../services/lead.service";

const empty: Condition = {
  preco: 0,
  precoReferencia: 0,
  campanha: "",
  validade: "",
  entrada: 0,
  entradaParcelas: 1,
  parcelas: 36,
  parcelaValor: 0,
  saldo: 0,
  reforcos: 0,
  reforcoValor: 0,
  chaves: 0,
  veiculos: [],
};

/** Campo de valor em reais, digitado como número inteiro (sem centavos, como no simulador). */
function Money({ id, label, value, onChange, hint }: { id: string; label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <Field id={id} label={label} hint={hint}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 mt-0.5 -translate-y-1/2 text-sm text-ink-muted">R$</span>
        <input id={id} type="number" min={0} step="any" inputMode="numeric" value={value || ""} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} className={cn(inputClass, "pl-10")} />
      </div>
    </Field>
  );
}

function Count({ id, label, value, onChange, min = 0, max = 240 }: { id: string; label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <Field id={id} label={label}>
      <input id={id} type="number" min={min} max={max} inputMode="numeric" value={value} onChange={(e) => onChange(Math.min(max, Math.max(min, Math.round(Number(e.target.value) || 0))))} className={inputClass} />
    </Field>
  );
}

/**
 * Ajuste do corretor sobre uma proposta (RN-03.12, ADR-0015). Parte da versão escolhida, recalcula saldo e
 * parcela com a conta do simulador e grava uma nova versão; a anterior continua no histórico.
 */
export function ProposalEditor({ leadId, base, onClose, onSaved }: { leadId: string; base?: Proposal; onClose: () => void; onSaved?: () => void }) {
  const qc = useQueryClient();
  const [c, setC] = useState<Condition>(() => recompute(base?.condicao ?? empty));
  const [note, setNote] = useState("");
  const set = (patch: Partial<Condition>) => setC((old) => recompute({ ...old, ...patch }));
  const parts = paymentParts(c, formatBRL);
  const total = parts.reduce((a, x) => a + x.value, 0) || 1;
  const invalid = c.preco <= 0 || c.saldo < 0 || (c.saldo > 0 && c.parcelas === 0);

  const save = useMutation({
    mutationFn: () => myLeadService.adjust(leadId, { based_on: base?.id, condition: toApiCondition(c), summary: conditionText(c, formatBRL).replace(/\n/g, " · "), note: note.trim() }),
    onSuccess: () => {
      toast.success("Ajuste salvo como nova versão da proposta");
      qc.invalidateQueries({ queryKey: ["lead"] });
      qc.invalidateQueries({ queryKey: ["my-leads"] });
      onSaved?.();
      onClose();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!invalid) save.mutate();
  };

  return (
    <Dialog title={base ? "Ajustar proposta" : "Nova proposta"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm text-ink-muted">
          O ajuste vira uma nova versão: a proposta do cliente continua no histórico. Depois de salvar, envie ao cliente pelo WhatsApp.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Money id="aj-preco" label="Valor da proposta" value={c.preco} onChange={(preco) => set({ preco })} />
          <Money id="aj-entrada" label="Entrada" value={c.entrada} onChange={(entrada) => set({ entrada })} />
          <Count id="aj-entn" label="Entrada em quantas vezes" value={c.entradaParcelas} min={1} max={12} onChange={(entradaParcelas) => set({ entradaParcelas })} />
          <Count id="aj-parc" label="Parcelas mensais do saldo" value={c.parcelas} max={240} onChange={(parcelas) => set({ parcelas })} />
          <Count id="aj-refn" label="Quantidade de reforços" value={c.reforcos} max={20} onChange={(reforcos) => set({ reforcos })} />
          <Money id="aj-refv" label="Valor de cada reforço" value={c.reforcoValor} onChange={(reforcoValor) => set({ reforcoValor })} />
          <Money id="aj-chaves" label="Pagamento nas chaves" value={c.chaves} onChange={(chaves) => set({ chaves })} />
        </div>

        {c.veiculos.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Veículos na negociação</legend>
            {c.veiculos.map((v, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Money
                    id={`aj-vei-${i}`}
                    label={v.modelo || `Veículo ${i + 1}`}
                    value={v.valor}
                    onChange={(valor) => set({ veiculos: c.veiculos.map((x, j) => (j === i ? { ...x, valor } : x)) })}
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Tirar ${v.modelo || `veículo ${i + 1}`} da negociação`}
                  onClick={() => set({ veiculos: c.veiculos.filter((_, j) => j !== i) })}
                  className="mb-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-ink-muted transition hover:border-rose-300 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </fieldset>
        )}

        <Field id="aj-obs" label="Observação para o cliente (opcional)">
          <textarea id="aj-obs" rows={2} maxLength={400} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="ex.: condição válida até sexta" />
        </Field>

        {/* Prévia, com a mesma barra da proposta */}
        <section aria-label="Prévia do ajuste" className="rounded-2xl bg-cream p-4">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-white">
            {parts.map((x) => (
              <span key={x.key} className={cn("h-full", { entrada: "bg-forest", veiculo: "bg-ink-muted", parcelas: "bg-teal", reforcos: "bg-gold", chaves: "bg-coral" }[x.key])} style={{ width: `${(x.value / total) * 100}%` }} />
            ))}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Saldo a parcelar</dt>
              <dd className={cn("font-bold", c.saldo < 0 ? "text-rose-600" : "text-ink")}>{c.saldo < 0 ? `passou ${formatBRL(-c.saldo)} do valor` : formatBRL(c.saldo)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Parcela</dt>
              <dd className="font-bold text-ink">{c.parcelaValor ? `${c.parcelas} × ${formatBRL(c.parcelaValor, true)}` : "—"}</dd>
            </div>
          </dl>
          {invalid && c.preco > 0 && <p className="mt-2 text-xs font-medium text-rose-600">Confira os valores: a soma não pode passar do valor da proposta, e saldo restante precisa de parcelas.</p>}
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={invalid || save.isPending}>
            Salvar ajuste
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
