import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  /** Largura da coluna no desktop (ex.: "24%"). As larguras somadas devem dar 100%. */
  width: string;
  align?: "left" | "center" | "right";
  cell: (row: T) => ReactNode;
}

interface Props<T> {
  label: string;
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Cartão da linha em telas menores que 1024 px. */
  card: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
}

const alignClass = { left: "text-left", center: "text-center", right: "text-right" };

/**
 * Tabela da aplicação. A partir de 1024 px é uma tabela de layout fixo: cada coluna tem a largura
 * definida e o texto que não cabe termina em reticências, então as linhas têm a mesma altura em
 * qualquer monitor. Abaixo disso vira uma lista de cartões, sem rolagem lateral.
 */
export function ResponsiveTable<T>({ label, rows, columns, rowKey, card, onRowClick }: Props<T>) {
  const keyDown = (row: T) => (e: KeyboardEvent) => {
    if (onRowClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onRowClick(row);
    }
  };
  return (
    <>
      <div className="hidden rounded-2xl bg-cream px-2 pb-1 lg:block">
        <table className="w-full table-fixed border-separate border-spacing-y-2 text-left text-sm" aria-label={label}>
          <colgroup>
            {columns.map((c) => (
              <col key={c.key} style={{ width: c.width }} />
            ))}
          </colgroup>
          <thead className="text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn("truncate px-4 pb-0 pt-3 font-semibold", alignClass[c.align ?? "left"])}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={keyDown(row)}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  "group h-16 bg-cream-card shadow-soft transition duration-200",
                  onRowClick && "cursor-pointer hover:relative hover:z-10 hover:shadow-lift focus-visible:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest",
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-2 align-middle transition-[padding] duration-200 first:rounded-l-xl last:rounded-r-xl", onRowClick && "group-hover:py-3", alignClass[c.align ?? "left"])}>
                    <div className="min-w-0 truncate">{c.cell(row)}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:hidden" aria-label={label}>
        {rows.map((row) => (
          <li key={rowKey(row)}>{card(row)}</li>
        ))}
      </ul>
    </>
  );
}
