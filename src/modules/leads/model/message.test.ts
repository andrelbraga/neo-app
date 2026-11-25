import { fillTemplate, findTemplate, messageLink, templateProfileOf } from "./message";

const lead = {
  name: "Maria Souza",
  development_name: "Boa Vista Residencial",
  development_slug: "boa-vista-residencial",
  broker_code: "FAB-0427",
  broker_name: "Fabiano Souza",
  invite_code: "",
  profile: "" as const,
};

describe("mensagens do WhatsApp (RN-03.20)", () => {
  it("preenche nome, empreendimento, link e corretor", () => {
    expect(fillTemplate("Oi, {nome}! Aqui é {corretor}. {empreendimento}: {link}", lead, "https://neo.app")).toBe(
      "Oi, Maria! Aqui é Fabiano. Boa Vista Residencial: https://neo.app/e/boa-vista-residencial/FAB-0427",
    );
  });

  it("usa o link de convite do cliente cadastrado", () => {
    expect(messageLink({ ...lead, invite_code: "abc234" }, "https://neo.app")).toBe("https://neo.app/e/boa-vista-residencial/FAB-0427?convite=abc234");
  });

  it("sem nome, a saudação fica sem ele", () => {
    const noName = { ...lead, name: "" };
    expect(fillTemplate("Olá, {nome}. Aqui é {corretor}.", noName)).toBe("Olá. Aqui é Fabiano.");
    expect(fillTemplate("Oi, {nome}! Tudo bem?", noName)).toBe("Oi! Tudo bem?");
    expect(fillTemplate("{nome}, segue o {empreendimento}", noName)).toBe("Segue o Boa Vista Residencial");
  });

  it("acha o modelo do perfil do cliente, ou o geral", () => {
    expect(templateProfileOf(lead)).toBe("geral");
    expect(templateProfileOf({ profile: "veraneio" })).toBe("veraneio");
    const list = [
      {
        profile: "veraneio" as const,
        tone: "direto" as const,
        body: "x",
        custom: false,
      },
    ];
    expect(findTemplate(list, "veraneio", "direto")?.body).toBe("x");
    expect(findTemplate(list, "geral", "direto")).toBeUndefined();
  });
});
