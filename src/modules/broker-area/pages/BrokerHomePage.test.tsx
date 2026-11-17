import { screen } from "@testing-library/react";
import { renderPage } from "@/test/render";
import { brokerUser, developmentFixture } from "@/test/fixtures";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { developmentService } from "@/modules/developments/services/development.service";
import { myLeadService } from "@/modules/leads/services/lead.service";
import { BrokerHomePage } from "./BrokerHomePage";

vi.mock("@/modules/developments/services/development.service", async (orig) => ({
  ...(await orig<typeof import("@/modules/developments/services/development.service")>()),
  developmentService: { published: vi.fn() },
}));
vi.mock("@/modules/leads/services/lead.service", () => ({ myLeadService: { summary: vi.fn(), activity: vi.fn() } }));

describe("BrokerHomePage", () => {
  it("mostra o link exclusivo do corretor e o envio pelo WhatsApp", async () => {
    useAuthStore.setState({ user: brokerUser });
    vi.mocked(developmentService.published).mockResolvedValue([developmentFixture]);
    vi.mocked(myLeadService.summary).mockResolvedValue({
      leads: 3,
      identified: 1,
      new_proposals: 2,
      sales: 1,
      sales_value: 360000,
      by_stage: { novo: 1, em_atendimento: 0, proposta: 1, fechado: 1, encerrado: 0 },
    });
    vi.mocked(myLeadService.activity).mockResolvedValue([
      { lead_id: "l1", lead_name: "Maria", development_name: "Boa Vista Residencial", broker_name: "Fabiano", kind: "proposta", data: {}, created_at: new Date().toISOString() },
    ]);
    renderPage(<BrokerHomePage />);

    const link = `${window.location.origin}/e/boa-vista-residencial/FAB-0427`;
    expect(await screen.findByDisplayValue(link)).toBeInTheDocument();
    const share = screen.getByRole("link", { name: /Enviar pelo WhatsApp/ });
    expect(decodeURIComponent(share.getAttribute("href")!)).toContain(link);
    expect(await screen.findByText("Propostas novas")).toBeInTheDocument();
    expect(screen.getByText("Vendas fechadas")).toBeInTheDocument();
    expect(screen.getByText(/360\.000 vendidos/)).toBeInTheDocument();
    expect(await screen.findByText("enviou uma proposta")).toBeInTheDocument();
    expect(screen.getByText("Funil")).toBeInTheDocument();
  });
});
