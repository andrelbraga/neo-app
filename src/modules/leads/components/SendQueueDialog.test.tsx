import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { leadFixture } from "@/test/fixtures";
import { renderPage } from "@/test/render";
import { myLeadService } from "../services/lead.service";
import { SendQueueDialog } from "./SendQueueDialog";

vi.mock("../services/lead.service", () => ({ myLeadService: { templates: vi.fn(), messageSent: vi.fn() } }));

const my = vi.mocked(myLeadService);
const maria = { ...leadFixture, profile: "moradia" as const, last_message_at: "2026-11-20T15:00:00Z" };
const joao = { ...leadFixture, id: "l2", name: "João Lima", phone: "54911112222", profile: "" as const, last_message_at: null };

describe("SendQueueDialog (ADR-0028)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    my.templates.mockResolvedValue([
      { profile: "moradia", tone: "direto", body: "{nome}, para morar: {link}", custom: false },
      { profile: "geral", tone: "direto", body: "{nome}, veja: {link}", custom: false },
    ]);
    my.messageSent.mockResolvedValue(leadFixture);
  });

  it("mostra os clientes marcados, escolhe o tom, abre um por um e registra só o que o corretor confirma", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderPage(<SendQueueDialog leads={[maria, joao]} onClose={onClose} />);

    const list = screen.getByRole("list", { name: "Clientes da fila" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getByText("enviado em 20/11")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Direto" }));
    await user.click(screen.getByRole("button", { name: "Começar (2)" }));

    expect(screen.getByText("1 de 2")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Abrir no WhatsApp" });
    await waitFor(() => expect(screen.getByLabelText("Mensagem")).toHaveValue(`Maria, para morar: ${window.location.origin}/e/boa-vista-residencial/FAB-0427`));
    expect(decodeURIComponent(link.getAttribute("href")!)).toContain("https://wa.me/5554977776666?text=Maria, para morar");

    await user.click(link);
    await user.click(screen.getByRole("button", { name: "Sim, enviei" }));
    await waitFor(() => expect(my.messageSent).toHaveBeenCalledWith("l1", { profile: "moradia", tone: "direto" }));

    expect(await screen.findByText("2 de 2")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Mensagem")).toHaveValue(`João, veja: ${window.location.origin}/e/boa-vista-residencial/FAB-0427`));
    await user.click(screen.getByRole("button", { name: "Pular" }));

    expect(screen.getByText("Fila concluída")).toBeInTheDocument();
    expect(screen.getByText("1 mensagem enviada de 2.")).toBeInTheDocument();
    expect(my.messageSent).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Concluir" }));
    expect(onClose).toHaveBeenCalledWith(1);
  });

  it("avisa quando não consegue registrar e deixa abrir de novo", async () => {
    const user = userEvent.setup();
    my.messageSent.mockRejectedValue(new Error("rede"));
    renderPage(<SendQueueDialog leads={[maria]} onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Começar (1)" }));
    await waitFor(() => expect(screen.getByLabelText("Mensagem")).not.toBeDisabled());
    await user.click(screen.getByRole("link", { name: "Abrir no WhatsApp" }));
    await user.click(screen.getByRole("button", { name: "Sim, enviei" }));
    expect(await screen.findByText("Não deu para registrar. Tente de novo.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Abrir de novo" }));
    expect(screen.getByRole("link", { name: "Abrir no WhatsApp" })).toBeInTheDocument();
  });
});
