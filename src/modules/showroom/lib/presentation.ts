/** Layouts da página de apresentação (ADR-0019): A é o padrão; B é a página da entrega v11 (ADR-0021). */
export type Layout = "a" | "b";

/** Lê o layout pedido no link (`?layout=b`); qualquer outro valor fica no A. */
export function layoutFrom(value: string | null): Layout {
  return value?.trim().toLowerCase() === "b" ? "b" : "a";
}

/**
 * Endereço da apresentação no iframe. O layout B fica ao lado do A, com o sufixo `-b`
 * (`index.html` → `index-b.html`). A ponte recebe o layout para registrar qual o cliente viu.
 */
export function presentationSrc(base: string, layout: Layout, params: Record<string, string>): string {
  const path = layout === "b" ? base.replace(/(\.html?)$/i, "-b$1") : base;
  return `${path}?${new URLSearchParams({ ...params, layout })}`;
}
