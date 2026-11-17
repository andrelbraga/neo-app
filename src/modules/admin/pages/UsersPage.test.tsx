import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { accountAdminService } from "@/modules/auth/services/auth.service";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { adminUser } from "@/test/fixtures";
import { renderPage } from "@/test/render";
import { UsersPage } from "./UsersPage";

vi.mock("@/modules/auth/services/auth.service", () => ({ accountAdminService: { list: vi.fn(), resetPassword: vi.fn() } }));

const accounts = [
  { id: "u9", name: "Central", email: "c@neo360.test", role: "admin" as const, active: true, broker_code: "", must_change_password: false, password_reset_at: null, created_at: "2026-11-16T10:00:00Z" },
  { id: "u1", name: "Fabiano Souza", email: "fab@exemplo.com", role: "corretor" as const, active: true, broker_code: "FAB-0427", must_change_password: true, password_reset_at: "2026-11-17T10:00:00Z", created_at: "2026-11-16T10:00:00Z" },
];

describe("UsersPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: adminUser });
    vi.mocked(accountAdminService.list).mockResolvedValue(accounts);
    vi.mocked(accountAdminService.resetPassword).mockResolvedValue({ temporary_password: "k7Hm-2pQx-9sWd" });
  });

  it("lista os usuários sem nunca mostrar a senha cadastrada", async () => {
    renderPage(<UsersPage />);
    const table = await screen.findByRole("table", { name: "Usuários" });
    expect(within(table).getByText("Central")).toBeInTheDocument();
    expect(within(table).getByText("Corretor · FAB-0427")).toBeInTheDocument();
    expect(within(table).getByText(/protegida/)).toBeInTheDocument();
    expect(within(table).getByText("Provisória · aguardando troca")).toBeInTheDocument();
  });

  it("redefine com senha provisória, escondida por padrão e revelada pelo olho", async () => {
    const user = userEvent.setup();
    renderPage(<UsersPage />);
    const table = await screen.findByRole("table", { name: "Usuários" });
    await user.click(within(table).getByRole("button", { name: "Redefinir a senha de Fabiano Souza" }));
    await user.click(screen.getByRole("button", { name: "Gerar senha provisória" }));
    await waitFor(() => expect(accountAdminService.resetPassword).toHaveBeenCalledWith("u1"));
    const dialog = await screen.findByRole("dialog", { name: "Senha provisória criada" });
    const code = within(dialog).getByLabelText("Senha provisória");
    expect(code).not.toHaveTextContent("k7Hm-2pQx-9sWd");
    await user.click(within(dialog).getByRole("button", { name: "Mostrar senha" }));
    expect(code).toHaveTextContent("k7Hm-2pQx-9sWd");
    await user.click(within(dialog).getByRole("button", { name: "Pronto" }));
    expect(screen.queryByText("k7Hm-2pQx-9sWd")).not.toBeInTheDocument();
  });
});
