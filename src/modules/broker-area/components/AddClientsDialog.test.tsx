import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { developmentService } from "@/modules/developments/services/development.service";
import { myLeadService } from "@/modules/leads/services/lead.service";
import { developmentFixture, leadFixture } from "@/test/fixtures";
import { renderPage } from "@/test/render";
import { AddClientsDialog } from "./AddClientsDialog";

vi.mock("@/modules/developments/services/development.service", async (orig) => ({
  ...(await orig<typeof import("@/modules/developments/services/development.service")>()),
  developmentService: { published: vi.fn() },
}));
vi.mock("@/modules/leads/services/lead.service", () => ({ myLeadService: { create: vi.fn(), importCsv: vi.fn() } }));

const leads = vi.mocked(myLeadService);
const csv = () => new File(["nome;telefone\nMaria;54999990000\nJoão;123\n"], "clientes.csv", { type: "text/csv" });

describe("AddClientsDialog (RN-03.16)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(developmentService.published).mockResolvedValue([developmentFixture]);
  });

  it("cadastra um cliente à mão no empreendimento escolhido e oferece o convite", async () => {
    const user = userEvent.setup();
    leads.create.mockResolvedValue({ ...leadFixture, name: "Maria Souza", phone: "54999990000", origin: "corretor", invite_code: "abc234" });
    renderPage(<AddClientsDialog onClose={() => {}} />);
    await waitFor(() => expect(screen.getByLabelText("Empreendimento")).toHaveValue(developmentFixture.id));
    await user.type(screen.getByLabelText("Nome do cliente"), "Maria Souza");
    await user.type(screen.getByLabelText("WhatsApp com DDD"), "(54) 99999-0000");
    await user.click(screen.getByRole("button", { name: "Cadastrar cliente" }));
    await waitFor(() => expect(leads.create).toHaveBeenCalledWith({ development_id: developmentFixture.id, name: "Maria Souza", phone: "(54) 99999-0000" }));
    const invite = await screen.findByRole("link", { name: "Enviar convite" });
    expect(invite.getAttribute("href")).toContain("wa.me/5554999990000");
    expect(decodeURIComponent(invite.getAttribute("href")!)).toContain("?convite=abc234");
    expect(screen.getByLabelText("Nome do cliente")).toHaveValue("");
  });

  it("confere a planilha, mostra o que fica de fora e cadastra as linhas válidas", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    leads.importCsv.mockImplementation(async (_dev, _file, dryRun) => ({
      dry_run: dryRun,
      total: 2,
      valid: 1,
      created: dryRun ? 0 : 1,
      rows: [
        { line: 2, name: "Maria", phone: "54999990000", status: "ok" },
        { line: 3, name: "João", phone: "123", status: "telefone_invalido" },
      ],
    }));
    renderPage(<AddClientsDialog onClose={onClose} />);
    await waitFor(() => expect(screen.getByLabelText("Empreendimento")).toHaveValue(developmentFixture.id));
    await user.click(screen.getByRole("tab", { name: "Planilha CSV" }));
    await user.upload(screen.getByLabelText("Planilha CSV de clientes"), csv());

    await waitFor(() => expect(leads.importCsv).toHaveBeenCalledWith(developmentFixture.id, expect.any(File), true));
    expect(await screen.findByText(/1 de 2 linhas prontas para cadastrar/)).toBeInTheDocument();
    const outside = screen.getByRole("table", { name: "Linhas que ficam de fora" });
    expect(within(outside).getByText("WhatsApp inválido: use DDD e número")).toBeInTheDocument();
    expect(within(outside).queryByText("Maria")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cadastrar 1 cliente" }));
    await waitFor(() => expect(leads.importCsv).toHaveBeenLastCalledWith(developmentFixture.id, expect.any(File), false));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("sem linhas válidas, não deixa cadastrar", async () => {
    const user = userEvent.setup();
    leads.importCsv.mockResolvedValue({ dry_run: true, total: 1, valid: 0, created: 0, rows: [{ line: 1, name: "", phone: "54999990000", status: "nome_invalido" }] });
    renderPage(<AddClientsDialog onClose={() => {}} />);
    await waitFor(() => expect(screen.getByLabelText("Empreendimento")).toHaveValue(developmentFixture.id));
    await user.click(screen.getByRole("tab", { name: "Planilha CSV" }));
    await user.upload(screen.getByLabelText("Planilha CSV de clientes"), csv());
    expect(await screen.findByRole("button", { name: "Cadastrar 0 clientes" })).toBeDisabled();
    expect(screen.getByText("Sem nome")).toBeInTheDocument();
  });
});
