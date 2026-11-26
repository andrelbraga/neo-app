import type { ApiProposal } from "./lead.types";

export interface Vehicle {
  modelo: string;
  ano: string;
  km: string;
  valor: number;
}

/** Condição em números: a que a apresentação calcula (ADR-0014) ou a do ajuste do corretor (ADR-0015). */
export interface Condition {
  preco: number;
  precoReferencia: number;
  campanha: string;
  validade: string;
  entrada: number;
  entradaParcelas: number;
  parcelas: number;
  parcelaValor: number;
  saldo: number;
  reforcos: number;
  reforcoValor: number;
  chaves: number;
  veiculos: Vehicle[];
  /** Ids das fotos dos veículos que o cliente anexou (RN-03.23). */
  fotos: string[];
  /** Só a apresentação sabe as regras da campanha; no ajuste do corretor fica indefinido. */
  sujeitaAprovacao?: boolean;
}

export interface Proposal {
  id: string;
  author: "cliente" | "corretor";
  basedOn: string | null;
  createdAt: string;
  resumo: string;
  observacao: string;
  pediuContrato: boolean;
  clientName: string;
  clientPhone: string;
  /** Ausente nas propostas enviadas antes de a apresentação mandar os números: aí só há o resumo em texto. */
  condicao?: Condition;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Lê a condição sem confiar no formato: a do cliente vem da página pública. */
export function parseCondition(raw: unknown): Condition | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as Record<string, unknown>;
  if (!num(c.preco)) return undefined;
  return {
    preco: num(c.preco),
    precoReferencia: num(c.preco_referencia),
    campanha: str(c.campanha),
    validade: str(c.validade),
    entrada: num(c.entrada),
    entradaParcelas: Math.max(1, num(c.entrada_parcelas)),
    parcelas: num(c.parcelas),
    parcelaValor: num(c.parcela_valor),
    saldo: num(c.saldo),
    reforcos: num(c.reforcos),
    reforcoValor: num(c.reforco_valor),
    chaves: num(c.chaves),
    veiculos: Array.isArray(c.veiculos)
      ? c.veiculos.map((v) => {
          const o = (v ?? {}) as Record<string, unknown>;
          return { modelo: str(o.modelo), ano: str(o.ano), km: str(o.km), valor: num(o.valor) };
        })
      : [],
    fotos: Array.isArray(c.fotos) ? c.fotos.filter((f): f is string => typeof f === "string" && f !== "") : [],
    sujeitaAprovacao: typeof c.sujeita_aprovacao === "boolean" ? c.sujeita_aprovacao : undefined,
  };
}

/** Propostas do cliente, da mais recente para a mais antiga. */
export function proposalsOf(list: ApiProposal[]): Proposal[] {
  return list
    .map((p) => ({
      id: p.id,
      author: p.author,
      basedOn: p.based_on,
      createdAt: p.created_at,
      resumo: p.summary,
      observacao: p.note,
      pediuContrato: p.wants_contract,
      clientName: p.client_name ?? "",
      clientPhone: p.client_phone ?? "",
      condicao: parseCondition(p.condition),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Recalcula saldo e parcela de uma condição editada, com a mesma conta do simulador da apresentação:
 * saldo = preço − entrada − veículos − reforços − chaves; parcela = saldo ÷ número de parcelas.
 */
export function recompute(c: Condition): Condition {
  const veiculos = c.veiculos.reduce((a, v) => a + v.valor, 0);
  const saldo = c.preco - c.entrada - veiculos - c.reforcos * c.reforcoValor - c.chaves;
  return { ...c, saldo, parcelaValor: saldo > 0 && c.parcelas > 0 ? Math.round((saldo / c.parcelas) * 100) / 100 : 0 };
}

/** Condição no formato da API (o mesmo que a apresentação envia). */
export function toApiCondition(c: Condition): Record<string, unknown> {
  return {
    preco: c.preco,
    preco_referencia: c.precoReferencia,
    campanha: c.campanha,
    validade: c.validade,
    entrada: c.entrada,
    entrada_parcelas: c.entradaParcelas,
    parcelas: c.parcelas,
    parcela_valor: c.parcelaValor,
    saldo: c.saldo,
    reforcos: c.reforcos,
    reforco_valor: c.reforcoValor,
    chaves: c.chaves,
    veiculos: c.veiculos,
    // O ajuste continua mostrando as fotos dos veículos que o cliente mandou.
    fotos: c.fotos,
  };
}

export interface Part {
  key: string;
  label: string;
  detail: string;
  value: number;
}

/** Partes do pagamento com valor, na ordem em que acontecem (a barra e a lista da proposta usam isto). */
export function paymentParts(c: Condition, brl: (v: number, cents?: boolean) => string): Part[] {
  const veiculos = c.veiculos.reduce((a, v) => a + v.valor, 0);
  return [
    { key: "entrada", label: "Entrada", detail: c.entradaParcelas > 1 ? `em ${c.entradaParcelas}x de ${brl(c.entrada / c.entradaParcelas)}` : "na assinatura", value: c.entrada },
    { key: "veiculo", label: c.veiculos.length > 1 ? `${c.veiculos.length} veículos` : "Veículo", detail: "avaliação estimada", value: veiculos },
    { key: "parcelas", label: `${c.parcelas} parcelas mensais`, detail: c.parcelaValor ? `de ${brl(c.parcelaValor, true)}` : "", value: Math.max(0, c.saldo) },
    { key: "reforcos", label: c.reforcos === 1 ? "1 reforço" : `${c.reforcos} reforços`, detail: `de ${brl(c.reforcoValor)}`, value: c.reforcos * c.reforcoValor },
    { key: "chaves", label: "Nas chaves", detail: "na entrega", value: c.chaves },
  ].filter((p) => p.value > 0);
}

/** Texto da condição para o WhatsApp do cliente (ajuste do corretor ou proposta copiada). */
export function conditionText(c: Condition, brl: (v: number, cents?: boolean) => string): string {
  const parts = paymentParts(c, brl).map((p) => `• ${p.label}${p.detail ? ` (${p.detail})` : ""}: ${brl(p.value)}`);
  return [`Valor: ${brl(c.preco)}`, ...parts].join("\n");
}
