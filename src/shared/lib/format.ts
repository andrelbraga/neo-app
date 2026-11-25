/** Telefone só com dígitos. */
export function digits(s: string): string {
  return s.replace(/\D/g, "");
}

/** (54) 99999-0000 a partir dos dígitos com DDD; com DDI 55, ele é omitido. */
export function formatPhone(phone: string): string {
  let d = digits(phone);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

/** "24/11". */
export function formatDayMonth(iso: string): string {
  return dayMonth.format(new Date(iso));
}

/** "agora", "há 5 min", "há 3 h", "há 2 dias". */
export function timeAgo(iso: string, now = Date.now()): string {
  const min = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "há 1 dia" : `há ${d} dias`;
}

/** Valor em reais: "R$ 150.000" (sem centavos) ou "R$ 3.888,89" (com centavos). */
export function formatBRL(value: number, cents = false): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
}
