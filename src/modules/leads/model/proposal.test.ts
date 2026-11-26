import { formatBRL } from "@/shared/lib/format";
import type { ApiProposal } from "./lead.types";
import { conditionText, paymentParts, proposalsOf, recompute, toApiCondition } from "./proposal";

const api = (id: string, condition: Record<string, unknown>, created_at: string, extra: Partial<ApiProposal> = {}): ApiProposal => ({
  id,
  author: "cliente",
  based_on: null,
  condition,
  summary: "",
  note: "",
  wants_contract: false,
  seen_at: null,
  created_at,
  ...extra,
});

describe("proposalsOf", () => {
  it("ordena da mais recente e lê a condição em números", () => {
    const list = proposalsOf([
      api("p1", {}, "2026-11-16T10:00:00Z", { summary: "antiga", wants_contract: true }),
      api("p3", { preco: 360000 }, "2026-11-16T12:00:00Z", { author: "corretor", based_on: "p2" }),
      api("p2", { preco: 370000, entrada: 150000, parcelas: 36, saldo: 190000, entrada_parcelas: 0, veiculos: [{ modelo: "X", valor: "1000" }], sujeita_aprovacao: true }, "2026-11-16T11:00:00Z"),
    ]);
    expect(list.map((p) => p.id)).toEqual(["p3", "p2", "p1"]);
    expect(list[0]).toMatchObject({ author: "corretor", basedOn: "p2" });
    expect(list[0].condicao?.sujeitaAprovacao).toBeUndefined();
    expect(list[2]).toMatchObject({ resumo: "antiga", pediuContrato: true, condicao: undefined });
    expect(list[1].condicao).toMatchObject({ preco: 370000, entrada: 150000, entradaParcelas: 1, sujeitaAprovacao: true, veiculos: [{ modelo: "X", valor: 1000, ano: "" }] });
  });

  it("lê os ids das fotos dos veículos e o ajuste do corretor mantém as fotos (RN-03.23)", () => {
    const [p] = proposalsOf([api("p1", { preco: 1, fotos: ["f1", 7, "", "f2"] }, "2026-11-16T10:00:00Z")]);
    expect(p.condicao?.fotos).toEqual(["f1", "f2"]);
    expect(toApiCondition(p.condicao!).fotos).toEqual(["f1", "f2"]);
    expect(proposalsOf([api("p2", { preco: 1 }, "2026-11-16T10:00:00Z")])[0].condicao?.fotos).toEqual([]);
  });

  it("ignora condição sem preço ou em formato estranho", () => {
    expect(proposalsOf([api("p", { condicao: "x" }, "2026-11-16T10:00:00Z")])[0].condicao).toBeUndefined();
    expect(proposalsOf([api("p", { entrada: 1 }, "2026-11-16T10:00:00Z")])[0].condicao).toBeUndefined();
  });
});

describe("paymentParts e recompute", () => {
  const [p] = proposalsOf([
    api("p", { preco: 370000, entrada: 150000, entrada_parcelas: 3, parcelas: 36, parcela_valor: 3888.89, saldo: 140000, reforcos: 2, reforco_valor: 15000, chaves: 0, veiculos: [{ valor: 50000 }] }, "2026-11-16T10:00:00Z"),
  ]);

  it("lista só as partes com valor, na ordem do pagamento", () => {
    const parts = paymentParts(p.condicao!, formatBRL);
    expect(parts.map((x) => x.key)).toEqual(["entrada", "veiculo", "parcelas", "reforcos"]);
    expect(parts.reduce((a, x) => a + x.value, 0)).toBe(370000);
    expect(parts[0].detail).toMatch(/em 3x de R\$\s?50\.000/);
    expect(parts[2]).toMatchObject({ label: "36 parcelas mensais", value: 140000 });
  });

  it("recalcula saldo e parcela como o simulador da apresentação", () => {
    const c = recompute({ ...p.condicao!, preco: 360000, entrada: 160000 });
    expect(c.saldo).toBe(360000 - 160000 - 50000 - 30000);
    expect(c.parcelaValor).toBe(Math.round((120000 / 36) * 100) / 100);
    expect(recompute({ ...c, parcelas: 0 }).parcelaValor).toBe(0);
    expect(toApiCondition(c)).toMatchObject({ preco: 360000, entrada: 160000, saldo: 120000, reforco_valor: 15000 });
    expect(conditionText(c, formatBRL)).toMatch(/^Valor: R\$\s?360\.000\n• Entrada/);
  });
});
