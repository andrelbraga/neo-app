import { render, screen, waitFor } from "@testing-library/react";
import type { Proposal } from "../model/proposal";
import { ProposalSheet } from "./ProposalSheet";

const proposal = (fotos: string[]): Proposal => ({
  id: "p1",
  author: "cliente",
  basedOn: null,
  createdAt: "2026-11-25T10:00:00Z",
  resumo: "",
  observacao: "",
  pediuContrato: false,
  clientName: "Rodrigo",
  clientPhone: "54988887777",
  condicao: {
    preco: 370000, precoReferencia: 460000, campanha: "", validade: "", entrada: 150000, entradaParcelas: 1, parcelas: 36, parcelaValor: 0,
    saldo: 130000, reforcos: 0, reforcoValor: 0, chaves: 0, veiculos: [{ modelo: "Corolla", ano: "2022", km: "40000", valor: 90000 }], fotos,
  },
});

describe("ProposalSheet: fotos dos veículos (RN-03.23)", () => {
  beforeEach(() => {
    let n = 0;
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => `blob:foto-${++n}`), revokeObjectURL: vi.fn() }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("carrega as fotos com o login e abre cada uma; a que falha aparece como indisponível", async () => {
    const photo = vi.fn((id: string) => (id === "f2" ? Promise.reject(new Error("x")) : Promise.resolve(new Blob(["img"], { type: "image/jpeg" }))));
    render(<ProposalSheet proposal={proposal(["f1", "f2"])} number={1} clientName="Rodrigo" photo={photo} />);
    expect(screen.getByRole("region", { name: "Fotos dos veículos" })).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: "Foto 1 do veículo" })).toHaveAttribute("src", "blob:foto-1");
    expect(screen.getByRole("link", { name: "Abrir foto 1" })).toHaveAttribute("href", "blob:foto-1");
    await waitFor(() => expect(screen.getByText("Foto indisponível")).toBeInTheDocument());
    expect(photo).toHaveBeenCalledWith("f1");
    expect(photo).toHaveBeenCalledWith("f2");
  });

  it("sem fotos ou sem o carregador, não há a seção", () => {
    const { unmount } = render(<ProposalSheet proposal={proposal([])} number={1} clientName="Rodrigo" photo={vi.fn()} />);
    expect(screen.queryByRole("region", { name: "Fotos dos veículos" })).not.toBeInTheDocument();
    unmount();
    render(<ProposalSheet proposal={proposal(["f1"])} number={1} clientName="Rodrigo" />);
    expect(screen.queryByRole("region", { name: "Fotos dos veículos" })).not.toBeInTheDocument();
  });
});
