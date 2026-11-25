import { inviteLink } from "@/modules/developments/services/development.service";
import type { Lead } from "./lead.types";

/**
 * Mensagem de convite para o cliente cadastrado pelo corretor (RN-03.16): o texto do link exclusivo
 * (RN-02.4) com o nome do cliente e o link de convite dele. Vazio se o cliente não tem convite.
 */
export function inviteMessage(l: Pick<Lead, "name" | "development_name" | "development_slug" | "broker_code" | "invite_code">, origin = window.location.origin): string {
  if (!l.invite_code) return "";
  const first = l.name.trim().split(/\s+/)[0];
  const link = inviteLink(l.development_slug, l.broker_code, l.invite_code, origin);
  return `Olá, ${first}! Separei para você o ${l.development_name}. Veja fotos, planta, condições e a maquete 3D: ${link}`;
}
