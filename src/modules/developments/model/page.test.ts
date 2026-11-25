import { blockOn, changesIn, emptyPage, isHidden, pageFrom, samePage, setBlock, setHidden, setText, tagLabel, textOf } from "./page";

describe("edição da página (ADR-0027)", () => {
  it("oculta e mostra seções, desliga blocos e troca textos", () => {
    let c = emptyPage();
    c = setHidden(c, "h-planta", true);
    c = setBlock(c, "3d.condominio", false);
    c = setText(c, "rodape", "Protótipo privado.", "Valores sujeitos a confirmação.");
    expect(isHidden(c, "h-planta")).toBe(true);
    expect(blockOn(c, "3d.condominio")).toBe(false);
    expect(blockOn(c, "3d.apartamento")).toBe(true);
    expect(textOf(c, "rodape", "Protótipo privado.")).toBe("Valores sujeitos a confirmação.");
    expect(textOf(c, "rodape", "Outro")).toBe("Outro");
    expect(changesIn(c, { key: "h-planta", blocks: [{ key: "3d.condominio", label: "" }] })).toBe(2);

    c = setHidden(c, "h-planta", false);
    c = setBlock(c, "3d.condominio", true);
    c = setText(c, "rodape", "Protótipo privado.", "Protótipo privado.");
    expect(c).toEqual(emptyPage());
  });

  it("sabe se há mudança não publicada, sem ligar para a ordem", () => {
    const a = setText(setText(emptyPage(), "x", "1", "um"), "y", "2", "dois");
    const b = setText(setText(emptyPage(), "y", "2", "dois"), "x", "1", "um");
    expect(samePage(a, b)).toBe(true);
    expect(samePage(a, emptyPage())).toBe(false);
    expect(samePage(pageFrom({ sections: { z: { hidden: false } } }), emptyPage())).toBe(true);
  });

  it("completa a configuração que vem da API e nomeia os tipos de texto", () => {
    expect(pageFrom(undefined)).toEqual(emptyPage());
    expect(pageFrom({ texts: [{ section: "a", from: "b", to: "c" }] }).sections).toEqual({});
    expect(tagLabel("h2")).toBe("Título");
    expect(tagLabel("button")).toBe("Botão ou link");
    expect(tagLabel("p")).toBe("Texto");
  });
});
