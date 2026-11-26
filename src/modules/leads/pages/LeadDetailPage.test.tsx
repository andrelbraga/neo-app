import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderPage } from "@/test/render";
import { leadDetailFixture } from "@/test/fixtures";
import { adminLeadService, myLeadService } from "../services/lead.service";
import { LeadDetailPage } from "./LeadDetailPage";

vi.mock("../services/lead.service", () => ({
  myLeadService: { get: vi.fn(), setStage: vi.fn(), adjust: vi.fn(), list: vi.fn(), templates: vi.fn(), update: vi.fn(), archive: vi.fn(), restore: vi.fn(), messageSent: vi.fn() },
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
    expect(screen.getAllByRole("button", { name: "Mensagem no WhatsApp" }).length).toBeGreaterThan(0);
  });

  // RN-03.20: a mensagem começa no perfil do cliente; o corretor escolhe o tom e edita antes de abrir o WhatsApp.
  it("monta a mensagem pelo perfil e tom, editável, com o convite do cliente cadastrado", async () => {
    const user = userEvent.setup();
    my.get.mockResolvedValue({ ...leadDetailFixture, origin: "corretor", invite_code: "abc234", profile: "investimento" });
    my.templates.mockResolvedValue([
      { profile: "investimento", tone: "proximo", body: "Oi, {nome}! {link}", custom: false },
      { profile: "investimento", tone: "direto", body: "{nome}, invista: {link}", custom: true },
      { profile: "geral", tone: "direto", body: "Geral {nome}", custom: false },
    ]);
    openAsBroker();
    expect(await screen.findByText("Investimento")).toBeInTheDocument();
    expect(screen.getByText("Cadastrado por você em")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Mensagem no WhatsApp" })[0]);
    const dialog = screen.getByRole("dialog", { name: "Mensagem para Maria" });
    const text = within(dialog).getByLabelText("Mensagem");
    await waitFor(() => expect(text).toHaveValue(`Oi, Maria! ${window.location.origin}/e/boa-vista-residencial/FAB-0427?convite=abc234`));
    await user.click(within(dialog).getByRole("radio", { name: "Direto" }));
    expect(text).toHaveValue(`Maria, invista: ${window.location.origin}/e/boa-vista-residencial/FAB-0427?convite=abc234`);
    await user.selectOptions(within(dialog).getByLabelText("Perfil do cliente"), "geral");
    expect(text).toHaveValue("Geral Maria");
    await user.clear(text);
    await user.type(text, "Texto meu");
    expect(decodeURIComponent(within(dialog).getByRole("link", { name: "Abrir no WhatsApp" }).getAttribute("href")!)).toBe("https://wa.me/5554977776666?text=Texto meu");

    // RN-03.22: depois de abrir o WhatsApp, o corretor confirma o envio, que fica registrado.
    my.messageSent.mockResolvedValue(leadDetailFixture);
    await user.click(within(dialog).getByRole("link", { name: "Abrir no WhatsApp" }));
    await user.click(within(dialog).getByRole("button", { name: "Sim, enviei" }));
    await waitFor(() => expect(my.messageSent).toHaveBeenCalledWith("l1", { profile: "geral", tone: "direto" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Mensagem para Maria" })).not.toBeInTheDocument());
  });

  // RN-03.18 e RN-03.19: editar e arquivar pela ficha.
  it("edita nome, WhatsApp e perfil e arquiva o cliente", async () => {
    const user = userEvent.setup();
    my.update.mockResolvedValue({ ...leadDetailFixture, name: "Maria Souza" });
    my.archive.mockResolvedValue({ ...leadDetailFixture, archived_at: "2026-11-24T10:00:00Z" });
    openAsBroker();
    await user.click(await screen.findByRole("button", { name: "Editar cliente" }));
    const dialog = screen.getByRole("dialog", { name: "Editar cliente" });
    await user.clear(within(dialog).getByLabelText("Nome do cliente"));
    await user.type(within(dialog).getByLabelText("Nome do cliente"), "Maria Souza");
    await user.selectOptions(within(dialog).getByLabelText("Perfil de compra"), "veraneio");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(my.update).toHaveBeenCalledWith("l1", { name: "Maria Souza", phone: "(54) 97777-6666", profile: "veraneio" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Editar cliente" })).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Arquivar cliente" }));
    await waitFor(() => expect(my.archive).toHaveBeenCalledWith("l1"));
  });

  it("mostra o aviso e o restaurar no cliente arquivado", async () => {
    const user = userEvent.setup();
    my.get.mockResolvedValue({ ...leadDetailFixture, archived_at: "2026-11-24T10:00:00Z" });
    my.restore.mockResolvedValue({ ...leadDetailFixture, archived_at: null });
    openAsBroker();
    expect(await screen.findByText(/Cliente arquivado em/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restaurar cliente" }));
    await waitFor(() => expect(my.restore).toHaveBeenCalledWith("l1"));
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
    // Acordeão: a mais recente aberta, as anteriores só com o cabeçalho até o corretor abrir.
    expect(within(nova).getByRole("button", { name: /Proposta 2/ })).toHaveAttribute("aria-expanded", "true");
    const toggle = within(antiga).getByRole("button", { name: /Proposta 1/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(within(antiga).getByText(/antes do detalhamento em números/)).not.toBeVisible();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(within(antiga).getByText(/antes do detalhamento em números/)).toBeVisible();

    await user.click(within(nova).getByRole("button", { name: "Ajustar proposta" }));
    const dialog = screen.getByRole("dialog", { name: "Ajustar proposta" });
    const entrada = within(dialog).getByLabelText("Entrada");
    expect(entrada).toHaveValue(200000);
    // Os veículos de entrada da proposta aparecem no ajuste, com a avaliação para o corretor mudar.
    expect(within(dialog).getByText("Compass 2022")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Avaliação do veículo 1")).toHaveValue(40000);
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
