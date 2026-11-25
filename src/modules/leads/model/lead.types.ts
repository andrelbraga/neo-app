import { formatPhone } from "@/shared/lib/format";

export type Stage = "novo" | "em_atendimento" | "proposta" | "fechado" | "encerrado";

/** Etapas do funil (RN-03.6): três em aberto e dois desfechos. */
export const stages: Stage[] = ["novo", "em_atendimento", "proposta", "fechado", "encerrado"];
/** Etapas em que a negociação ainda está aberta, na ordem em que o cliente avança. */
export const openStages: Stage[] = ["novo", "em_atendimento", "proposta"];
export const isOutcome = (s: Stage) => s === "fechado" || s === "encerrado";

export const stageLabel: Record<Stage, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  proposta: "Proposta",
  fechado: "Venda fechada",
  encerrado: "Sem venda",
};

export interface Lead {
  id: string;
  development_id: string;
  development_name: string;
  development_slug: string;
  broker_id: string;
  broker_name: string;
  broker_code: string;
  name: string;
  phone: string;
  stage: Stage;
  events_count: number;
  /** Propostas do cliente que o corretor ainda não abriu. */
  new_proposals: number;
  /** Tipos de evento que o cliente já gerou (tour, proposta, WhatsApp...). */
  signals: string[];
  last_activity_at: string;
  created_at: string;
  /** Desfecho: venda fechada (valor e proposta de base) ou sem venda (motivo em outcome_note). */
  outcome_at: string | null;
  sale_value: number | null;
  sale_proposal_id: string | null;
  outcome_note: string;
  /** Layout da apresentação na primeira visita (ADR-0019). */
  layout?: "a" | "b";
  /** "link": chegou pelo link do corretor; "corretor": o corretor cadastrou (RN-03.16). */
  origin?: "link" | "corretor";
  /** Código do link de convite do cliente cadastrado pelo corretor. */
  invite_code?: string;
  /** Perfil de compra (RN-03.17); vazio é "sem perfil". */
  profile?: Profile;
  /** Quando o corretor arquivou o cliente (RN-03.19); nulo nos ativos. */
  archived_at?: string | null;
  /** Último envio pelo WhatsApp que o corretor confirmou (RN-03.22); nulo se nunca enviou. */
  last_message_at?: string | null;
}

/** Perfis de compra que o corretor escolhe na ficha (RN-03.17). */
export type Profile = "" | "moradia" | "investimento" | "veraneio";
export const profiles: Profile[] = ["", "moradia", "investimento", "veraneio"];
export const profileLabel: Record<Profile, string> = { "": "Sem perfil", moradia: "Moradia", investimento: "Investimento", veraneio: "Veraneio" };

/** Tons das mensagens do WhatsApp (RN-03.20). */
export type MessageTone = "formal" | "proximo" | "direto";
export const tones: MessageTone[] = ["formal", "proximo", "direto"];
export const toneLabel: Record<MessageTone, string> = { formal: "Formal", proximo: "Próximo", direto: "Direto" };

/** Perfil dos modelos: "geral" vale para quem não tem perfil. */
export type TemplateProfile = "geral" | Exclude<Profile, "">;
export const templateProfiles: TemplateProfile[] = ["geral", "moradia", "investimento", "veraneio"];
export const templateProfileLabel: Record<TemplateProfile, string> = { geral: "Sem perfil", moradia: "Moradia", investimento: "Investimento", veraneio: "Veraneio" };

/** Modelo de mensagem: o texto do corretor (`custom`) ou o padrão. */
export interface MessageTemplate {
  profile: TemplateProfile;
  tone: MessageTone;
  body: string;
  custom: boolean;
}

/** Edição do cliente pelo corretor (RN-03.18). */
export interface LeadUpdate {
  name: string;
  phone: string;
  profile: Profile;
}

/** Cliente que o corretor cadastra à mão (RN-03.16). */
export interface NewClient {
  development_id: string;
  name: string;
  phone: string;
}

export type ImportStatus = "ok" | "nome_invalido" | "telefone_invalido" | "repetido_no_arquivo" | "ja_e_seu" | "ja_cadastrado";

/** Situação de cada linha da planilha, em português, para a conferência. */
export const importStatusLabel: Record<ImportStatus, string> = {
  ok: "Pronto para cadastrar",
  nome_invalido: "Sem nome",
  telefone_invalido: "WhatsApp inválido: use DDD e número",
  repetido_no_arquivo: "Repetido na planilha",
  ja_e_seu: "Já é seu cliente",
  ja_cadastrado: "Já cadastrado neste empreendimento",
};

