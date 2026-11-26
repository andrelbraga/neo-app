import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderPage } from "@/test/render";
import { brokerFixture } from "@/test/fixtures";
import { brokerService } from "@/modules/brokers/services/broker.service";
import { BrokersPage } from "./BrokersPage";

vi.mock("@/modules/brokers/services/broker.service", () => ({
  brokerService: { list: vi.fn(), agencies: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

const svc = vi.mocked(brokerService);
const omni = { id: "a1", name: "Omni", logo_url: "/logos/imobiliaria-omni.png", city: "", active: true };

describe("BrokersPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    svc.agencies.mockResolvedValue([
      omni,
      { id: "a2", name: "Antiga", logo_url: "", city: "Gramado", active: false },
      { id: "a3", name: "Foxter Cia. Imobiliária", logo_url: "", city: "Porto Alegre", active: true },
      { id: "a4", name: "Serra & Lar", logo_url: "", city: "Canela", active: true },
    ]);
  });

  it("cria o profissional escolhendo uma imobiliária pré-cadastrada", async () => {
    const user = userEvent.setup();
    svc.list.mockResolvedValue([]);
    svc.create.mockResolvedValue(brokerFixture);
    renderPage(<BrokersPage />);

    await user.click(await screen.findByRole("button", { name: /Novo profissional/ }));
    const select = screen.getByLabelText("Imobiliária");
    expect(select).toHaveValue("");
    expect(screen.queryByRole("option", { name: /Antiga/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    await screen.findByRole("option", { name: "Omni" });
    const groups = screen.getAllByRole("group").map((g) => g.getAttribute("label"));
    expect(groups).toEqual(["Canela", "Porto Alegre", "Outras"]);
    await user.selectOptions(select, "a1");

    await user.type(screen.getByLabelText("Nome"), "Ana");
    await user.type(screen.getByLabelText("Sobrenome"), "Lima");
    await user.type(screen.getByLabelText("WhatsApp"), "54999990000");
    await user.type(screen.getByLabelText("E-mail"), "ana@x.com");
    await user.type(screen.getByLabelText("Senha inicial"), "senha-longa");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(svc.create).toHaveBeenCalledWith(expect.objectContaining({ first_name: "Ana", agency_id: "a1" }));
  });

  it("mostra a imobiliária por nome na lista e mantém a inativa já escolhida", async () => {
    const user = userEvent.setup();
    svc.list.mockResolvedValue([
      { ...brokerFixture, agency_id: "a1", agency_name: "Omni", agency_logo_url: omni.logo_url },
      { ...brokerFixture, id: "b2", first_name: "Rui", agency_id: "a2", agency_name: "Antiga" },
    ]);
    svc.update.mockResolvedValue(brokerFixture);
    renderPage(<BrokersPage />);

    const table = await screen.findByRole("table", { name: "Profissionais" });
    expect(within(table).getByText("Omni")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const cards = screen.getByRole("list", { name: "Profissionais" });
    expect(within(cards).getAllByRole("listitem")).toHaveLength(2);
    // A linha inteira da tabela abre a edição.
    await user.click(within(table).getByText("Rui Souza").closest('[role="row"]')!);
    expect(await screen.findByRole("option", { name: "Antiga (inativa)" })).toBeInTheDocument();
    expect(screen.getByLabelText("Imobiliária")).toHaveValue("a2");
    await user.selectOptions(screen.getByLabelText("Imobiliária"), "");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(svc.update).toHaveBeenCalledWith("b2", expect.objectContaining({ agency_id: null }));
  });

  it("tem botão Editar visível e troca o e-mail de acesso", async () => {
    const user = userEvent.setup();
    svc.list.mockResolvedValue([brokerFixture]);
    svc.update.mockResolvedValue(brokerFixture);
    renderPage(<BrokersPage />);

    const table = await screen.findByRole("table", { name: "Profissionais" });
    const name = `${brokerFixture.first_name} ${brokerFixture.last_name}`;
    await user.click(within(table).getByRole("button", { name: `Editar ${name}` }));
    expect(screen.getByRole("dialog", { name: "Editar profissional" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Senha inicial")).not.toBeInTheDocument();
    const email = screen.getByLabelText("E-mail");
    expect(email).toHaveValue(brokerFixture.email);
    await user.clear(email);
    await user.type(email, "novo@x.com");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(svc.update).toHaveBeenCalledWith(brokerFixture.id, expect.objectContaining({ email: "novo@x.com" }));
    // Nos cartões (celular), cada profissional também tem o Editar.
    const cards = screen.getByRole("list", { name: "Profissionais" });
    expect(within(cards).getByRole("button", { name: `Editar ${name}` })).toBeInTheDocument();
  });
});
