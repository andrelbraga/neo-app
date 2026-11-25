import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// A ponte da apresentação (public/showroom/neo360-bridge.js) roda dentro da página do empreendimento.
const code = readFileSync(resolve(__dirname, "../../../../public/showroom/neo360-bridge.js"), "utf8");
const room = {
  development: { id: "d1", slug: "boa-vista-residencial", name: "Boa Vista Residencial", city: "Gramado", cover_image_url: "/img/capa.jpg" },
  broker: { name: "Fernando Lima", phone: "54999990000", creci: "", code: "FER-0001", agency_name: "", agency_logo_url: "" },
};

function run(visitName: string) {
  window.history.pushState({}, "", "/showroom/boa-vista/index.html?slug=boa-vista-residencial&code=FER-0001&api=/api&convite=abc234");
  const fetchMock = vi.fn(async (url: string) => {
    const data = String(url).includes("/visit") ? { token: "t1", name: visitName, phone: "54988887777" } : room;
    return { ok: true, json: async () => ({ status: 200, data }) } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  new Function(code)();
  return fetchMock;
}

describe("chegada exclusiva da apresentação (ADR-0026)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    document.title = "Boa Vista";
    sessionStorage.clear();
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("recebe o cliente pelo nome, com o convite do corretor, e abre a apresentação no botão", async () => {
    const user = userEvent.setup();
    const fetchMock = run("Rodrigo Vieira");
    const dialog = await screen.findByRole("dialog");
    expect(screen.getByText("Um convite de Fernando para você")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/^(Bom dia|Boa tarde|Boa noite), Rodrigo\.$/));
    expect(screen.getByText("Fernando · seu corretor")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Seu próximo lugarem Gramado.");
    expect(screen.getByText("Que bom te ver de novo.")).not.toBeVisible();
    expect(document.title).toBe("Boa Vista Residencial · preparado para Rodrigo");
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("convite=abc234"))).toBe(true);
    expect(document.documentElement.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Conhecer esta oportunidade →" }));
    expect(dialog).not.toBeInTheDocument();
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("sem nome, saúda sem ele; na mesma sessão não aparece de novo; quem volta é recebido de novo", async () => {
    run("");
    await screen.findByRole("dialog");
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/^(Bom dia|Boa tarde|Boa noite)\.$/));
    expect(document.title).toBe("Boa Vista Residencial · Fernando Lima");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    run("");
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    sessionStorage.clear();
    run("Rodrigo");
    await screen.findByRole("dialog");
    expect(screen.getByText("Que bom te ver de novo.")).toBeVisible();
  });
});
