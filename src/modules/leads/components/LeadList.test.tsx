import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { leadFixture } from "@/test/fixtures";
import { renderPage } from "@/test/render";
import { adminLeadService, myLeadService } from "../services/lead.service";
import { LeadList } from "./LeadList";

vi.mock("../services/lead.service", () => ({
  myLeadService: { list: vi.fn() },
  adminLeadService: { list: vi.fn() },
}));

const joao = { ...leadFixture, id: "l2", name: "João", phone: "51988887777", stage: "proposta" as const, new_proposals: 0, broker_code: "LUC-7850" };

describe("LeadList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(myLeadService.list).mockResolvedValue([{ ...leadFixture, stage: "novo" }, joao]);
    vi.mocked(adminLeadService.list).mockResolvedValue([leadFixture, joao]);
  });

  it("destaca o cliente aberto e mostra as mensagens novas", async () => {
    renderPage(<LeadList mode="corretor" activeId="l2" />);
    await screen.findByText("João");
    const list = screen.getByRole("list", { name: "Clientes" });
    expect(within(list).getByRole("link", { name: /João/ })).toHaveAttribute("aria-current", "page");
    expect(within(list).getByRole("link", { name: /João/ })).toHaveAttribute("href", "/painel/clientes/l2");
    expect(within(list).getByRole("link", { name: /Maria/ })).not.toHaveAttribute("aria-current");
    expect(within(within(list).getByRole("link", { name: /Maria/ })).getByText("1")).toBeInTheDocument();
  });

  it("filtra por etapa e busca por nome ou WhatsApp", async () => {
    const user = userEvent.setup();
    renderPage(<LeadList mode="corretor" />);
    await screen.findByText("João");
    const list = screen.getByRole("list", { name: "Clientes" });
    await user.selectOptions(screen.getByLabelText("Filtrar por etapa"), "proposta");
    expect(within(list).queryByText("Maria")).not.toBeInTheDocument();
    expect(within(list).getByText("João")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filtrar por etapa"), "");
    await user.click(screen.getByRole("button", { name: "Buscar na lista" }));
    await user.type(screen.getByRole("textbox", { name: "Buscar na lista" }), "54977");
    expect(within(list).getByText("Maria")).toBeInTheDocument();
    expect(within(list).queryByText("João")).not.toBeInTheDocument();
  });

  it("no admin aponta para a ficha do admin e mostra o código do corretor", async () => {
    renderPage(<LeadList mode="admin" />);
    await screen.findByText("João");
    const list = screen.getByRole("list", { name: "Clientes" });
    expect(within(list).getByRole("link", { name: /João/ })).toHaveAttribute("href", "/admin/clientes/l2");
    expect(within(list).getByText("LUC-7850")).toBeInTheDocument();
    expect(adminLeadService.list).toHaveBeenCalled();
  });
});
