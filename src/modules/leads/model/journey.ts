import { eventLabel, readingTime, type LeadEvent } from "./lead.types";

/**
 * Fora da jornada: o clique "enviou a proposta" da página, que repete o registro da proposta, e a mensagem
 * enviada pelo corretor (RN-03.22), que não é visita do cliente.
 */
const redundant = (e: Pick<LeadEvent, "kind" | "data">) => (e.kind === "acao" && e.data.chave === "enviou_proposta") || e.kind === "mensagem_enviada";

/** Tempo sem atividade que encerra uma visita, como a sessão do Google Analytics. */
export const SESSION_GAP_MS = 30 * 60 * 1000;

/** Eventos que mostram intenção de compra: aparecem marcados na jornada ("eventos-chave"). */
const keyKinds = new Set(["proposta", "contato", "whatsapp", "perfil", "tour_3d"]);
const keyActions = new Set(["enviou_proposta", "subir_contrato", "gerar_proposta", "prefere_corretor", "abriu_3d", "dia_no_apto", "voo_3d"]);

export function isKeyEvent(e: Pick<LeadEvent, "kind" | "data">): boolean {
  return keyKinds.has(e.kind) || (e.kind === "acao" && keyActions.has(String(e.data.chave ?? "")));
}

export interface Session {
  index: number;
  start: string;
  end: string;
  minutes: number;
  /** Link por onde o cliente entrou nessa visita (código do corretor), quando registrado. */
  via: string;
  events: LeadEvent[];
  keyEvents: number;
}

/**
 * Agrupa os eventos em visitas: começa uma nova a cada abertura do link ("visita") ou depois de 30 minutos
 * parado. O registro de tempo por seção fica fora (vai para "Onde passou mais tempo").
 */
export function sessionsOf(events: LeadEvent[]): Session[] {
  const list = events.filter((e) => e.kind !== "tempo" && !redundant(e)).sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id);
  const sessions: Session[] = [];
  let current: LeadEvent[] = [];
  const close = () => {
    if (current.length === 0) return;
    const start = current[0].created_at;
    const end = current[current.length - 1].created_at;
    const visit = current.find((e) => e.kind === "visita");
    sessions.push({
      index: sessions.length + 1,
      start,
      end,
      minutes: Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 60000)),
      via: visit ? String(visit.data.codigo ?? "") : "",
      events: current,
      keyEvents: current.filter(isKeyEvent).length,
    });
    current = [];
  };
  list.forEach((e) => {
    const last = current[current.length - 1];
    if (last && (e.kind === "visita" || Date.parse(e.created_at) - Date.parse(last.created_at) > SESSION_GAP_MS)) close();
    current.push(e);
  });
  close();
  return sessions;
}

export interface Metrics {
  visits: number;
  readingSeconds: number;
  sectionsSeen: number;
  keyEvents: number;
  firstSeen?: string;
  lastSeen?: string;
}

/** Números do topo da análise: visitas, tempo lendo, seções vistas e eventos-chave. */
export function metricsOf(events: LeadEvent[]): Metrics {
  const sessions = sessionsOf(events);
  const sections = new Set(events.filter((e) => e.kind === "secao").map((e) => String(e.data.id ?? "")));
  return {
    visits: sessions.length,
    readingSeconds: readingTime(events).reduce((a, r) => a + r.seconds, 0),
    sectionsSeen: sections.size,
    keyEvents: events.filter((e) => isKeyEvent(e) && !redundant(e)).length,
    firstSeen: sessions[0]?.start,
    lastSeen: sessions[sessions.length - 1]?.end,
  };
}

/** O que o cliente mais fez, por rótulo (sem seções e tempo), maior primeiro. */
export function topActions(events: LeadEvent[]): { label: string; kind: string; n: number; key: boolean }[] {
  const counts = new Map<string, { label: string; kind: string; n: number; key: boolean }>();
  events
    .filter((e) => !["secao", "tempo", "visita"].includes(e.kind) && !redundant(e))
    .forEach((e) => {
      const label = eventLabel(e);
      const c = counts.get(label) ?? { label, kind: e.kind, n: 0, key: isKeyEvent(e) };
      c.n++;
      counts.set(label, c);
    });
  return [...counts.values()].sort((a, b) => Number(b.key) - Number(a.key) || b.n - a.n);
}

/** "4 min 12 s", "45 s", "1 h 05 min". */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return seconds % 60 ? `${m} min ${seconds % 60} s` : `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
}
