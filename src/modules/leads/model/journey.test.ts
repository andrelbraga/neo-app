import type { LeadEvent } from "./lead.types";
import { formatDuration, isKeyEvent, metricsOf, sessionsOf, topActions } from "./journey";

const ev = (id: number, kind: string, at: string, data: Record<string, unknown> = {}): LeadEvent => ({ id, kind, data, created_at: at });

const events = [
  ev(1, "visita", "2026-11-16T10:00:00Z", { codigo: "FAB-0427" }),
  ev(2, "secao", "2026-11-16T10:01:00Z", { id: "h-galeria" }),
  ev(3, "tour_3d", "2026-11-16T10:04:00Z"),
  ev(4, "tempo", "2026-11-16T10:05:00Z", { secoes: { "h-neg": 95, "h-galeria": 30 } }),
  // 2 horas depois, sem nova abertura do link: outra visita (mais de 30 min parado)
  ev(5, "secao", "2026-11-16T12:10:00Z", { id: "h-neg" }),
  ev(6, "acao", "2026-11-16T12:12:00Z", { chave: "gerar_proposta" }),
  ev(7, "visita", "2026-11-17T09:00:00Z", { codigo: "ANA-0002" }),
  ev(8, "whatsapp", "2026-11-17T09:02:00Z"),
];

describe("sessionsOf", () => {
  it("separa as visitas pela abertura do link ou por 30 minutos parado, sem o registro de tempo", () => {
    const s = sessionsOf(events);
    expect(s.map((x) => x.events.map((e) => e.id))).toEqual([[1, 2, 3], [5, 6], [7, 8]]);
    expect(s[0]).toMatchObject({ index: 1, minutes: 4, via: "FAB-0427", keyEvents: 1 });
    expect(s[1]).toMatchObject({ via: "", keyEvents: 1 });
    expect(s[2]).toMatchObject({ via: "ANA-0002", minutes: 2 });
    expect(sessionsOf([])).toEqual([]);
    // RN-03.22: a mensagem do corretor não é visita do cliente.
    expect(sessionsOf([ev(9, "mensagem_enviada", "2026-11-18T09:00:00Z", { perfil: "geral", tom: "formal" })])).toEqual([]);
  });
});

describe("metricsOf e topActions", () => {
  it("conta visitas, tempo lendo, seções vistas e eventos-chave", () => {
    expect(metricsOf(events)).toEqual({ visits: 3, readingSeconds: 125, sectionsSeen: 2, keyEvents: 3, firstSeen: "2026-11-16T10:00:00Z", lastSeen: "2026-11-17T09:02:00Z" });
  });

  it("põe os eventos-chave primeiro", () => {
    const top = topActions([...events, ev(9, "galeria", "2026-11-17T09:03:00Z"), ev(10, "galeria", "2026-11-17T09:04:00Z")]);
    expect(top.filter((a) => a.key).map((a) => a.kind)).toEqual(["tour_3d", "acao", "whatsapp"]);
    expect(top[top.length - 1]).toMatchObject({ kind: "galeria", n: 2, key: false });
  });

  it("não repete o clique de enviar proposta, que já é um evento próprio", () => {
    const withClick = [...events, ev(9, "acao", "2026-11-17T09:03:00Z", { chave: "enviou_proposta" }), ev(10, "proposta", "2026-11-17T09:03:00Z")];
    expect(topActions(withClick).map((a) => a.label)).not.toContain("Enviou a proposta");
    expect(sessionsOf(withClick)[2].events.map((e) => e.id)).toEqual([7, 8, 10]);
    expect(metricsOf(withClick).keyEvents).toBe(4);
  });

  it("marca como chave as ações de intenção", () => {
    expect(isKeyEvent(ev(1, "acao", "", { chave: "subir_contrato" }))).toBe(true);
    expect(isKeyEvent(ev(1, "acao", "", { chave: "ampliou_foto" }))).toBe(false);
    expect(isKeyEvent(ev(1, "secao", ""))).toBe(false);
  });
});

it("formata duração", () => {
  expect(formatDuration(45)).toBe("45 s");
  expect(formatDuration(125)).toBe("2 min 5 s");
  expect(formatDuration(120)).toBe("2 min");
  expect(formatDuration(3900)).toBe("1 h 05 min");
});
