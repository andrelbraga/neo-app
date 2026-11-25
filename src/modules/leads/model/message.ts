import { brokerLink, inviteLink } from "@/modules/developments/services/development.service";
import type { Lead, MessageTemplate, MessageTone, TemplateProfile } from "./lead.types";

type MessageLead = Pick<Lead, "name" | "development_name" | "development_slug" | "broker_code" | "broker_name" | "invite_code" | "profile">;

/** Perfil do modelo de um cliente: o dele ou, sem perfil, o geral (RN-03.20). */
export function templateProfileOf(l: Pick<Lead, "profile">): TemplateProfile {
  return l.profile || "geral";
}

/** Link que vai na mensagem: o convite do cliente cadastrado ou o link exclusivo do corretor. */
export function messageLink(l: MessageLead, origin = window.location.origin): string {
  return l.invite_code ? inviteLink(l.development_slug, l.broker_code, l.invite_code, origin) : brokerLink(l.development_slug, l.broker_code, origin);
}

/** Preenche {nome}, {empreendimento}, {link} e {corretor} do modelo com os dados do cliente. */
export function fillTemplate(body: string, l: MessageLead, origin = window.location.origin): string {
  const first = (s: string) => s.trim().split(/\s+/)[0] ?? "";
  // Sem nome (visitante que não deixou contato), a saudação fica sem ele: "Olá, {nome}." vira "Olá.".
  if (!l.name.trim()) body = body.replace(/,\s*\{nome\}/g, "").replace(/\{nome\},?\s*(\S)/g, (_, c: string) => c.toUpperCase());
  const values: Record<string, string> = {
    nome: first(l.name),
    empreendimento: l.development_name,
    link: messageLink(l, origin),
    corretor: first(l.broker_name),
  };
  return body.replace(/\{(nome|empreendimento|link|corretor)\}/g, (_, k: string) => values[k]);
}

/** Acha o modelo de um perfil e tom na lista do corretor. */
export function findTemplate(list: MessageTemplate[] | undefined, profile: TemplateProfile, tone: MessageTone): MessageTemplate | undefined {
  return list?.find((t) => t.profile === profile && t.tone === tone);
}
