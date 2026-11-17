import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderPage } from "@/test/render";
import { leadDetailFixture, leadFixture } from "@/test/fixtures";
import { myLeadService } from "../services/lead.service";
import { KanbanBoard } from "./KanbanBoard";

vi.mock("../services/lead.service", () => ({ myLeadService: { get: vi.fn() } }));

const leads = [
  { ...leadFixture, id: "l1", name: "Maria", stage: "novo" as const },
  { ...leadFixture, id: "l2", name: "João", stage: "proposta" as const, new_proposals: 0 },
  { ...leadFixture, id: "l3", name: "Rita", stage: "fechado" as const, new_proposals: 0, sale_value: 360000 },
];

describe("KanbanBoard", () => {
  beforeEach(() => vi.mocked(myLeadService.get).mockResolvedValue(leadDetailFixture));

  it("tem uma coluna por etapa, com os desfechos e o total vendido", () => {
    renderPage(<KanbanBoard leads={leads} basePath="/painel/clientes" onMove={vi.fn()} />);
    expect(within(screen.getByRole("region", { name: "Etapa Novo" })).getByText("Maria")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Etapa Proposta" })).getByText("João")).toBeInTheDocument();
    const sold = screen.getByRole("region", { name: "Etapa Venda fechada" });
    expect(within(sold).getByText("Rita")).toBeInTheDocument();
    expect(within(sold).getByText(/360\.000 vendidos/)).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Etapa Sem venda" })).getByText("Arraste um cliente para cá")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Etapa Novo" })).getByText("1 proposta nova")).toBeInTheDocument();
  });

  it("move ao arrastar para outra coluna", () => {
    const onMove = vi.fn();
    renderPage(<KanbanBoard leads={leads} basePath="/painel/clientes" onMove={onMove} />);
    const card = screen.getByText("Maria").closest("article")!;
    const data = new Map<string, string>();
    const dataTransfer = { setData: (k: string, v: string) => data.set(k, v), getData: (k: string) => data.get(k) ?? "", effectAllowed: "" };
    fireEvent.dragStart(card, { dataTransfer });
    const target = screen.getByRole("region", { name: "Etapa Em atendimento" });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: "l1" }), { stage: "em_atendimento" });

    onMove.mockClear();
    fireEvent.drop(screen.getByRole("region", { name: "Etapa Novo" }), { dataTransfer });
    expect(onMove).not.toHaveBeenCalled();
  });

  it("move pelo menu do cartão (celular e teclado), sem seletor duplicado", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    renderPage(<KanbanBoard leads={leads} basePath="/painel/clientes" onMove={onMove} />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mover João para outra etapa" }));
    const menu = screen.getByRole("menu", { name: "Mover para" });
    expect(within(menu).queryByRole("menuitem", { name: "Proposta" })).not.toBeInTheDocument();
    await user.click(within(menu).getByRole("menuitem", { name: "Em atendimento" }));
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: "l2" }), { stage: "em_atendimento" });
  });

  it("venda fechada pede o registro antes de mover, com o valor da última proposta", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    renderPage(<KanbanBoard leads={leads} basePath="/painel/clientes" onMove={onMove} />);
    await user.click(screen.getByRole("button", { name: "Mover João para outra etapa" }));
    await user.click(screen.getByRole("menuitem", { name: "Venda fechada" }));
    expect(onMove).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog", { name: /Venda fechada · João/ });
    expect(within(dialog).getByLabelText("Valor da venda")).toHaveValue(370000);
    await user.click(within(dialog).getByRole("button", { name: "Registrar venda" }));
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: "l2" }), { stage: "fechado", sale_value: 370000, proposal_id: "p2", note: "" });
  });

  it("é só leitura sem onMove (admin)", () => {
    renderPage(<KanbanBoard leads={leads} basePath="/admin/clientes" showBroker />);
    expect(screen.queryByRole("button", { name: /Mover Maria/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("Nenhum cliente")).toHaveLength(2);
  });
});
