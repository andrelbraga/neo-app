import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Proposal, Vehicle } from "../model/proposal";
import { ProposalSheet } from "./ProposalSheet";

const car = (v: Partial<Vehicle>): Vehicle => ({ modelo: "", ano: "", km: "", valor: 0, estado: "", fotos: [], ...v });

const proposal = (veiculos: Vehicle[], fotos: string[]): Proposal => ({
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
    saldo: 80000, reforcos: 0, reforcoValor: 0, chaves: 0, veiculos, fotos,
  },
});

describe("ProposalSheet: veículos da proposta (RN-03.23)", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn((b: Blob & { id?: string }) => `blob:${b.id}`), revokeObjectURL: vi.fn() }));
  });
  afterEach(() => vi.unstubAllGlobals());

  const load = vi.fn((id: string) => (id === "x" ? Promise.reject(new Error("x")) : Promise.resolve(Object.assign(new Blob(["img"]), { id }))));

  it("cada veículo com dados, valor, observações e as fotos dele; a foto amplia com anterior e próxima", async () => {
    const user = userEvent.setup();
    const p = proposal(
      [
        car({ modelo: "Corolla", ano: "2022", km: "40000", valor: 90000, estado: "Revisado, sem sinistro", fotos: ["a", "b", "solta-de-outro"] }),
        car({ modelo: "Onix", ano: "2020", valor: 50000, fotos: [] }),
      ],
      ["a", "b", "c"],
    );
    render(<ProposalSheet proposal={p} number={1} clientName="Rodrigo" photo={load} />);
    const section = screen.getByRole("region", { name: "Veículos na negociação" });
    expect(within(section).getByText(/Total estimado/)).toHaveTextContent("Total estimado: R$ 140.000");

    const corolla = within(section).getByRole("listitem", { name: "Veículo 1: Corolla" });
    expect(corolla).toHaveTextContent("ano 2022 · 40.000 km");
    expect(corolla).toHaveTextContent("R$ 90.000");
    expect(corolla).toHaveTextContent("Revisado, sem sinistro");
    expect(await within(corolla).findAllByRole("button", { name: /Ampliar foto/ })).toHaveLength(2);
    expect(within(section).getByRole("listitem", { name: "Veículo 2: Onix" })).toHaveTextContent("Sem fotos deste veículo.");
    // "c" foi enviada sem veículo; "solta-de-outro" não foi ligada à proposta e não aparece.
    expect(within(section).getByText("Outras fotos")).toBeInTheDocument();
    expect(load).not.toHaveBeenCalledWith("solta-de-outro");

    await user.click(within(corolla).getByRole("button", { name: "Ampliar foto 1 de Veículo 1" }));
    const dialog = screen.getByRole("dialog", { name: "Veículo 1 · foto 1 de 2" });
    expect(within(dialog).getByRole("img")).toHaveAttribute("src", "blob:a");
    expect(within(dialog).getByRole("button", { name: /Anterior/ })).toBeDisabled();
    await user.click(within(dialog).getByRole("button", { name: /Próxima/ }));
    expect(screen.getByRole("dialog", { name: "Veículo 1 · foto 2 de 2" })).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByRole("link", { name: "Abrir em tamanho real" })).toHaveAttribute("href", "blob:b");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("com um veículo só, as fotos sem veículo são dele; foto que falha aparece como indisponível", async () => {
    render(<ProposalSheet proposal={proposal([car({ modelo: "Corolla", valor: 90000 })], ["a", "x"])} number={1} clientName="Rodrigo" photo={load} />);
    const corolla = screen.getByRole("listitem", { name: "Veículo 1: Corolla" });
    await waitFor(() => expect(within(corolla).getByText("Foto indisponível")).toBeInTheDocument());
    expect(within(corolla).getByRole("button", { name: "Ampliar foto 1 de Veículo 1" })).toBeInTheDocument();
    expect(screen.queryByText("Outras fotos")).not.toBeInTheDocument();
  });

  it("sem veículos não há a seção; sem o carregador, não pede fotos", () => {
    const { unmount } = render(<ProposalSheet proposal={proposal([], [])} number={1} clientName="Rodrigo" photo={load} />);
    expect(screen.queryByRole("region", { name: "Veículos na negociação" })).not.toBeInTheDocument();
    unmount();
    load.mockClear();
    render(<ProposalSheet proposal={proposal([car({ modelo: "Corolla", fotos: ["a"] })], ["a"])} number={1} clientName="Rodrigo" />);
    expect(screen.getByRole("listitem", { name: "Veículo 1: Corolla" })).toHaveTextContent("Sem fotos deste veículo.");
    expect(load).not.toHaveBeenCalled();
  });
});
