import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { screen, waitFor, within } from "@testing-library/react";
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
    const body = JSON.parse(String(((post as unknown[])[1] as RequestInit).body));
    expect(body.condition.preco).toBe(370000);
    expect(body.condition.veiculos.map((v: { modelo: string }) => v.modelo)).toEqual(["Corolla", "Onix"]);
    expect(document.getElementById("nz-wa-p-aviso-env")).toBeInTheDocument();
  });
});

describe("visual da proposta do layout A fiel à página 104-A", () => {
  const dir = resolve(__dirname, "../../../../public/showroom/boa-vista");

  it("o tema da Sintética não muda a seção da proposta e ela fica fora do .wrap", () => {
    const css = readFileSync(resolve(dir, "sintetica.css"), "utf8");
    for (const rule of ["#negociar .nbtn", "#negociar .ncard", "#negociar .nv", "#negociar .nres", ".ng{max-width"]) expect(css).not.toContain(rule);
    expect(css).toContain(".block:not(#negociar) h2");
    expect(css).toContain("#negociar{font-weight:550;color:#0d1510}");
    const html = readFileSync(resolve(dir, "index.html"), "utf8");
    expect(html).toMatch(/<\/div>\n<!-- Sua proposta fora do \.wrap[^\n]*\n<section class="block" id="negociar"/);
  });
});

describe("cartões da imobiliária e da incorporadora no editor (layout B)", () => {
  // No layout B os cartões ficam dentro da seção de dúvidas; no A, soltos.
  const pageB = `
    <section aria-labelledby="h-duv"><h2 id="h-duv">Ficou com alguma dúvida?</h2><p>Toque numa pergunta.</p>
      <section class="inc-card" aria-label="Imobiliária parceira"><h3>Atendimento em parceria</h3></section>
      <section class="inc-card" aria-label="Incorporadora responsável"><h3>Empreendimento próprio</h3></section>
    </section>`;
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (room.development as { page_config?: unknown }).page_config;
  });

  it("o editor lista os cartões como seções próprias, com os textos deles, e oculta e mostra na prévia", () => {
    document.body.innerHTML = pageB;
    window.history.pushState({}, "", "/showroom/boa-vista/index-b.html?cms=1&slug=bv");
    vi.stubGlobal("fetch", vi.fn());
    const posted: Record<string, unknown>[] = [];
    const spy = vi.spyOn(window, "postMessage").mockImplementation((m: unknown) => void posted.push(m as Record<string, unknown>));
    new Function(code)();
    const outline = posted.find((m) => m.type === "outline")!.sections as { key: string; texts: { text: string }[] }[];
    expect(outline.map((s) => s.key)).toEqual(["chegada", "h-duv", "imobiliaria-parceira", "incorporadora-responsavel"]);
    expect(outline[1].texts.map((t) => t.text)).toEqual(["Ficou com alguma dúvida?", "Toque numa pergunta."]);
    expect(outline[2].texts.map((t) => t.text)).toEqual(["Atendimento em parceria"]);

    const send = (config: unknown) =>
      window.dispatchEvent(new MessageEvent("message", { data: { source: "neo-cms", type: "config", config }, origin: window.location.origin, source: window }));
    const cards = () => [...document.querySelectorAll(".inc-card")].map((e) => e.hasAttribute("data-neo-off"));
    send({ sections: { "imobiliaria-parceira": { hidden: true }, "incorporadora-responsavel": { hidden: true } } });
    expect(cards()).toEqual([true, true]);
    send({ sections: {} });
    expect(cards()).toEqual([false, false]);
    spy.mockRestore();
  });

  it("a página do cliente no layout B oculta a incorporadora quando o admin desliga", async () => {
    document.body.innerHTML = pageB;
    room.development = { ...room.development, page_config: { sections: { "incorporadora-responsavel": { hidden: true } } } } as typeof room.development;
    run("Rodrigo");
    await waitFor(() => expect(document.querySelector('[aria-label="Incorporadora responsável"]')).toHaveAttribute("data-neo-off"));
    expect(document.querySelector('[aria-labelledby="h-duv"]')).not.toHaveAttribute("data-neo-off");
  });
});

