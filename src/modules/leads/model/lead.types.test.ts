import { eventLabel, matchesLead, readingTime } from "./lead.types";

const e = (kind: string, data: Record<string, unknown> = {}) => ({ id: 1, kind, data, created_at: "" });

describe("eventLabel", () => {
  it("descreve em português o que o cliente fez", () => {
    expect(eventLabel(e("visita"))).toBe("Abriu o link");
    expect(eventLabel(e("secao", { id: "galeria" }))).toBe("Viu a galeria");
    expect(eventLabel(e("secao", { id: "h-neg" }))).toBe("Viu a montagem da proposta");
    expect(eventLabel(e("secao", { id: "x" }))).toBe("Viu uma seção");
    expect(eventLabel(e("galeria", { caption: "Fachada" }))).toBe('Abriu a foto "Fachada"');
    expect(eventLabel(e("galeria"))).toBe("Abriu a foto da galeria");
    expect(eventLabel(e("tour_3d"))).toBe("Entrou no tour 3D");
    expect(eventLabel(e("whatsapp"))).toBe("Tocou em falar pelo WhatsApp");
    expect(eventLabel(e("chat_aberto"))).toBe("Abriu o chat");
    expect(eventLabel(e("contato"))).toBe("Deixou nome e WhatsApp");
    expect(eventLabel(e("contato", { antes: { nome: "Bruna", whatsapp: "54977772222" } }))).toBe("Trocou nome ou WhatsApp (antes: Bruna · (54) 97777-2222)");
    expect(eventLabel(e("outro"))).toBe("outro");
  });

  it("traduz os eventos da apresentação do protótipo", () => {
    expect(eventLabel(e("proposta"))).toBe("Enviou uma proposta");
    expect(eventLabel(e("proposta", { autorizou_contrato: true }))).toBe("Enviou proposta e pediu o contrato");
    expect(eventLabel(e("perfil"))).toBe("Criou o perfil de cliente");
    expect(eventLabel(e("acao", { chave: "abriu_3d" }))).toBe("Abriu o apartamento em 3D");
    expect(eventLabel(e("acao", { chave: "estacao_inverno" }))).toBe("Viu o sol em outra estação");
    expect(eventLabel(e("acao", { chave: "comodo_dorm1" }))).toBe("Abriu um ambiente na planta");
    expect(eventLabel(e("acao", { chave: "voo_3d" }))).toBe("Sobrevoou o condomínio em 3D");
    expect(eventLabel(e("acao", { chave: "dia_no_apto" }))).toBe("Viu um dia no apartamento");
    expect(eventLabel(e("acao", { chave: "veiculos_2" }))).toBe("Escolheu a quantidade de veículos");
    expect(eventLabel(e("acao", { chave: "mexeu_simulador" }))).toBe("Mexeu no simulador");
    expect(eventLabel(e("acao", { chave: "veiculo_on" }))).toBe("Incluiu veículo na proposta");
    expect(eventLabel(e("secao", { id: "estudos" }))).toBe("Viu os estudos de investimento");
    expect(eventLabel(e("acao", { chave: "?" }))).toBe("Interagiu com a página");
    expect(eventLabel(e("tempo"))).toBe("Tempo de leitura registrado");
  });
});

describe("readingTime", () => {
  it("usa o último registro de tempo e ordena do maior para o menor", () => {
    const events = [
      { ...e("tempo", { secoes: { "h-neg": 10 } }), id: 1 },
      { ...e("tempo", { secoes: { "h-neg": 95.4, "h-galeria": 30, "h-sim": 0 } }), id: 2 },
    ];
    expect(readingTime(events)).toEqual([
      { id: "h-neg", label: "a montagem da proposta", seconds: 95 },
      { id: "h-galeria", label: "a galeria de fotos", seconds: 30 },
    ]);
    expect(readingTime([])).toEqual([]);
  });

  it("busca cliente por nome, WhatsApp, empreendimento ou corretor", () => {
    const l = { name: "Maria", phone: "54977776666", development_name: "Boa Vista Residencial", broker_name: "Fabiano Souza" } as Parameters<typeof matchesLead>[0];
    expect(matchesLead(l, "")).toBe(true);
    expect(matchesLead(l, "mar")).toBe(true);
    expect(matchesLead(l, "97777")).toBe(true);
    expect(matchesLead(l, "boa vista")).toBe(true);
    expect(matchesLead(l, "fabiano")).toBe(true);
    expect(matchesLead(l, "carla")).toBe(false);
  });
});
