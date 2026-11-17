// Tons da referência de layout (resources/design_tela.jpg), escuros o bastante para as iniciais em branco.
const palette = ["#3227db", "#3d86c6", "#d9654a", "#4b874b", "#b7811c", "#7b4fd6", "#232230", "#c2457a"];

/** Iniciais do nome (até duas letras); "?" sem nome. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

/** Cor fixa para cada nome, para o mesmo cliente ter sempre o mesmo avatar. */
export function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}
