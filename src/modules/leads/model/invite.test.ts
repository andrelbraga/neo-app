import { inviteMessage } from "./invite";

describe("inviteMessage", () => {
  const lead = { name: " Maria  Souza", development_name: "Boa Vista Residencial", development_slug: "boa-vista-residencial", broker_code: "FAB-0427", invite_code: "abc234" };

  it("chama pelo primeiro nome e leva o link de convite do cliente (RN-03.16)", () => {
    expect(inviteMessage(lead, "https://neo.app")).toBe(
      "Olá, Maria! Separei para você o Boa Vista Residencial. Veja fotos, planta, condições e a maquete 3D: https://neo.app/e/boa-vista-residencial/FAB-0427?convite=abc234",
    );
  });

  it("fica vazia sem convite", () => {
    expect(inviteMessage({ ...lead, invite_code: "" })).toBe("");
  });
});
