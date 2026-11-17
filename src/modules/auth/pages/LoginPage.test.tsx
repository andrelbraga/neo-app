import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { adminUser, brokerUser } from "@/test/fixtures";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { LoginPage } from "./LoginPage";

vi.mock("../services/auth.service", () => ({ authService: { login: vi.fn() } }));

function Where() {
  return <p>em {useLocation().pathname}</p>;
}

function openLogin(from?: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[{ pathname: "/entrar", state: from ? { from } : null }]}>
        <Routes>
          <Route path="/entrar" element={<LoginPage />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function login() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("E-mail"), "x@x.com");
  await user.type(screen.getByLabelText("Senha"), "senha-longa");
  await user.click(screen.getByRole("button", { name: "Entrar" }));
}

const session = (user: typeof adminUser) => ({ token: "t", expires_at: new Date(Date.now() + 60_000).toISOString(), user });

describe("LoginPage", () => {
  beforeEach(() => useAuthStore.getState().clear());

  it("volta para a página anterior quando a conta pode abri-la", async () => {
    vi.mocked(authService.login).mockResolvedValue(session(adminUser));
    openLogin("/admin/clientes");
    await login();
    expect(await screen.findByText("em /admin/clientes")).toBeInTheDocument();
  });

  it("vai para a área da conta quando a página anterior é de outro papel", async () => {
    vi.mocked(authService.login).mockResolvedValue(session(brokerUser));
    openLogin("/admin");
    await login();
    expect(await screen.findByText("em /painel")).toBeInTheDocument();
  });

  it("mostra o erro do login", async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error("x"));
    openLogin();
    await login();
    expect(await screen.findByText("Não foi possível concluir a operação.")).toBeInTheDocument();
  });
});