describe("fotos no bucket (ADR-0029)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (room.broker as { photo_path?: string }).photo_path;
    for (const k of ["calc", "CAMPANHA", "veic", "VEICS", "nVeic", "regGravaProposta"]) delete (window as unknown as Record<string, unknown>)[k];
  });

  it("a foto do corretor substitui as iniciais no cartão quando carrega (RN-01.11)", async () => {
    document.body.innerHTML = '<section aria-label="Seu consultor"><div class="tc-foto"></div><h2 class="tc-nome"></h2></section>';
    (room.broker as { photo_path?: string }).photo_path = "/public/media/brokers/abc.jpg";
    run("Rodrigo");
    await waitFor(() => expect(document.querySelector(".tc-foto img")).toBeInTheDocument());
    const img = document.querySelector<HTMLImageElement>(".tc-foto img")!;
    expect(img.getAttribute("src")).toBe("/api/public/media/brokers/abc.jpg");
    expect(document.querySelector(".tc-foto span")).toHaveTextContent("FL");
    img.dispatchEvent(new Event("load"));
    expect(document.querySelector(".tc-foto span")).not.toBeInTheDocument();
    expect(img.style.getPropertyValue("display")).toBe("block");
  });

  it("o cliente anexa fotos do veículo, remove uma e as que ficam vão na proposta (RN-03.23)", async () => {
    const user = userEvent.setup();
    let n = 0;
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => `blob:${++n}`), revokeObjectURL: vi.fn() }));
    document.body.innerHTML = '<section id="negociar"><button id="p-fotos" type="button">+ Anexar fotos</button><p class="nnota">Até 6 fotos.</p></section>';
    Object.assign(window, {
      calc: () => ({ ent: 150000, par: 36, saldo: 130000, refN: 0, refV: 0, chaves: 0 }),
      CAMPANHA: { promo: 370000, ref: 460000, tipo: "", validade: "", entMin: 120000 },
      veic: true,
      VEICS: [{ mod: "Corolla", ano: "2022", km: "40000", valor: "90000" }],
      nVeic: () => 1,
      regGravaProposta: () => {},
    });
    window.history.pushState({}, "", "/showroom/boa-vista/index.html?slug=boa-vista-residencial&code=FER-0001&api=/api");
    let photoId = 0;
    const fetchMock = vi.fn(async (url: string) => {
      const u = String(url);
      const data = u.includes("/visit") ? { token: "t1", name: "", phone: "" } : u.includes("/public/lead/photos") ? { id: `ph-${++photoId}` } : room;
      return { ok: true, json: async () => ({ status: 200, data }) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    new Function(code)();
    await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/visit"))).toBe(true));
    await new Promise((r) => setTimeout(r, 20));

    const input = document.querySelector<HTMLInputElement>('#negociar input[type="file"]')!;
    const files = [new File(["a"], "a.jpg", { type: "image/jpeg" }), new File(["b"], "b.jpg", { type: "image/jpeg" })];
    await user.upload(input, files);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Remover foto" })).toHaveLength(2));
    const uploads = fetchMock.mock.calls.filter(([u]) => String(u).includes("/public/lead/photos"));
    expect(uploads).toHaveLength(2);
    expect(((uploads[0] as unknown[])[1] as RequestInit).headers).toMatchObject({ "X-Visitor-Token": "t1" });
    expect(((uploads[0] as unknown[])[1] as RequestInit).body).toBeInstanceOf(FormData);

    await user.click(screen.getAllByRole("button", { name: "Remover foto" })[0]);
    const send = (window as unknown as { regGravaProposta: (d: object) => Promise<boolean> }).regGravaProposta;
    await send({ nome: "Rodrigo", whatsapp: "54988887777", resumo: "Proposta", observacao: "" });
    const post = fetchMock.mock.calls.find(([u]) => String(u).includes("/public/lead/proposals"))!;
    expect(JSON.parse(String((post as unknown[])[1] && ((post as unknown[])[1] as RequestInit).body)).condition.fotos).toEqual(["ph-2"]);
  });

  it("com dois veículos, o cliente escolhe de qual são as fotos e cada veículo vai com as dele e as observações", async () => {
    const user = userEvent.setup();
    let n = 0;
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => `blob:${++n}`), revokeObjectURL: vi.fn() }));
    document.body.innerHTML =
      '<section id="negociar"><select id="p-nveic"><option value="1">1</option><option value="2" selected>2</option></select><div id="veic-lista"></div>' +
      '<button id="p-fotos" type="button">+ Anexar fotos</button></section>';
    Object.assign(window, {
      calc: () => ({ ent: 150000, par: 36, saldo: 90000, refN: 0, refV: 0, chaves: 0 }),
      CAMPANHA: { promo: 370000, ref: 460000, tipo: "", validade: "", entMin: 120000 },
      veic: true,
      VEICS: [
        { mod: "Corolla", ano: "2022", km: "40000", valor: "90000", estado: "Revisado" },
        { mod: "Onix", ano: "2020", km: "", valor: "50000", estado: "" },
      ],
      nVeic: () => 2,
      regGravaProposta: () => {},
    });
    window.history.pushState({}, "", "/showroom/boa-vista/index.html?slug=boa-vista-residencial&code=FER-0001&api=/api");
    let photoId = 0;
    const fetchMock = vi.fn(async (url: string) => {
      const u = String(url);
      const data = u.includes("/visit") ? { token: "t1", name: "", phone: "" } : u.includes("/public/lead/photos") ? { id: `ph-${++photoId}` } : room;
      return { ok: true, json: async () => ({ status: 200, data }) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    new Function(code)();
    await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/visit"))).toBe(true));
    await new Promise((r) => setTimeout(r, 20));

    const pick = screen.getByRole("combobox", { name: "De qual veículo são as fotos" });
    expect(within(pick).getAllByRole("option").map((o) => o.textContent)).toEqual(["Veículo 1 · Corolla", "Veículo 2 · Onix"]);
    const input = document.querySelector<HTMLInputElement>('#negociar input[type="file"]')!;
    await user.upload(input, new File(["a"], "a.jpg", { type: "image/jpeg" }));
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Remover foto" })).toHaveLength(1));
    await user.selectOptions(pick, "1");
    await user.upload(input, new File(["b"], "b.jpg", { type: "image/jpeg" }));
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Remover foto" })).toHaveLength(2));
    expect([...document.querySelectorAll(".neo-fotos figcaption")].map((f) => f.textContent)).toEqual(["V1", "V2"]);

    const send = (window as unknown as { regGravaProposta: (d: object) => Promise<boolean> }).regGravaProposta;
    await send({ nome: "Rodrigo", whatsapp: "54988887777", resumo: "Proposta", observacao: "" });
    const post = fetchMock.mock.calls.find(([u]) => String(u).includes("/public/lead/proposals"))!;
    const condition = JSON.parse(String(((post as unknown[])[1] as RequestInit).body)).condition;
    expect(condition.fotos).toEqual(["ph-1", "ph-2"]);
    expect(condition.veiculos).toEqual([
      { modelo: "Corolla", ano: "2022", km: "40000", valor: 90000, estado: "Revisado", fotos: ["ph-1"] },
      { modelo: "Onix", ano: "2020", km: "", valor: 50000, estado: "", fotos: ["ph-2"] },
    ]);
  });

  it("foto recusada pela API some e o aviso diz o motivo", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() }));
    document.body.innerHTML = '<section id="negociar"><button id="p-fotos" type="button">+ Anexar fotos</button></section>';
    window.history.pushState({}, "", "/showroom/boa-vista/index.html?slug=boa-vista-residencial&code=FER-0001&api=/api");
    const fetchMock = vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes("/public/lead/photos")) return { ok: false, json: async () => ({ status: 400, data: { error: "envie uma foto em JPG, PNG ou WebP" } }) } as Response;
      const data = u.includes("/visit") ? { token: "t1", name: "", phone: "" } : room;
      return { ok: true, json: async () => ({ status: 200, data }) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    new Function(code)();
    await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/visit"))).toBe(true));
    await new Promise((r) => setTimeout(r, 20));
    await user.upload(document.querySelector<HTMLInputElement>('#negociar input[type="file"]')!, new File(["%PDF"], "doc.jpg", { type: "image/jpeg" }));
    expect(await screen.findByText("Não foi possível anexar a foto: envie uma foto em JPG, PNG ou WebP.")).toBeInTheDocument();
    expect(document.querySelector(".neo-fotos figure")).not.toBeInTheDocument();
  });
});
