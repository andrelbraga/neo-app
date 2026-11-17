import { avatarColor, initials } from "./visuals.lib";

describe("avatar", () => {
  it("pega até duas iniciais", () => {
    expect(initials("Maria da Silva")).toBe("MD");
    expect(initials("  ana ")).toBe("A");
    expect(initials("")).toBe("?");
  });

  it("dá sempre a mesma cor para o mesmo nome", () => {
    expect(avatarColor("Maria")).toBe(avatarColor("Maria"));
    expect(avatarColor("Maria")).toMatch(/^#[0-9a-f]{6}$/);
  });
});
