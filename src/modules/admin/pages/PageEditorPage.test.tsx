import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { developmentService } from "@/modules/developments/services/development.service";
import { developmentFixture } from "@/test/fixtures";
import { renderPage } from "@/test/render";
import { PageEditorPage } from "./PageEditorPage";

vi.mock("@/modules/developments/services/development.service", async (orig) => ({
  ...(await orig<typeof import("@/modules/developments/services/development.service")>()),
  developmentService: { get: vi.fn(), savePage: vi.fn() },
}));

const svc = vi.mocked(developmentService);
const dev = { ...developmentFixture, presentation_url: "/showroom/boa-vista/index.html", default_layout: "a" as const };
const outline = [
  { key: "chegada", label: "Chegada exclusiva", texts: [], blocks: [] },
  {
    key: "h-planta",
    label: "Planta e 3D",
    texts: [
      { text: "Uma planta para a sua vida", tag: "h2" },
      { text: "Escolha como ver.", tag: "p" },
    ],
    blocks: [{ key: "3d.condominio", label: "Condomínio em 3D (maquete)" }],
  },
  { key: "rodape", label: "Rodapé", texts: [{ text: "Protótipo privado.", tag: "p" }], blocks: [] },
];

function open() {
  renderPage(<PageEditorPage />, { path: "/admin/empreendimentos/:id/pagina", route: "/admin/empreendimentos/d1/pagina" });
}
async function fromPreview(data: Record<string, unknown>) {
  const frame = (await screen.findByTitle("Prévia da página")) as HTMLIFrameElement;
  window.dispatchEvent(new MessageEvent("message", { data: { source: "neo-cms", ...data }, origin: window.location.origin, source: frame.contentWindow }));
  return frame;
}

describe("PageEditorPage (ADR-0027)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    svc.get.mockResolvedValue(dev);
  });

  it("abre a prévia em modo editor e lista as seções que a página contou", async () => {
    open();
    const frame = (await screen.findByTitle("Prévia da página")) as HTMLIFrameElement;
    const src = new URL(frame.getAttribute("src")!, "http://x");
    expect(src.pathname).toBe("/showroom/boa-vista/index.html");
    expect(src.searchParams.get("cms")).toBe("1");
    expect(src.searchParams.get("code")).toBeNull();
    const post = vi.spyOn(frame.contentWindow!, "postMessage");
    await fromPreview({ type: "outline", sections: outline });
    expect(await screen.findByRole("button", { name: /^Planta e 3D/ })).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith({ source: "neo-cms", type: "config", config: { sections: {}, blocks: {}, texts: [] } }, window.location.origin);
    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();

    // Mensagem de outra origem é ignorada.
    window.dispatchEvent(
      new MessageEvent("message", { data: { source: "neo-cms", type: "outline", sections: [] }, origin: "https://outro.site", source: frame.contentWindow }),
    );
    expect(screen.getByRole("button", { name: /^Planta e 3D/ })).toBeInTheDocument();
  });

  it("avisa que o cartão da imobiliária depende do cadastro do corretor (ADR-0010)", async () => {
    const user = userEvent.setup();
    open();
    await fromPreview({ type: "outline", sections: [...outline, { key: "imobiliaria-parceira", label: "Imobiliária parceira", texts: [], blocks: [] }] });
    const note = await screen.findByText(/Só aparece para o cliente quando o corretor do link tem imobiliária no cadastro/);
    expect(within(note).getByRole("link", { name: "Ver a imobiliária de cada profissional" })).toHaveAttribute("href", "/admin/profissionais");
    expect(screen.getAllByText(/Só aparece para o cliente/)).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Ocultar Imobiliária parceira" }));
    expect(screen.queryByText(/Só aparece para o cliente/)).not.toBeInTheDocument();
  });

  it("oculta seção, desliga o 3D e troca texto ao vivo, e publica", async () => {
    const user = userEvent.setup();
    svc.savePage.mockImplementation(async (_id, c) => ({ ...dev, page_config: c }));
    open();
    const frame = await fromPreview({ type: "outline", sections: outline });
    const post = vi.spyOn(frame.contentWindow!, "postMessage");
    await screen.findByRole("button", { name: /^Planta e 3D/ });

    await user.click(screen.getByRole("button", { name: "Ocultar Rodapé" }));
    await user.click(screen.getByRole("button", { name: /^Planta e 3D/ }));
    await user.click(screen.getByRole("switch", { name: "Condomínio em 3D (maquete)" }));
    const title = screen.getByDisplayValue("Uma planta para a sua vida");
    await user.clear(title);
    await user.type(title, "Sua planta");
    expect(screen.getByRole("status")).toHaveTextContent("Alterações não publicadas");
    const config = {
      sections: { rodape: { hidden: true } },
      blocks: { "3d.condominio": false },
      texts: [{ section: "h-planta", from: "Uma planta para a sua vida", to: "Sua planta" }],
    };
    await waitFor(() => expect(post).toHaveBeenLastCalledWith({ source: "neo-cms", type: "config", config }, window.location.origin));

    await user.click(screen.getByRole("button", { name: "Publicar" }));
    await waitFor(() => expect(svc.savePage).toHaveBeenCalledWith("d1", config));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Tudo publicado"));
  });

  it("clique num texto da prévia abre a seção e o campo; restaurar e descartar voltam ao original", async () => {
    const user = userEvent.setup();
    open();
    await fromPreview({ type: "outline", sections: outline });
    await fromPreview({ type: "select", section: "rodape", from: "Protótipo privado." });
    const field = await screen.findByDisplayValue("Protótipo privado.");
    await waitFor(() => expect(field).toHaveFocus());
    await user.clear(field);
    expect(screen.getByText("Vazio: o texto some da página.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restaurar" }));
    expect(field).toHaveValue("Protótipo privado.");

    await user.type(field, " Novo");
    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(field).toHaveValue("Protótipo privado.");
    expect(within(screen.getByRole("status")).getByText("Tudo publicado")).toBeInTheDocument();
  });

  it("empreendimento sem página própria explica que o editor não se aplica", async () => {
    svc.get.mockResolvedValue({ ...dev, presentation_url: "" });
    open();
    expect(await screen.findByText("Este empreendimento usa o modelo padrão")).toBeInTheDocument();
  });
});
