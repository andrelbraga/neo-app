import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderPage } from "@/test/render";
import { brokerFixture } from "@/test/fixtures";
import { brokerService } from "@/modules/brokers/services/broker.service";
import { developmentService } from "@/modules/developments/services/development.service";
import { adminLeadService } from "@/modules/leads/services/lead.service";
import { SeeAsSelect } from "../components/SeeAsSelect";
import { useSeeAsStore } from "../store/seeAs.store";
import { AdminHomePage } from "./AdminHomePage";

vi.mock("@/modules/brokers/services/broker.service", () => ({ brokerService: { list: vi.fn() } }));
vi.mock("@/modules/developments/services/development.service", () => ({ developmentService: { list: vi.fn() } }));
vi.mock("@/modules/leads/services/lead.service", () => ({ adminLeadService: { summary: vi.fn(), activity: vi.fn(), list: vi.fn() } }));

const leads = vi.mocked(adminLeadService);
const summary = { leads: 4, identified: 2, new_proposals: 0, sales: 0, sales_value: 0, by_stage: { novo: 4, em_atendimento: 0, proposta: 0, fechado: 0, encerrado: 0 } };

function page() {
  return renderPage(
    <>
      <SeeAsSelect />
      <AdminHomePage />
    </>,
  );
}

describe("AdminHomePage · ver como (RN-01.10)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useSeeAsStore.setState({ broker: null });
    vi.mocked(brokerService.list).mockResolvedValue([brokerFixture]);
    vi.mocked(developmentService.list).mockResolvedValue([]);
    leads.summary.mockResolvedValue(summary);
    leads.activity.mockResolvedValue([]);
    leads.list.mockResolvedValue([]);
  });

  it("mostra a plataforma inteira com o ranking quando ninguém foi escolhido", async () => {
    page();
    expect(await screen.findByText("Sua operação, por inteiro.")).toBeInTheDocument();
    expect(leads.summary).toHaveBeenCalledWith(undefined);
    expect(screen.getByText("Quem mais atrai clientes")).toBeVisible();
  });

  it("ao escolher um corretor, filtra números, feed e clientes por ele e tira o ranking", async () => {
    const user = userEvent.setup();
    page();
    await user.selectOptions(await screen.findByRole("combobox", { name: "Visualizar como" }), await screen.findByRole("option", { name: /Ver como Fabiano Souza/ }));

    expect(await screen.findByText("A operação de Fabiano Souza.")).toBeInTheDocument();
    expect(leads.summary).toHaveBeenCalledWith("b1");
    expect(leads.activity).toHaveBeenCalledWith("b1");
    expect(leads.list).toHaveBeenCalledWith({ broker: "b1" });
    expect(screen.queryByText("Quem mais atrai clientes")).not.toBeInTheDocument();
    expect(screen.queryByText("Corretores ativos")).not.toBeInTheDocument();
    expect(screen.getByText("Em negociação")).toBeInTheDocument();
    expect(useSeeAsStore.getState().broker).toEqual({ id: "b1", name: "Fabiano Souza" });
  });
});
