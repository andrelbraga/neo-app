import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { adminUser, brokerUser } from "@/test/fixtures";
import { AppRoutes } from "./AppRoutes";

vi.mock("@/app/providers/api/client", async (orig) => ({
  ...(await orig<typeof import("@/app/providers/api/client")>()),
  api: { get: vi.fn(() => new Promise(() => {})), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}));

function at(route: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const session = (user: typeof brokerUser) =>
  useAuthStore.setState({ token: "t", expiresAt: new Date(Date.now() + 60_000).toISOString(), user });

describe("AppRoutes", () => {
  afterEach(() => useAuthStore.getState().clear());

  it("manda para o login quem não entrou", () => {
    at("/painel");
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });

  it("o corretor abre a área dele e não abre o admin", () => {
    session(brokerUser);
    at("/painel");
    expect(within(screen.getByRole("navigation", { name: "Menu" })).getByRole("link", { name: /Meus clientes/ })).toBeInTheDocument();

    useAuthStore.getState().clear();
    session(brokerUser);
    at("/admin/profissionais");
    expect(screen.getByRole("heading", { name: "Esta tela é a área do administrador" })).toBeInTheDocument();
    expect(screen.getByText(/conectado como/)).toHaveTextContent("Fabiano Souza (corretor)");
  });

  it("troca de conta pelo aviso de acesso restrito", async () => {
    session(brokerUser);
    at("/admin");
    await userEvent.setup().click(screen.getByRole("button", { name: "Sair e entrar com outra conta" }));
    expect(useAuthStore.getState().token).toBeNull();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });

  it("o login com conta ativa mostra quem está conectado e deixa trocar", async () => {
    session(adminUser);
    at("/entrar");
    expect(screen.getByText(/já está conectado como/)).toHaveTextContent("Central (administrador)");
    await userEvent.setup().click(screen.getByRole("button", { name: "Entrar com outra conta" }));
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
  });

  it("o admin abre o painel administrativo", () => {
    session(adminUser);
    at("/admin");
    expect(within(screen.getByRole("navigation", { name: "Menu" })).getByRole("link", { name: /Empreendimentos/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Imobiliárias|Incorporadoras/ })).not.toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Menu" })).getByRole("link", { name: /Profissionais/ })).toBeInTheDocument();
  });

  it("o showroom é público", () => {
    at("/e/boa-vista-residencial/FAB-0427");
    expect(screen.getByText("Carregando…")).toBeInTheDocument();
  });

  it("com senha provisória, qualquer tela leva à troca de senha", () => {
    session({ ...brokerUser, must_change_password: true });
    at("/painel");
    expect(screen.getByRole("heading", { name: /Crie a sua senha/ })).toBeInTheDocument();
  });
});
