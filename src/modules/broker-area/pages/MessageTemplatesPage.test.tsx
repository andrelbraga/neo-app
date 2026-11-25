import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { myLeadService } from "@/modules/leads/services/lead.service";
import { renderPage } from "@/test/render";
import { MessageTemplatesPage } from "./MessageTemplatesPage";

vi.mock("@/modules/leads/services/lead.service", () => ({ myLeadService: { templates: vi.fn(), saveTemplate: vi.fn(), resetTemplate: vi.fn() } }));

const my = vi.mocked(myLeadService);

describe("MessageTemplatesPage (RN-03.20)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    my.templates.mockResolvedValue([
      { profile: "geral", tone: "formal", body: "Olá, {nome}. {link}", custom: false },
      { profile: "geral", tone: "proximo", body: "Oi, {nome}! {link}", custom: true },
      { profile: "geral", tone: "direto", body: "{nome}: {link}", custom: false },
      { profile: "veraneio", tone: "formal", body: "Férias, {nome}: {link}", custom: false },
    ]);
  });

  it("mostra os tons do perfil escolhido e salva o texto do corretor", async () => {
    const user = userEvent.setup();
    my.saveTemplate.mockResolvedValue({ profile: "geral", tone: "formal", body: "Novo {link}", custom: true });
    renderPage(<MessageTemplatesPage />);
    const formal = await screen.findByRole("region", { name: "Formal" });
    expect(screen.getAllByRole("region")).toHaveLength(3);
    expect(within(screen.getByRole("region", { name: "Próximo" })).getByText("Seu texto")).toBeInTheDocument();
    const text = within(formal).getByLabelText("Texto Formal para Sem perfil");
    await user.clear(text);
    await user.type(text, "Novo texto sem link");
    expect(within(formal).getByText(/a mensagem vai sem a apresentação/)).toBeInTheDocument();
    await user.click(within(formal).getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(my.saveTemplate).toHaveBeenCalledWith("geral", "formal", "Novo texto sem link"));

    await user.click(screen.getByRole("tab", { name: "Veraneio" }));
    expect(screen.getAllByRole("region")).toHaveLength(1);
  });

  it("volta o texto do corretor ao padrão", async () => {
    const user = userEvent.setup();
    my.resetTemplate.mockResolvedValue({ profile: "geral", tone: "proximo", body: "Padrão", custom: false });
    renderPage(<MessageTemplatesPage />);
    const close = await screen.findByRole("region", { name: "Próximo" });
    expect(within(screen.getByRole("region", { name: "Formal" })).queryByRole("button", { name: "Voltar ao padrão" })).not.toBeInTheDocument();
    await user.click(within(close).getByRole("button", { name: "Voltar ao padrão" }));
    await waitFor(() => expect(my.resetTemplate).toHaveBeenCalledWith("geral", "proximo"));
  });
});