export interface ImportRow {
  line: number;
  name: string;
  phone: string;
  status: ImportStatus;
  lead_id?: string;
}

/** Conferência (dry_run) ou resultado da importação da planilha. */
export interface ImportReport {
  dry_run: boolean;
  total: number;
  valid: number;
  created: number;
  rows: ImportRow[];
}

export interface LeadEvent {
  id: number;
  kind: string;
  data: Record<string, unknown>;
  created_at: string;
}

/** Proposta como vem da API: a do cliente (apresentação) ou um ajuste do corretor (RN-03.12). */
export interface ApiProposal {
  id: string;
  author: "cliente" | "corretor";
  based_on: string | null;
  condition: Record<string, unknown>;
  summary: string;
  note: string;
  wants_contract: boolean;
  /** Nome e WhatsApp com que o cliente enviou (ADR-0016): as propostas do mesmo WhatsApp ficam juntas. */
  client_name?: string;
  client_phone?: string;
  seen_at: string | null;
  created_at: string;
}

export interface LeadDetail extends Lead {
  events: LeadEvent[];
  proposals: ApiProposal[];
}

export interface Summary {
  leads: number;
  identified: number;
  new_proposals: number;
  sales: number;
  sales_value: number;
  by_stage: Record<Stage, number>;
  /** Conversão por layout da apresentação (ADR-0019). */
  by_layout?: Record<"a" | "b", LayoutStats>;
}

export interface LayoutStats {
  leads: number;
  with_proposal: number;
  sales: number;
  sales_value: number;
}

/** Pedido de mudança de etapa. Venda fechada leva o valor; sem venda, o motivo em `note`. */
export interface StageChange {
  stage: Stage;
  sale_value?: number;
  proposal_id?: string;
  note?: string;
}

/** Evento recente com o cliente, para o feed "ao vivo". */
export interface Activity {
  lead_id: string;
  lead_name: string;
  development_name: string;
  broker_name: string;
  kind: string;
  data: Record<string, unknown>;
  created_at: string;
}

export interface LeadFilter {
  stage?: string;
  /** "1" lista os arquivados (RN-03.19). */
  arquivados?: string;
  development?: string;
  broker?: string;
}

/** Nome do cliente, ou "Visitante" enquanto ele não informou o nome. */
export function leadName(l: Pick<Lead, "name">) {
  return l.name || "Visitante sem nome";
}

/** Seções do modelo padrão e da apresentação do protótipo (aria-labelledby das seções). */
const sectionLabel: Record<string, string> = {
  hero: "o início da página",
  destaques: "os destaques",
  galeria: "a galeria",
  tour: "o tour 3D",
  contato: "o contato",
  Apresentação: "a apresentação",
  "Seu consultor": "o seu cartão de consultor",
  "Crie seu perfil": "o convite para criar perfil",
  "Incorporadora responsável": "o cartão da incorporadora",
  "Imobiliária parceira": "o cartão da imobiliária",
  "h-galeria": "a galeria de fotos",
  "h-planta": "a planta e o 3D",
  "h-emp": "torres, vagas e áreas comuns",
  "h-sim": "o simulador de condições",
  "h-neg": "a montagem da proposta",
  "h-quem": "quem constrói",
  "h-ind": "os números da região",
  "h-vid": "o vídeo de uso",
  "h-duv": "a seção de dúvidas",
  estudos: "os estudos de investimento",
};

/** Cliques da apresentação do protótipo (regAcao), em português. */
const actionLabel: Record<string, string> = {
  abriu_3d: "Abriu o apartamento em 3D",
  abriu_maquete: "Abriu a maquete do empreendimento",
  abriu_maquete_104: "Foi direto ao apartamento 104-A na maquete",
  abriu_planta: "Abriu a planta",
  ampliou_foto: "Ampliou uma foto",
  usou_sol: "Mexeu na posição do sol",
  viu_video: "Assistiu ao vídeo",
  abriu_perfil: "Abriu o perfil de cliente",
  gerar_proposta: "Montou uma proposta",
  enviou_proposta: "Enviou a proposta",
  subir_contrato: "Pediu para seguir para o contrato",
  prefere_corretor: "Preferiu falar com o corretor",
  aceitou_medicao: "Aceitou a medição da página",
  mexeu_entrada: "Ajustou a entrada",
  mexeu_parcelas: "Ajustou as parcelas",
  mexeu_reforcos: "Ajustou os reforços",
  mexeu_chaves: "Ajustou o pagamento nas chaves",
  abriu_chat: "Abriu o chat",
  usou_simulador: "Usou o simulador",
  viu_fechamento: "Viu o fechamento da proposta",
  subir_contrato_teste: "Testou seguir para o contrato",
  voo_3d: "Sobrevoou o condomínio em 3D",
  dia_no_apto: "Viu um dia no apartamento",
  layout_a: "Viu o layout A da apresentação",
  layout_b: "Viu o layout B da apresentação",
  abriu_planta3d_viva: "Abriu a planta 3D pela planta viva",
  // Layout B, página da entrega v11 (ADR-0021)
  veiculo_on: "Incluiu veículo na proposta",
  veiculo_off: "Tirou o veículo da proposta",
  fechou_fechamento: "Fechou o fechamento da proposta",
  mexeu_simulador: "Mexeu no simulador",
  exportou_rascunho: "Exportou o rascunho da proposta",
};

