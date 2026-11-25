import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderPage } from "@/test/render";
import { leadDetailFixture } from "@/test/fixtures";
import { adminLeadService, myLeadService } from "../services/lead.service";
import { LeadDetailPage } from "./LeadDetailPage";

vi.mock("../services/lead.service", () => ({
  myLeadService: { get: vi.fn(), setStage: vi.fn(), adjust: vi.fn(), list: vi.fn() },
  adminLeadService: { get: vi.fn(), list: vi.fn() },
}));

const my = vi.mocked(myLeadService);
const openAsBroker = () => renderPage(<LeadDetailPage mode="corretor" />, { path: "/painel/clientes/:id", route: "/painel/clientes/l1" });

describe("LeadDetailPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    my.get.mockResolvedValue(leadDetailFixture);
    my.list.mockResolvedValue([]);
    vi.mocked(adminLeadService.list).mockResolvedValue([]);
  });

  it("tem as abas Resumo, Propostas e Atividades, sem conversa na página", async () => {
    openAsBroker();
    expect(await screen.findByRole("heading", { name: "Maria" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Resumo", "Propostas2", "Atividades"]);
    expect(screen.queryByLabelText("Responder pelo chat")).not.toBeInTheDocument();
    // Resumo: etapa, última proposta e interesse em números
    expect(screen.queryByRole("button", { name: /Avançar para/ })).not.toBeInTheDocument(); // já está na última etapa em aberto
    expect(screen.getByRole("region", { name: "Etapa da negociação" })).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?370\.000 · entrada de R\$\s?200\.000/)).toBeInTheDocument();
    const interest = screen.getByRole("region", { name: "Interesse" });
    expect(within(interest).getByText("Visitas").nextSibling).toHaveTextContent("2");
    expect(screen.getByRole("link", { name: "Conversar no WhatsApp" }).getAttribute("href")).toContain("wa.me/5554977776666");
  });

  // RN-03.16: o cliente cadastrado pelo corretor recebe o convite com o link próprio dele.
  it("no cliente cadastrado pelo corretor, o WhatsApp leva o convite", async () => {
    my.get.mockResolvedValue({ ...leadDetailFixture, origin: "corretor", invite_code: "abc234" });
    openAsBroker();
    const link = await screen.findByRole("link", { name: "Enviar convite no WhatsApp" });
    expect(decodeURIComponent(link.getAttribute("href")!)).toContain("Olá, Maria! Separei para você o");
    expect(decodeURIComponent(link.getAttribute("href")!)).toContain("?convite=abc234");
    expect(screen.getByText("Cadastrado por você em")).toBeInTheDocument();
  });

  it("mostra as propostas formatadas e permite ajustar e enviar pelo WhatsApp", async () => {
    const user = userEvent.setup();
    my.adjust.mockResolvedValue({ ...leadDetailFixture.proposals[0], id: "p3", author: "corretor", based_on: "p2" });
    openAsBroker();
    await user.click(await screen.findByRole("tab", { name: /Propostas/ }));
    const [nova, antiga] = screen.getAllByRole("article", { name: /^Proposta \d$/ });
    expect(nova).toHaveAccessibleName("Proposta 2");
    expect(within(nova).getByText("Dentro das regras da campanha")).toBeInTheDocument();
    expect(within(nova).getByText("Compass 2022")).toBeInTheDocument();
    expect(within(nova).getByText(/Enviada por Maria · \(54\) 97777-6666/)).toBeInTheDocument();
    expect(within(nova).getByRole("link", { name: "Responder no WhatsApp" }).getAttribute("href")).toContain("wa.me/5554977776666");
    expect(within(antiga).getByText("Pediu para seguir ao contrato")).toBeInTheDocument();
    expect(within(antiga).getByText(/antes do detalhamento em números/)).toBeInTheDocument();

    await user.click(within(nova).getByRole("button", { name: "Ajustar proposta" }));
    const dialog = screen.getByRole("dialog", { name: "Ajustar proposta" });
    const entrada = within(dialog).getByLabelText("Entrada");
    expect(entrada).toHaveValue(200000);
    await user.clear(within(dialog).getByLabelText("Valor da proposta"));
    await user.type(within(dialog).getByLabelText("Valor da proposta"), "360000");
    expect(within(dialog).getByText(/R\$\s?90\.000/)).toBeInTheDocument(); // 360 − 200 − 40 (carro) − 30 (reforços)
    await user.click(within(dialog).getByRole("button", { name: "Salvar ajuste" }));
    await waitFor(() => expect(my.adjust).toHaveBeenCalled());
    const [id, body] = my.adjust.mock.calls[0];
    expect(id).toBe("l1");
    expect(body).toMatchObject({ based_on: "p2", condition: { preco: 360000, entrada: 200000, saldo: 90000, parcelas: 36 } });
  });

  it("avança a etapa com um botão e registra a venda fechada", async () => {
    const user = userEvent.setup();
    my.get.mockResolvedValue({ ...leadDetailFixture, stage: "em_atendimento" });
    my.setStage.mockResolvedValue({ ...leadDetailFixture, stage: "proposta" });
    openAsBroker();
    await user.click(await screen.findByRole("button", { name: /Avançar para Proposta/ }));
    expect(my.setStage).toHaveBeenCalledWith("l1", { stage: "proposta" });

    await user.click(screen.getByRole("button", { name: /Venda fechada/ }));
    const dialog = screen.getByRole("dialog", { name: /Venda fechada · Maria/ });
    expect(within(dialog).getByLabelText("Valor da venda")).toHaveValue(370000);
    await user.click(within(dialog).getByRole("button", { name: "Registrar venda" }));
    expect(my.setStage).toHaveBeenLastCalledWith("l1", { stage: "fechado", sale_value: 370000, proposal_id: "p2", note: "" });
  });

  it("venda fechada mostra o registro e permite reabrir", async () => {
    const user = userEvent.setup();
    my.get.mockResolvedValue({ ...leadDetailFixture, stage: "fechado", sale_value: 365000, sale_proposal_id: "p2", outcome_at: "2026-11-17T12:00:00Z", outcome_note: "assinado" });
    my.setStage.mockResolvedValue(leadDetailFixture);
    openAsBroker();
    expect(await screen.findByText(/Venda fechada · R\$\s?365\.000/)).toBeInTheDocument();
    expect(screen.getByText("assinado")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Reabrir negociação/ }));
    expect(my.setStage).toHaveBeenCalledWith("l1", { stage: "proposta" });
    await user.click(screen.getByRole("tab", { name: /Propostas/ }));
    expect(within(screen.getByRole("article", { name: "Proposta 2" })).getByText("Base da venda")).toBeInTheDocument();
  });

  it("atividades: jornada por visita, tempo por seção e filtro pelas ações", async () => {
    const user = userEvent.setup();
    openAsBroker();
    await user.click(await screen.findByRole("tab", { name: "Atividades" }));
    const journey = screen.getByRole("region", { name: "Jornada do cliente" });
    expect(within(journey).getByText(/Visita 2 ·/)).toBeInTheDocument();
    expect(within(journey).getByText(/Visita 1 ·/)).toBeInTheDocument();
    expect(within(journey).getByText("Tocou em falar pelo WhatsApp")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Onde passou mais tempo" })).toHaveTextContent("a montagem da proposta");

    await user.click(screen.getByRole("button", { name: /^Entrou no tour 3D, 1 vez/ }));
    expect(screen.getByText("Mostrando só:")).toBeInTheDocument();
    expect(within(journey).queryByText("Tocou em falar pelo WhatsApp")).not.toBeInTheDocument();
    expect(within(journey).getAllByText("Entrou no tour 3D")).toHaveLength(2); // aviso do filtro e o evento
    await user.click(screen.getByRole("button", { name: "Mostrar toda a atividade" }));
    expect(within(journey).getByText("Tocou em falar pelo WhatsApp")).toBeInTheDocument();
  });

  it("o ícone de proposta abre a aba de propostas; os outros, a jornada filtrada", async () => {
    const user = userEvent.setup();
    openAsBroker();
    await user.click(await screen.findByRole("button", { name: "Ver na atividade: Enviou proposta" }));
    expect(screen.getByRole("tab", { name: /Propostas/ })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: "Resumo" }));
    await user.click(screen.getByRole("button", { name: "Ver na atividade: Viu o 3D" }));
    expect(screen.getByRole("tab", { name: "Atividades" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Mostrando só:")).toBeInTheDocument();
  });

  it("o admin só lê: vê o dono, sem mudar etapa nem ajustar", async () => {
    const user = userEvent.setup();
    vi.mocked(adminLeadService.get).mockResolvedValue(leadDetailFixture);
    renderPage(<LeadDetailPage mode="admin" />, { path: "/admin/clientes/:id", route: "/admin/clientes/l1" });
    expect(await screen.findByText(/Fabiano Souza · FAB-0427/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Venda fechada/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /Propostas/ }));
    expect(screen.queryByRole("button", { name: "Ajustar proposta" })).not.toBeInTheDocument();
    expect(my.get).not.toHaveBeenCalled();
  });
});
