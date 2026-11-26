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

// Página parecida com a apresentação real: seções com chave, o 3D e o rodapé.
const page = `
  <section aria-labelledby="h-planta"><p class="eyebrow">Planta e visão 3D</p><h2 id="h-planta">Uma planta<br>para a sua vida</h2>
    <button data-vis="apto3d"><span class="tile-img"></span><span class="tile-t">Planta 3D</span></button>
    <div id="vapto"><p>Vista de cima</p></div><label>Hora <input></label></section>
  <section aria-labelledby="h-sim"><h2 id="h-sim">Simulador</h2><p>Monte as <b>condições</b>.</p></section>
  <footer class="foot"><p>Protótipo privado.</p></footer>`;

describe("página editável pelo admin (ADR-0027)", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    sessionStorage.clear();
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("a página pública aplica a configuração publicada: seção oculta, 3D desligado e textos trocados", async () => {
    document.body.innerHTML = page;
    room.development = {
      ...room.development,
      page_config: {
        sections: { "h-sim": { hidden: true }, chegada: { hidden: true } },
        blocks: { "3d.apartamento": false },
        texts: [
          { section: "rodape", from: "Protótipo privado.", to: "Valores sujeitos a confirmação.\nConsulte o corretor." },
          { section: "h-planta", from: "Planta e visão 3D", to: "" },
        ],
      },
    } as typeof room.development;
    run("Rodrigo");
    await waitFor(() => expect(document.querySelector('[aria-labelledby="h-sim"]')).toHaveAttribute("data-neo-off"));
    expect(document.querySelector('[data-vis="apto3d"]')).toHaveAttribute("data-neo-off");
    expect(document.querySelector("#vapto")).toHaveAttribute("data-neo-off");
    expect(document.querySelector("footer p")!.innerHTML).toBe("Valores sujeitos a confirmação.<br>Consulte o corretor.");
    expect(document.querySelector(".eyebrow")).toHaveAttribute("data-neo-off");
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    delete (room.development as { page_config?: unknown }).page_config;
  });

  it("no editor (?cms=1) conta seções, textos e blocos, aplica ao vivo e avisa o texto clicado", async () => {
    document.body.innerHTML = page;
    window.history.pushState({}, "", "/showroom/boa-vista/index.html?cms=1&slug=bv");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const posted: Record<string, unknown>[] = [];
    const spy = vi.spyOn(window, "postMessage").mockImplementation((m: unknown) => void posted.push(m as Record<string, unknown>));
    new Function(code)();
    const outline = posted.find((m) => m.type === "outline")!.sections as { key: string; texts: { text: string }[]; blocks: { key: string }[] }[];
    expect(outline.map((s) => s.key)).toEqual(["chegada", "h-planta", "h-sim", "rodape"]);
    const planta = outline[1];
    expect(planta.texts.map((t) => t.text)).toEqual(["Planta e visão 3D", "Uma planta\npara a sua vida", "Planta 3D", "Vista de cima"]);
    expect(planta.blocks.map((b) => b.key)).toEqual(["3d.apartamento"]);
    expect(outline[2].texts.map((t) => t.text)).toEqual(["Simulador", "Monte as condições."]);
    expect(fetchMock).not.toHaveBeenCalled();

    const send = (data: unknown) => window.dispatchEvent(new MessageEvent("message", { data, origin: window.location.origin, source: window }));
    send({
      source: "neo-cms",
      type: "config",
      config: { sections: { "h-sim": { hidden: true } }, blocks: {}, texts: [{ section: "h-planta", from: "Uma planta\npara a sua vida", to: "Sua planta" }] },
    });
    expect(document.querySelector('[aria-labelledby="h-sim"]')).toHaveAttribute("data-neo-off");
    expect(document.querySelector("#h-planta")!.textContent).toBe("Sua planta");
    send({ source: "neo-cms", type: "config", config: { sections: {}, blocks: {}, texts: [] } });
    expect(document.querySelector('[aria-labelledby="h-sim"]')).not.toHaveAttribute("data-neo-off");
    expect(document.querySelector("#h-planta")!.innerHTML).toBe("Uma planta<br>para a sua vida");

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { source: "neo-cms", type: "config", config: { sections: { "h-sim": { hidden: true } } } },
        origin: "https://outro.site",
        source: window,
      }),
    );
    expect(document.querySelector('[aria-labelledby="h-sim"]')).not.toHaveAttribute("data-neo-off");

    document.querySelector<HTMLElement>("footer p")!.click();
    expect(posted.at(-1)).toMatchObject({ source: "neo-cms", type: "select", section: "rodape", from: "Protótipo privado." });
    spy.mockRestore();
  });
});

