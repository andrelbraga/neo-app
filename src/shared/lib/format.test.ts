import { digits, formatPhone, timeAgo } from "./format";
import { waChat, waNumber, waShare } from "./whatsapp";

describe("format", () => {
  it("formata telefone com e sem DDI", () => {
    expect(digits("+55 (54) 99999-0000")).toBe("5554999990000");
    expect(formatPhone("54999990000")).toBe("(54) 99999-0000");
    expect(formatPhone("5554999990000")).toBe("(54) 99999-0000");
    expect(formatPhone("5432860000")).toBe("(54) 3286-0000");
    expect(formatPhone("123")).toBe("123");
  });

  it("mostra quanto tempo passou", () => {
    const now = new Date("2026-11-16T12:00:00Z").getTime();
    expect(timeAgo("2026-11-16T11:59:40Z", now)).toBe("agora");
    expect(timeAgo("2026-11-16T11:55:00Z", now)).toBe("há 5 min");
    expect(timeAgo("2026-11-16T09:00:00Z", now)).toBe("há 3 h");
    expect(timeAgo("2026-11-15T11:00:00Z", now)).toBe("há 1 dia");
    expect(timeAgo("2026-11-13T11:00:00Z", now)).toBe("há 3 dias");
  });
});

describe("whatsapp", () => {
  it("completa o DDI e escreve a mensagem", () => {
    expect(waNumber("(54) 99999-0000")).toBe("5554999990000");
    expect(waNumber("5554999990000")).toBe("5554999990000");
    expect(waChat("54999990000", "Olá, tudo bem?")).toBe("https://wa.me/5554999990000?text=Ol%C3%A1%2C%20tudo%20bem%3F");
    expect(waShare("link: https://x")).toBe("https://wa.me/?text=link%3A%20https%3A%2F%2Fx");
  });
});
