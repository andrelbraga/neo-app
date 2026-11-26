import { fireEvent, render, screen, within } from "@testing-library/react";
import { ResponsiveTable } from "./ResponsiveTable";

const rows = [
  { id: "1", nome: "Maria da Silva com um nome bem comprido", cidade: "Gramado" },
  { id: "2", nome: "João", cidade: "Canela" },
];

describe("ResponsiveTable", () => {
  it("monta a grade com as mesmas colunas no cabeçalho e nas linhas e os cartões para telas menores", () => {
    const open = vi.fn();
    render(
      <ResponsiveTable
        label="Pessoas"
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={open}
        columns={[
          { key: "sel", header: "Sel", width: "48px", cell: () => <input type="checkbox" aria-label="marcar" /> },
          { key: "nome", header: "Nome", width: "70%", minWidth: "180px", cell: (r) => r.nome },
          { key: "cidade", header: "Cidade", width: "30%", align: "right", cell: (r) => r.cidade },
        ]}
        card={(r) => <span>cartão {r.nome}</span>}
      />,
    );
    const table = screen.getByRole("table", { name: "Pessoas" });
    // Coluna em pixels é fixa; as em porcentagem dividem o resto, com a largura mínima quando houver.
    const rowsEl = within(table).getAllByRole("row");
    expect(rowsEl).toHaveLength(3);
    for (const r of rowsEl) expect(r.style.gridTemplateColumns).toBe("48px minmax(180px, 70fr) minmax(0px, 30fr)");
    expect(within(table).getByRole("columnheader", { name: "Cidade" })).toHaveClass("text-right");
    expect(within(table).getByRole("columnheader", { name: "Sel" })).toHaveClass("justify-center");
    expect(within(table).getAllByRole("checkbox", { name: "marcar" })[0].parentElement).toHaveAttribute("role", "cell");

    const row = within(table).getByText("João").closest('[role="row"]')!;
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
    expect(screen.getByText("João").closest('[role="row"]')).not.toHaveAttribute("tabindex");
  });

  it("com from xl, a tabela e os cartões trocam em 1280 px", () => {
    render(<ResponsiveTable label="P" from="xl" rows={rows} rowKey={(r) => r.id} columns={[{ key: "n", header: "N", width: "100%", cell: (r) => r.nome }]} card={() => null} />);
    expect(screen.getByRole("table", { name: "P" }).parentElement).toHaveClass("hidden", "xl:block");
    expect(screen.getByRole("list", { name: "P" })).toHaveClass("xl:hidden");
  });
});