/** O que o cliente fez, em português, para a linha do tempo. */
export function eventLabel(e: Pick<LeadEvent, "kind" | "data">): string {
  switch (e.kind) {
    case "visita":
      return "Abriu o link";
    case "secao":
      return `Viu ${sectionLabel[String(e.data.id)] ?? "uma seção"}`;
    case "galeria":
      return `Abriu a foto ${e.data.caption ? `"${String(e.data.caption)}"` : "da galeria"}`;
    case "tour_3d":
      return "Entrou no tour 3D";
    case "whatsapp":
      return "Tocou em falar pelo WhatsApp";
    case "chat_aberto":
      return "Abriu o chat";
    case "contato": {
      // Troca de dados (RN-03.10): mostra o que era antes, para o corretor não perder o contato antigo.
      const antes = e.data.antes as { nome?: string; whatsapp?: string } | undefined;
      if (!antes) return "Deixou nome e WhatsApp";
      const old = [antes.nome, antes.whatsapp && formatPhone(antes.whatsapp)].filter(Boolean).join(" · ");
      return `Trocou nome ou WhatsApp (antes: ${old})`;
    }
    case "edicao": {
      // Edição do corretor (RN-03.18): mostra o que era antes.
      const antes = e.data.antes as { nome?: string; whatsapp?: string } | undefined;
      const old = [antes?.nome, antes?.whatsapp && formatPhone(antes.whatsapp)].filter(Boolean).join(" · ");
      return old ? `Você editou nome ou WhatsApp (antes: ${old})` : "Você editou o cliente";
    }
    case "proposta":
      return e.data.autorizou_contrato ? "Enviou proposta e pediu o contrato" : "Enviou uma proposta";
    case "perfil":
      return "Criou o perfil de cliente";
    case "acao": {
      const k = String(e.data.chave ?? "");
      return actionLabel[k] ?? (k.startsWith("comodo_") ? "Abriu um ambiente na planta" : k.startsWith("estacao_") ? "Viu o sol em outra estação" : k.startsWith("veiculos_") ? "Escolheu a quantidade de veículos" : "Interagiu com a página");
    }
    case "tempo":
      return "Tempo de leitura registrado";
    default:
      return e.kind;
  }
}

/** Sinais de interesse mostrados nos cartões, do mais forte ao mais fraco. */
export const signalOrder = ["proposta", "perfil", "contato", "whatsapp", "tour_3d", "galeria"] as const;
export type Signal = (typeof signalOrder)[number];

export const signalLabel: Record<Signal, string> = {
  proposta: "Enviou proposta",
  perfil: "Criou perfil",
  contato: "Deixou WhatsApp",
  whatsapp: "Chamou no WhatsApp",
  tour_3d: "Viu o 3D",
  galeria: "Viu fotos",
};

/** Segundos por seção somados dos eventos de tempo, maior primeiro (apresentação do protótipo). */
export function readingTime(events: LeadEvent[]): { id: string; label: string; seconds: number }[] {
  const last = [...events].reverse().find((e) => e.kind === "tempo");
  const secoes = (last?.data.secoes ?? {}) as Record<string, number>;
  return Object.entries(secoes)
    .map(([id, seconds]) => ({ id, label: sectionLabel[id] ?? id, seconds: Math.round(Number(seconds) || 0) }))
    .filter((s) => s.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds);
}

/** Busca por nome, telefone, empreendimento ou corretor. */
export function matchesLead(l: Lead, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return [leadName(l), l.phone, l.development_name, l.broker_name].some((v) => (v ?? "").toLowerCase().includes(t));
}
