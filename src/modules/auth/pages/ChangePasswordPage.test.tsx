import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { brokerUser } from "@/test/fixtures";
import { renderPage } from "@/test/render";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { ChangePasswordPage } from "./ChangePasswordPage";

vi.mock("../services/auth.service", () => ({ authService: { changePassword: vi.fn() } }));

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.setState({ token: "t", expiresAt: new Date(Date.now() + 3600_000).toISOString(), user: { ...brokerUser, must_change_password: true } });
  });

  it("com senha provisória, pede a provisória e a nova, confere e libera o painel", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.changePassword).mockResolvedValue({ ...brokerUser, must_change_password: false });
    renderPage(<ChangePasswordPage />, { path: "/trocar-senha", route: "/trocar-senha" });
    expect(screen.getByRole("heading", { name: /Crie a sua senha/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cancelar" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Senha provisória"), "k7Hm-2pQx-9sWd");
    await user.type(screen.getByLabelText("Nova senha"), "minha-senha-1");
    await user.type(screen.getByLabelText("Confirme a nova senha"), "outra-coisa-1");
    await user.click(screen.getByRole("button", { name: "Salvar a nova senha" }));
    expect(screen.getByRole("alert")).toHaveTextContent("A confirmação não confere");
    expect(authService.changePassword).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Confirme a nova senha"));
    await user.type(screen.getByLabelText("Confirme a nova senha"), "minha-senha-1");
    await user.click(screen.getByRole("button", { name: "Salvar a nova senha" }));
    await waitFor(() => expect(authService.changePassword).toHaveBeenCalledWith("k7Hm-2pQx-9sWd", "minha-senha-1"));
    await waitFor(() => expect(useAuthStore.getState().user?.must_change_password).toBe(false));
  });
});
