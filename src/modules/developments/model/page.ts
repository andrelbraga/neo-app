/**
 * Edição da página de apresentação pelo admin (ADR-0027): seções ocultas, blocos desligados e textos trocados.
 * A ponte da página (neo360-bridge.js) aplica a configuração e, no editor, conta as seções e os textos (outline).
 */
export interface PageConfig {
  sections: Record<string, { hidden: boolean }>;
  blocks: Record<string, boolean>;
  texts: TextOverride[];
}

export interface TextOverride {
  section: string;
  from: string;
  to: string;
}

/** O que a página tem para editar, contado pela ponte. */
export interface OutlineSection {
  key: string;
  label: string;
  texts: { text: string; tag: string }[];
  blocks: { key: string; label: string }[];
}

export const emptyPage = (): PageConfig => ({ sections: {}, blocks: {}, texts: [] });

/** Completa o que veio da API (campos podem faltar). */
export function pageFrom(c?: Partial<PageConfig> | null): PageConfig {
  return { sections: { ...(c?.sections ?? {}) }, blocks: { ...(c?.blocks ?? {}) }, texts: [...(c?.texts ?? [])] };
}

export const isHidden = (c: PageConfig, section: string) => !!c.sections[section]?.hidden;
export const blockOn = (c: PageConfig, block: string) => c.blocks[block] !== false;

/** Texto atual de um elemento: o trocado ou o original. */
export function textOf(c: PageConfig, section: string, from: string): string {
  return c.texts.find((t) => t.section === section && t.from === from)?.to ?? from;
}

export function setHidden(c: PageConfig, section: string, hidden: boolean): PageConfig {
  const sections = { ...c.sections };
  if (hidden) sections[section] = { hidden: true };
  else delete sections[section];
  return { ...c, sections };
}

export function setBlock(c: PageConfig, block: string, on: boolean): PageConfig {
  const blocks = { ...c.blocks };
  if (on) delete blocks[block];
  else blocks[block] = false;
  return { ...c, blocks };
}

/** Troca um texto; voltar ao original tira a troca. Vazio esconde o texto na página. */
export function setText(c: PageConfig, section: string, from: string, to: string): PageConfig {
  const texts = c.texts.filter((t) => !(t.section === section && t.from === from));
  if (to !== from) texts.push({ section, from, to });
  return { ...c, texts };
}

/** Quantas mudanças uma seção tem (oculta, blocos e textos), para o selo da lista. */
export function changesIn(c: PageConfig, s: Pick<OutlineSection, "key" | "blocks">): number {
  return (isHidden(c, s.key) ? 1 : 0) + s.blocks.filter((b) => !blockOn(c, b.key)).length + c.texts.filter((t) => t.section === s.key).length;
}

/** Forma canônica, para saber se há mudança não publicada. */
export function samePage(a: PageConfig, b: PageConfig): boolean {
  const canon = (c: PageConfig) =>
    JSON.stringify([
      Object.keys(c.sections)
        .filter((k) => c.sections[k]?.hidden)
        .sort(),
      Object.keys(c.blocks)
        .filter((k) => c.blocks[k] === false)
        .sort(),
      c.texts
        .filter((t) => t.to.trim() !== t.from.trim())
        .map((t) => [t.section, t.from, t.to])
        .sort((x, y) => (x[0] + x[1]).localeCompare(y[0] + y[1])),
    ]);
  return canon(a) === canon(b);
}

/** Nome do tipo de texto no editor. */
export function tagLabel(tag: string): string {
  if (/^h[1-6]$/.test(tag)) return "Título";
  if (tag === "button" || tag === "a") return "Botão ou link";
  if (tag === "li") return "Item de lista";
  if (tag === "label") return "Rótulo";
  return "Texto";
}