describe("título do cartão da proposta e rodapé da apresentação", () => {
  const dir = resolve(__dirname, "../../../../public/showroom/boa-vista");
  const card = `<section id="negociar" aria-labelledby="h-neg"><h2 id="h-neg">Proposta</h2>
    <div class="ncard"><div class="nct"><span>Monte sua proposta personalizada</span></div></div></section>`;

  beforeEach(() => {
    document.head.innerHTML = "";
    sessionStorage.clear();
    localStorage.clear();
    (window as { BVMetrics?: object }).BVMetrics = {};
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as { BVMetrics?: object }).BVMetrics;
    delete (room.development as { page_config?: unknown }).page_config;
  });

  it("a ponte mantém o título da página, e a troca feita no editor vale para o cliente", async () => {
    document.body.innerHTML = card;
    run("Rodrigo");
    await screen.findByRole("dialog");
    expect(document.querySelector(".nct span")).toHaveTextContent("Monte sua proposta personalizada");

    document.body.innerHTML = card;
    sessionStorage.clear();
    room.development = {
      ...room.development,
      page_config: { texts: [{ section: "h-neg", from: "Monte sua proposta personalizada", to: "Faça sua proposta" }] },
    } as typeof room.development;
    run("Rodrigo");
    await waitFor(() => expect(document.querySelector(".nct span")).toHaveTextContent("Faça sua proposta"));
  });

  it.each(["index.html", "index-b.html"])("%s não tem os atalhos de demonstração", (file) => {
    const html = readFileSync(resolve(dir, file), "utf8");
    expect(html).toContain("<span>Monte sua proposta personalizada</span>");
    for (const text of ["dash-go\">", "synth-ribbon\">", "Evidências · Dev", "Testar convite personalizado", "Canal Neo360", "quatro dashboards", "referencia-", "Simulação livre anterior"]) {
      expect(html).not.toContain(text);
    }
  });
});

describe("proposta do layout A igual à da página 104-A", () => {
  const dir = resolve(__dirname, "../../../../public/showroom/boa-vista");
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as { BVMetrics?: object }).BVMetrics;
    for (const k of ["calc", "CAMPANHA", "veic", "VEICS", "nVeic"]) delete (window as unknown as Record<string, unknown>)[k];
  });

  it("o HTML tem as três etapas da 104-A e o script da Sintética não procura os campos antigos", () => {
    const html = readFileSync(resolve(dir, "index.html"), "utf8");
    for (const text of ['id="p-entn"', 'id="p-nveic"', 'id="veic-lista"', ">Enviar para análise<", ">✓ Subir o contrato<", "Etapa 3 · Fechamento", "Seus dados para o corretor retornar"]) {
      expect(html).toContain(text);
    }
    for (const text of ['id="p-preco"', 'id="p-mod"', 'id="copy-summary"', 'id="p-nao"', "entrada_so_avista: true, parcMin"]) {
      if (text.startsWith("entrada")) expect(html).toContain(text);
      else expect(html).not.toContain(text);
    }
    const synth = readFileSync(resolve(dir, "sintetica.js"), "utf8");
    for (const id of ["p-preco", "p-mod", "p-vveic", "p-fotos", "add-vehicle", "copy-summary", "p-nao", "setIntent"]) expect(synth).not.toContain(id);
  });

  it("a proposta vai com o preço da campanha e os veículos da lista", async () => {
    (window as { BVMetrics?: object }).BVMetrics = {};
    Object.assign(window, {
      calc: () => ({ ent: 150000, par: 36, saldo: 190000, refN: 2, refV: 15000, chaves: 0 }),
      CAMPANHA: { promo: 370000, ref: 460000, tipo: "Condição especial", validade: "30/11/2026", entMin: 120000 },
      veic: true,
      VEICS: [{ mod: "Corolla", ano: "2022", km: "40000", valor: "90000" }, { mod: "Onix", ano: "2020", km: "", valor: "50000" }],
      nVeic: () => 2,
    });
    (window as unknown as Record<string, unknown>).regGravaProposta = () => {};
    document.body.innerHTML = '<p class="naviso" id="p-aviso-env"></p><p class="naviso" id="p-aviso"></p>';
    const fetchMock = run("Rodrigo");
    await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/visit"))).toBe(true));
    await new Promise((r) => setTimeout(r, 20));
    const send = (window as unknown as { regGravaProposta: (d: object) => Promise<boolean> }).regGravaProposta;
    await send({ nome: "Rodrigo", whatsapp: "54988887777", resumo: "Proposta", observacao: "" });
    const post = fetchMock.mock.calls.find(([u]) => String(u).includes("/public/lead/proposals"))!;
    const body = JSON.parse(String((post[1] as RequestInit).body));
    expect(body.condition.preco).toBe(370000);
    expect(body.condition.veiculos.map((v: { modelo: string }) => v.modelo)).toEqual(["Corolla", "Onix"]);
    expect(document.getElementById("nz-wa-p-aviso-env")).toBeInTheDocument();
  });
});
