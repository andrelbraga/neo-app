import { layoutFrom, presentationSrc } from "./presentation";

describe("layout da apresentação", () => {
  it("usa o A por padrão e o B só quando pedido", () => {
    expect(layoutFrom(null)).toBe("a");
    expect(layoutFrom("x")).toBe("a");
    expect(layoutFrom(" B ")).toBe("b");
  });

  it("aponta o B para o arquivo com sufixo -b e passa o layout para a ponte", () => {
    const p = { slug: "boa-vista-residencial", code: "FAB-0427", api: "/api" };
    expect(presentationSrc("/showroom/boa-vista/index.html", "a", p)).toBe("/showroom/boa-vista/index.html?slug=boa-vista-residencial&code=FAB-0427&api=%2Fapi&layout=a");
    expect(presentationSrc("/showroom/boa-vista/index.html", "b", p)).toBe("/showroom/boa-vista/index-b.html?slug=boa-vista-residencial&code=FAB-0427&api=%2Fapi&layout=b");
  });
});
