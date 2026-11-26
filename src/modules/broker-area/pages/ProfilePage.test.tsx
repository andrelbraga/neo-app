import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { authService } from "@/modules/auth/services/auth.service";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { brokerUser } from "@/test/fixtures";
import { renderPage } from "@/test/render";
import { ProfilePage } from "./ProfilePage";

vi.mock("@/modules/auth/services/auth.service", () => ({ authService: { updateProfile: vi.fn(), setPhoto: vi.fn(), removePhoto: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const auth = vi.mocked(authService);

describe("ProfilePage: foto do corretor (RN-01.11)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.setState({ user: brokerUser });
  });

  it("sem foto mostra as iniciais; enviar guarda a foto e mostra na hora", async () => {
    const user = userEvent.setup();
    auth.setPhoto.mockResolvedValue({ photo_path: "/public/media/brokers/abc.jpg" });
    renderPage(<ProfilePage />);
    expect(screen.getByText("FS")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remover foto" })).not.toBeInTheDocument();

    const file = new File(["x"], "eu.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("Escolher foto"), file);
    await waitFor(() => expect(auth.setPhoto).toHaveBeenCalledWith(file));
    const img = await screen.findByRole("img", { name: "Sua foto" });
    expect(img.getAttribute("src")).toMatch(/\/public\/media\/brokers\/abc\.jpg$/);
    expect(useAuthStore.getState().user?.broker?.photo_path).toBe("/public/media/brokers/abc.jpg");
    expect(screen.getByRole("button", { name: "Trocar foto" })).toBeInTheDocument();
  });

  it("remover volta às iniciais", async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ user: { ...brokerUser, broker: { ...brokerUser.broker!, photo_path: "/public/media/brokers/abc.jpg" } } });
    auth.removePhoto.mockResolvedValue({ photo_path: "" });
    renderPage(<ProfilePage />);
    await user.click(screen.getByRole("button", { name: "Remover foto" }));
    await waitFor(() => expect(auth.removePhoto).toHaveBeenCalled());
    expect(await screen.findByText("FS")).toBeInTheDocument();
    expect(useAuthStore.getState().user?.broker?.photo_path).toBe("");
  });
});
