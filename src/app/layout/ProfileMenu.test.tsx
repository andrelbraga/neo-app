import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderPage } from "@/test/render";
import { ProfileMenu } from "./ProfileMenu";

const base = {
  name: "Fabiano Souza",
  detail: "FAB-0427 · fab@exemplo.com",
  newProposals: 2,
  clientsPath: "/painel/clientes",
  profilePath: "/painel/perfil",
  notificationsOn: false,
  variant: "rail" as const,
};

describe("ProfileMenu", () => {
  it("abre ao tocar no avatar e mostra conta, mensagens, perfil, avisos e sair", async () => {
    const user = userEvent.setup();
    const onEnable = vi.fn();
    const onLogout = vi.fn();
    renderPage(<ProfileMenu {...base} onEnableNotifications={onEnable} onLogout={onLogout} />);

    const trigger = screen.getByRole("button", { name: "Conta de Fabiano Souza, 2 propostas novas" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu", { name: "Conta" })).toHaveTextContent("FAB-0427 · fab@exemplo.com");
    expect(screen.getByRole("menuitem", { name: /Propostas novas/ })).toHaveAttribute("href", "/painel/clientes");
    expect(screen.getByRole("menuitem", { name: "Meu perfil" })).toHaveAttribute("href", "/painel/perfil");

    await user.click(screen.getByRole("menuitem", { name: "Ativar avisos do navegador" }));
    expect(onEnable).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: "Sair" }));
    expect(onLogout).toHaveBeenCalled();
  });

  it("fecha no Esc e não mostra perfil para o admin", async () => {
    const user = userEvent.setup();
    renderPage(<ProfileMenu {...base} newProposals={0} profilePath={undefined} notificationsOn variant="top" onEnableNotifications={vi.fn()} onLogout={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Conta de Fabiano Souza" }));
    expect(screen.queryByRole("menuitem", { name: "Meu perfil" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Avisos do navegador ligados/ })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
