import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderPage } from "@/test/render";
import { brokerUser } from "@/test/fixtures";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { SignupPage } from "./SignupPage";

vi.mock("../services/auth.service", () => ({ authService: { signup: vi.fn() } }));

describe("SignupPage", () => {
  it("cadastra o corretor sem CRECI e entra na área dele", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.signup).mockResolvedValue({ token: "t", expires_at: new Date(Date.now() + 60_000).toISOString(), user: brokerUser });
    renderPage(<SignupPage />);

    await user.type(screen.getByLabelText("Nome"), "Fabiano");
    await user.type(screen.getByLabelText("Sobrenome"), "Souza");
    await user.type(screen.getByLabelText("WhatsApp"), "54999990000");
    await user.type(screen.getByLabelText("E-mail"), "fab@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "senha-longa");
    await user.click(screen.getByRole("button", { name: "Criar minha conta" }));

    expect(authService.signup).toHaveBeenCalledWith({
      first_name: "Fabiano",
      last_name: "Souza",
      phone: "54999990000",
      creci: "",
      email: "fab@exemplo.com",
      password: "senha-longa",
    });
    expect(await screen.findByText("outra rota")).toBeInTheDocument();
    expect(useAuthStore.getState().user?.broker?.code).toBe("FAB-0427");
  });

  it("mostra o erro da API", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.signup).mockRejectedValue(new Error("x"));
    renderPage(<SignupPage />);
    await user.type(screen.getByLabelText("Nome"), "A");
    await user.type(screen.getByLabelText("Sobrenome"), "B");
    await user.type(screen.getByLabelText("WhatsApp"), "1");
    await user.type(screen.getByLabelText("E-mail"), "a@b.com");
    await user.type(screen.getByLabelText("Senha"), "12345678");
    await user.click(screen.getByRole("button", { name: "Criar minha conta" }));
    expect(await screen.findByText("Não foi possível concluir a operação.")).toBeInTheDocument();
  });
});
