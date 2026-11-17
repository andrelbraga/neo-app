import { digits } from "./format";

/** Número no formato do wa.me: com DDI 55 quando vier só com DDD. */
export function waNumber(phone: string): string {
  const d = digits(phone);
  return d.length <= 11 ? `55${d}` : d;
}

/** Conversa com um número, com a mensagem já escrita. */
export function waChat(phone: string, text: string): string {
  return `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;
}

/** Compartilhar um texto pelo WhatsApp, escolhendo o contato no próprio app. */
export function waShare(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
