import { fireEvent, render, screen, within } from "@testing-library/react";
import { ResponsiveTable } from "./ResponsiveTable";

const rows = [
  { id: "1", nome: "Maria da Silva com um nome bem comprido", cidade: "Gramado" },
  { id: "2", nome: "João", cidade: "Canela" },
];

describe("ResponsiveTable", () => {
  it("monta a tabela de layout fixo com as larguras e os cartões para telas menores", () => {
    const open = vi.fn();
    render(
      <ResponsiveTable
        label="Pessoas"
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={open}
        columns={[
          { key: "nome", header: "Nome", width: "70%", cell: (r) => r.nome },
          { key: "cidade", header: "Cidade", width: "30%", align: "right", cell: (r) => r.cidade },
        ]}
        card={(r) => <span>cartão {r.nome}</span>}
      />,
    );
    const table = screen.getByRole("table", { name: "Pessoas" });
    expect(table).toHaveClass("table-fixed");
    expect([...table.querySelectorAll("col")].map((c) => c.style.width)).toEqual(["70%", "30%"]);
    expect(within(table).getByRole("columnheader", { name: "Cidade" })).toHaveClass("text-right");

    const row = within(table).getByText("João").closest("tr")!;
    fireEvent.click(row);
    expect(open).toHaveBeenCalledWith(rows[1]);
    fireEvent.keyDown(row, { key: "Enter" });
    expect(open).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(row, { key: "a" });
    expect(open).toHaveBeenCalledTimes(2);

    const list = screen.getByRole("list", { name: "Pessoas" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getByText("cartão João")).toBeInTheDocument();
  });

  it("sem clique, a linha não vira botão", () => {
    render(<ResponsiveTable label="P" rows={rows} rowKey={(r) => r.id} columns={[{ key: "n", header: "N", width: "100%", cell: (r) => r.nome }]} card={() => null} />);
    expect(screen.getByText("João").closest("tr")).not.toHaveAttribute("tabindex");
  });
});
