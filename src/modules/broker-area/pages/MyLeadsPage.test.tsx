import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { myLeadService } from "@/modules/leads/services/lead.service";
import { leadDetailFixture, leadFixture } from "@/test/fixtures";
import { renderPage } from "@/test/render";
import { MyLeadsPage } from "./MyLeadsPage";

vi.mock("@/modules/leads/services/lead.service", () => ({
  myLeadService: { list: vi.fn(), get: vi.fn(), setStage: vi.fn(), archive: vi.fn(), restore: vi.fn(), update: vi.fn(), templates: vi.fn(), messageSent: vi.fn() },
}));

const my = vi.mocked(myLeadService);
const open = (route = "/painel/clientes") => renderPage(<MyLeadsPage />, { path: "/painel/clientes", route });
const menuOf = async (user: ReturnType<typeof userEvent.setup>) => {
  const table = await screen.findByRole("table", { name: "Clientes" });
  await user.click(within(table).getByRole("button", { name: "Ações de Maria" }));
  return screen.getByRole("menu");
};

describe("MyLeadsPage (ADR-0025)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    my.list.mockResolvedValue([leadFixture]);
  });

  it("mostra só a lista, sem o quadro de arrastar", async () => {
    open();
    expect(await screen.findByRole("table", { name: "Clientes" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Etapa / })).not.toBeInTheDocument();
    expect(my.list).toHaveBeenCalledWith({});
  });

  // A célula da tabela corta o que passa da borda: o menu abre fora dela, preso ao botão.
  it("abre o menu fora da tabela, com posição fixa, e fecha ao rolar a página", async () => {
    const user = userEvent.setup();
    open();
    const menu = await menuOf(user);
    expect(screen.getByRole("table", { name: "Clientes" })).not.toContainElement(menu);
    expect(menu.style.position).toBe("fixed");
    fireEvent.scroll(window);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("o menu ⋮ move de etapa sem abrir a ficha", async () => {
    const user = userEvent.setup();
    my.setStage.mockResolvedValue({ ...leadFixture, stage: "em_atendimento" });
    open();
    const menu = await menuOf(user);
    expect(within(menu).getAllByRole("menuitem").map((i) => i.textContent)).toEqual([
      "Abrir ficha",
      "Editar",
      "Mensagem no WhatsApp",
      "Novo",
      "Em atendimento",
      "Venda fechada",
      "Sem venda",
      "Arquivar",
    ]);
    await user.click(within(menu).getByRole("menuitem", { name: "Em atendimento" }));
    await waitFor(() => expect(my.setStage).toHaveBeenCalledWith("l1", { stage: "em_atendimento" }));
    expect(screen.queryByText("outra rota")).not.toBeInTheDocument();
  });

  it("desfecho pelo menu pede o registro antes de mover", async () => {
    const user = userEvent.setup();
    my.get.mockResolvedValue(leadDetailFixture);
    open();
    await user.click(within(await menuOf(user)).getByRole("menuitem", { name: "Sem venda" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(my.setStage).not.toHaveBeenCalled();
  });

  it("arquiva pelo menu e lista os arquivados com Restaurar", async () => {
    const user = userEvent.setup();
    my.archive.mockResolvedValue({ ...leadFixture, archived_at: "2026-11-24T10:00:00Z" });
    open();
    await user.click(within(await menuOf(user)).getByRole("menuitem", { name: "Arquivar" }));
    await waitFor(() => expect(my.archive).toHaveBeenCalledWith("l1"));

    my.list.mockResolvedValue([{ ...leadFixture, archived_at: "2026-11-24T10:00:00Z" }]);
    await user.click(screen.getByRole("button", { name: "Arquivados" }));
    await waitFor(() => expect(my.list).toHaveBeenLastCalledWith({ arquivados: "1" }));
    const menu = await menuOf(user);
    expect(within(menu).queryByText("Mover para")).not.toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Restaurar" })).toBeInTheDocument();
  });

  it("arquivados vazio explica que nada se perde", async () => {
    my.list.mockResolvedValue([]);
    open("/painel/clientes?ver=arquivados");
    expect(await screen.findByText("Nenhum cliente arquivado")).toBeInTheDocument();
  });

  // ADR-0028: a fila de envio parte da lista de ativos, com a busca aplicada.
  it("Enviar mensagens abre a fila com os clientes da lista", async () => {
    const user = userEvent.setup();
    my.templates.mockResolvedValue([]);
    open();
    await user.click(await screen.findByRole("button", { name: "Enviar mensagens" }));
    const dialog = screen.getByRole("dialog", { name: "Enviar mensagens" });
    expect(within(dialog).getByLabelText("Maria")).toBeInTheDocument();
  });

  it("arquivados não têm fila de envio", async () => {
    open("/painel/clientes?ver=arquivados");
    await screen.findByRole("table", { name: "Clientes" });
    expect(screen.queryByRole("button", { name: "Enviar mensagens" })).not.toBeInTheDocument();
  });
});
