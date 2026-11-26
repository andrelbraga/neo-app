import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { screen } from "@testing-library/react";

// P-20: o aviso de medição da apresentação diz o que acontece com os dados (layouts A e B).
const dir = resolve(__dirname, "../../../../public/showroom/boa-vista");

describe("aviso de medição da apresentação (P-20)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("layout A: diz quem recebe os dados e não promete o que não acontece", () => {
    new Function(readFileSync(resolve(dir, "metrics/collector.js"), "utf8"))();
    const box = screen.getByRole("region", { name: "Medição da navegação" });
    expect(box).toHaveTextContent("Os dados ficam com o corretor e com a Neo360.");
    expect(box).toHaveTextContent("Não registramos o que você digita.");
    expect(box.textContent).not.toMatch(/servidor|local/i);
    expect(screen.getByRole("button", { name: "Apagar registros deste aparelho" })).toBeInTheDocument();
    // Sem o botão "Medição da navegação" no rodapé: o aviso aparece só enquanto o cliente não escolheu.
    expect(screen.queryByRole("button", { name: "Medição da navegação" })).not.toBeInTheDocument();
    expect(box.textContent).not.toMatch(/parar quando quiser/);
    screen.getByRole("button", { name: "Recusar / parar" }).click();
    expect(document.body).toHaveTextContent("Medição desativada.");
  });

  it("layout B: mesmo aviso, sem prometer parar depois (o B não tem esse controle)", () => {
    const html = readFileSync(resolve(dir, "index-b.html"), "utf8");
    expect(html).toContain("Os dados ficam com o corretor e com a Neo360. Não registramos o que você digita. Você pode recusar.</p>");
    expect(html).not.toContain("sem seu nome e sem o que você digita");
  });
});
