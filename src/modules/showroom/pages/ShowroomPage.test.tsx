import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderPage } from "@/test/render";
import { developmentFixture } from "@/test/fixtures";
import { showroomService, visitorToken } from "../services/showroom.service";
import { ShowroomPage } from "./ShowroomPage";

vi.mock("../services/showroom.service", async (orig) => {
  const real = await orig<typeof import("../services/showroom.service")>();
  return {
    ...real,
    showroomService: {
      get: vi.fn(),
      visit: vi.fn(),
      track: vi.fn(),
      contact: vi.fn(),
    },
  };
});

const svc = vi.mocked(showroomService);
const broker = { name: "Fabiano Souza", phone: "54999990000", creci: "12345-F", code: "FAB-0427", agency_name: "", agency_logo_url: "" };

function open() {
  return renderPage(<ShowroomPage />, { path: "/e/:slug/:code", route: "/e/boa-vista-residencial/FAB-0427" });
}

beforeEach(() => {
  vi.resetAllMocks();
  svc.get.mockResolvedValue({ development: developmentFixture, broker });
  svc.visit.mockResolvedValue({ token: "tok-1", name: "", phone: "" });
  svc.track.mockResolvedValue({ ok: true });
});

describe("ShowroomPage", () => {
  it("mostra o empreendimento e o corretor do link e abre a visita", async () => {
    open();
    expect(await screen.findByRole("heading", { name: "Invista em Gramado" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fabiano Souza" })).toBeInTheDocument();
    expect(screen.getByText("54 m²")).toBeInTheDocument();
    await waitFor(() => expect(svc.visit).toHaveBeenCalledWith("boa-vista-residencial", "FAB-0427", ""));
    await waitFor(() => expect(visitorToken.get("boa-vista-residencial")).toBe("tok-1"));
  });

  it("volta com o mesmo token na segunda visita", async () => {
    visitorToken.set("boa-vista-residencial", "tok-antigo");
    open();
    await waitFor(() => expect(svc.visit).toHaveBeenCalledWith("boa-vista-residencial", "FAB-0427", "tok-antigo"));
  });

  it("registra o tour 3D e o clique no WhatsApp", async () => {
    const user = userEvent.setup();
    open();
    await waitFor(() => expect(svc.visit).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled());

    await user.click(screen.getByRole("button", { name: "Abrir a maquete 3D" }));
    expect(screen.getByTitle("Tour 3D do Boa Vista Residencial")).toHaveAttribute("src", developmentFixture.tour_url);
    expect(svc.track).toHaveBeenCalledWith("tok-1", "tour_3d", {});

    const wa = screen.getByRole("link", { name: "Falar pelo WhatsApp" });
    expect(wa.getAttribute("href")).toContain("https://wa.me/5554999990000?text=");
    await user.click(wa);
    expect(svc.track).toHaveBeenCalledWith("tok-1", "whatsapp", {});
  });

  it("envia nome e WhatsApp para o corretor retornar", async () => {
    const user = userEvent.setup();
    svc.contact.mockResolvedValue({ token: "tok-1", name: "Maria", phone: "54977776666" });
    open();
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled());
    await user.type(screen.getByLabelText("Seu nome"), "Maria");
    await user.type(screen.getByLabelText("Seu WhatsApp"), "54977776666");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(svc.contact).toHaveBeenCalledWith("tok-1", "Maria", "54977776666");
    expect(await screen.findByText(/Fabiano vai falar com você/)).toBeInTheDocument();
  });

  it("leva a conversa para o WhatsApp do corretor e registra o toque (sem chat na página)", async () => {
    const user = userEvent.setup();
    open();
    const wa = await screen.findByRole("link", { name: "Falar com Fabiano pelo WhatsApp" });
    expect(wa.getAttribute("href")).toContain("wa.me/5554999990000");
    await waitFor(() => expect(svc.visit).toHaveBeenCalled());
    await user.click(wa);
    expect(svc.track).toHaveBeenCalledWith("tok-1", "whatsapp", {});
    expect(screen.queryByRole("button", { name: /Conversar com/ })).not.toBeInTheDocument();
  });

  it("abre a página de apresentação própria do empreendimento, com a ponte para a API", async () => {
    svc.get.mockResolvedValue({ development: { ...developmentFixture, presentation_url: "/showroom/boa-vista/index.html" }, broker });
    open();
    const frame = await screen.findByTitle("Boa Vista Residencial");
    const src = new URL(frame.getAttribute("src")!, "http://x");
    expect(src.pathname).toBe("/showroom/boa-vista/index.html");
    expect(src.searchParams.get("slug")).toBe("boa-vista-residencial");
    expect(src.searchParams.get("code")).toBe("FAB-0427");
    expect(src.searchParams.get("api")).toContain("/api");
    expect(svc.visit).not.toHaveBeenCalled();
  });

  it("avisa quando o link não existe", async () => {
    svc.get.mockRejectedValue(new Error("404"));
    open();
    expect(await screen.findByText("Este link não está disponível")).toBeInTheDocument();
    expect(svc.visit).not.toHaveBeenCalled();
  });
});
