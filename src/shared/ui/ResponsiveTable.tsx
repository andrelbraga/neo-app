import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface Column<T> {
  key: string;
  header: ReactNode;
  /**
   * Largura da coluna no desktop. Em pixels ("44px") é fixa: checkbox, ícone, menu. Em porcentagem ("24%") é a
   * parte do espaço que sobra depois das fixas, na proporção das porcentagens.
   */
  width: string;
  /** Largura mínima de uma coluna em porcentagem, para o conteúdo não ser cortado (ex.: "132px"). */
  minWidth?: string;
  align?: "left" | "center" | "right";
  cell: (row: T) => ReactNode;
}

interface Props<T> {
  label: string;
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Cartão da linha nas telas menores que `from`. */
  card: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  /** A partir de qual largura vira tabela: lg (1024 px, padrão) ou xl (1280 px), para tabelas com muitas colunas. */
  from?: "lg" | "xl";
}

// Classes inteiras (o Tailwind só gera as que aparecem escritas no código).
const showTable = { lg: "hidden lg:block", xl: "hidden xl:block" };
const showCards = { lg: "lg:hidden", xl: "xl:hidden" };

const alignClass = { left: "justify-start text-left", center: "justify-center text-center", right: "justify-end text-right" };

const isFixed = (width: string) => width.trim().endsWith("px");

/**
 * Tabela da aplicação. A partir de 1024 px (ou 1280 px, com `from="xl"`) é uma grade com a mesma divisão de
 * colunas no cabeçalho e em todas as linhas: as colunas fixas (checkbox, menu) nunca são espremidas, e o texto que não cabe nas outras termina em
 * reticências, então as linhas têm a mesma altura em qualquer monitor. Abaixo disso vira uma lista de cartões,
 * sem rolagem lateral.
 */
export function ResponsiveTable<T>({ label, rows, columns, rowKey, card, onRowClick, from = "lg" }: Props<T>) {
  const grid: CSSProperties = {
    gridTemplateColumns: columns.map((c) => (isFixed(c.width) ? c.width.trim() : `minmax(${c.minWidth ?? "0px"}, ${parseFloat(c.width) || 1}fr)`)).join(" "),
  };
  const keyDown = (row: T) => (e: KeyboardEvent) => {
    if (onRowClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onRowClick(row);
    }
  };
  // Coluna fixa: conteúdo centralizado na largura dela e sem corte (o foco do checkbox e o menu ficam inteiros).
  const cellClass = (c: Column<T>) =>
    cn("flex min-w-0 items-center", isFixed(c.width) ? "px-2" : "px-4", alignClass[c.align ?? (isFixed(c.width) ? "center" : "left")]);
  return (
    <>
      <div className={cn(showTable[from], "rounded-2xl bg-cream px-2 pb-2")}>
        <div role="table" aria-label={label} className="text-sm">
          <div role="rowgroup">
            <div role="row" className="grid pb-2 pt-3" style={grid}>
              {columns.map((c) => (
                <div key={c.key} role="columnheader" className={cn(cellClass(c), "text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted")}>
                  {isFixed(c.width) ? c.header : <span className="truncate">{c.header}</span>}
                </div>
              ))}
            </div>
          </div>
          <div role="rowgroup" className="grid gap-2">
            {rows.map((row) => (
              <div
                key={rowKey(row)}
                role="row"
                style={grid}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={keyDown(row)}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  "group grid min-h-16 rounded-xl bg-cream-card py-2 shadow-soft transition duration-200",
                  onRowClick && "cursor-pointer hover:relative hover:z-10 hover:shadow-lift focus-visible:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest",
                )}
              >
                {columns.map((c) => (
                  <div key={c.key} role="cell" className={cellClass(c)}>
                    {isFixed(c.width) ? c.cell(row) : <div className="min-w-0 truncate">{c.cell(row)}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ul className={cn("grid gap-3 sm:grid-cols-2", showCards[from])} aria-label={label}>
        {rows.map((row) => (
          <li key={rowKey(row)}>{card(row)}</li>
        ))}
      </ul>
    </>
  );
}
