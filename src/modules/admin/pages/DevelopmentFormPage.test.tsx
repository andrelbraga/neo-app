import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderPage } from "@/test/render";
import { developmentFixture } from "@/test/fixtures";
import { developmentService } from "@/modules/developments/services/development.service";
import { DevelopmentFormPage } from "./DevelopmentFormPage";

vi.mock("@/modules/developments/services/development.service", () => ({ developmentService: { get: vi.fn(), create: vi.fn(), update: vi.fn() } }));

describe("DevelopmentFormPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("cadastra um empreendimento com destaques", async () => {
    const user = userEvent.setup();
    vi.mocked(developmentService.create).mockResolvedValue({ ...developmentFixture, id: "d9" });
    renderPage(<DevelopmentFormPage />, { path: "/admin/empreendimentos/novo", route: "/admin/empreendimentos/novo" });

    await user.type(screen.getByLabelText("Nome"), "Vale Verde");
    await user.click(screen.getAllByRole("button", { name: /Adicionar/ })[0]);
    await user.type(screen.getByLabelText("Nome 1"), "Área");
    await user.type(screen.getByLabelText("Valor 1"), "70 m²");
    await user.click(screen.getByLabelText(/Publicado/));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(developmentService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Vale Verde", published: true, highlights: [{ label: "Área", value: "70 m²" }], gallery: [] }),
    );
  });

  it("edita o existente sem mandar os campos calculados", async () => {
    const user = userEvent.setup();
    vi.mocked(developmentService.get).mockResolvedValue(developmentFixture);
    vi.mocked(developmentService.update).mockResolvedValue(developmentFixture);
    renderPage(<DevelopmentFormPage />, { path: "/admin/empreendimentos/:id", route: "/admin/empreendimentos/d1" });

    expect(await screen.findByDisplayValue("Boa Vista Residencial")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover galeria 1" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    const [id, body] = vi.mocked(developmentService.update).mock.calls[0];
    expect(id).toBe("d1");
    expect(body.gallery).toEqual([]);
    expect(body).not.toHaveProperty("leads_count");
    expect(body).not.toHaveProperty("developer_name");
    expect(body.developer_id).toBe("o1"); // sem o campo na tela, a incorporadora que já existia é mantida
  });
});
