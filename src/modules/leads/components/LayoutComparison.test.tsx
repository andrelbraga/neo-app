import { render, screen, within } from "@testing-library/react";
import { layoutRates } from "../model/layout";
import { LayoutComparison } from "./LayoutComparison";

const summary = {
  leads: 50,
  identified: 30,
  new_proposals: 0,
  sales: 4,
  sales_value: 1440000,
  by_stage: { novo: 10, em_atendimento: 10, proposta: 26, fechado: 4, encerrado: 0 },
  by_layout: {
    a: { leads: 30, with_proposal: 6, sales: 1, sales_value: 360000 },
    b: { leads: 20, with_proposal: 8, sales: 3, sales_value: 1080000 },
  },
};

describe("LayoutComparison", () => {
  it("mostra clientes, propostas e vendas de cada layout e destaca o que converte mais em proposta", () => {
    render(<LayoutComparison summary={summary} />);
    const box = screen.getByRole("region", { name: "Layout A × B" });
    expect(within(box).getByText("Layout A").closest("div")!.parentElement).toHaveTextContent(/Clientes30Enviaram proposta6 · 20%Vendas1 · 3%/);
    expect(within(box).getByText("Layout B").closest("div")!.parentElement).toHaveTextContent(/Clientes20Enviaram proposta8 · 40%Vendas3 · 15%/);
    expect(within(box).getAllByText("converte mais")).toHaveLength(1);
    expect(within(box).getByText("Layout B").parentElement).toHaveTextContent("converte mais");
    expect(within(box).getByText(/menos de 30 clientes/)).toBeInTheDocument();
  });

  it("sem clientes nos dois, não aponta vencedor", () => {
    render(<LayoutComparison summary={{ ...summary, by_layout: { a: { leads: 3, with_proposal: 1, sales: 0, sales_value: 0 }, b: { leads: 0, with_proposal: 0, sales: 0, sales_value: 0 } } }} />);
    expect(screen.queryByText("converte mais")).not.toBeInTheDocument();
  });

  it("calcula as taxas sem dividir por zero", () => {
    expect(layoutRates({ leads: 0, with_proposal: 0, sales: 0, sales_value: 0 })).toEqual({ proposal: 0, sale: 0 });
    expect(layoutRates({ leads: 8, with_proposal: 3, sales: 1, sales_value: 0 })).toEqual({ proposal: 38, sale: 13 });
  });
});
