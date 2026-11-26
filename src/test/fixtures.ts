import type { Broker, User } from "@/modules/auth/model/auth.types";
import type { Development } from "@/modules/developments/model/development.types";
import type { Lead, LeadDetail } from "@/modules/leads/model/lead.types";

export const brokerFixture: Broker = {
  id: "b1",
  user_id: "u1",
  first_name: "Fabiano",
  last_name: "Souza",
  email: "fab@exemplo.com",
  phone: "54999990000",
  creci: "12345-F",
  code: "FAB-0427",
  agency_id: null,
  agency_name: "",
  agency_logo_url: "",
  photo_path: "",
  active: true,
  leads_count: 2,
  created_at: "2026-11-16T10:00:00Z",
};

export const brokerUser: User = {
  id: "u1",
  name: "Fabiano Souza",
  email: "fab@exemplo.com",
  role: "corretor",
  permissions: ["area.corretor"],
  broker: brokerFixture,
};

export const adminUser: User = { id: "u9", name: "Central", email: "c@neo360.test", role: "admin", permissions: ["admin"] };

export const developmentFixture: Development = {
  id: "d1",
  slug: "boa-vista-residencial",
  name: "Boa Vista Residencial",
  developer_id: "o1",
  developer_name: "Dwell",
  city: "Gramado",
  state: "RS",
  status: "lancamento",
  published: true,
  headline: "Invista em Gramado",
  description: "Um apartamento na planta na Serra Gaúcha.",
  cover_image_url: "/showroom/boa-vista/img/hero-gramado.jpg",
  tour_url: "/showroom/boa-vista/maquete.html?embed=1",
  presentation_url: "",
  default_layout: "a",
  gallery: [{ url: "/showroom/boa-vista/img/fachada.jpg", caption: "Fachada" }],
  highlights: [{ label: "Área privativa", value: "54 m²" }],
  leads_count: 3,
  created_at: "2026-11-16T10:00:00Z",
  updated_at: "2026-11-16T10:00:00Z",
};

export const leadFixture: Lead = {
  id: "l1",
  development_id: "d1",
  development_name: "Boa Vista Residencial",
  development_slug: "boa-vista-residencial",
  broker_id: "b1",
  broker_name: "Fabiano Souza",
  broker_code: "FAB-0427",
  name: "Maria",
  phone: "54977776666",
  stage: "proposta",
  events_count: 6,
  new_proposals: 1,
  signals: ["visita", "tour_3d", "proposta"],
  last_activity_at: new Date().toISOString(),
  created_at: "2026-11-16T10:00:00Z",
  outcome_at: null,
  sale_value: null,
  sale_proposal_id: null,
  outcome_note: "",
};

export const leadDetailFixture: LeadDetail = {
  ...leadFixture,
  events: [
    { id: 1, kind: "visita", data: { codigo: "FAB-0427" }, created_at: "2026-11-16T10:00:00Z" },
    { id: 2, kind: "secao", data: { id: "galeria" }, created_at: "2026-11-16T10:01:00Z" },
    { id: 3, kind: "tour_3d", data: {}, created_at: "2026-11-16T10:02:00Z" },
    { id: 4, kind: "proposta", data: { proposal_id: "p1", resumo: "Entrada de R$ 150 mil e saldo em 36 parcelas", autorizou_contrato: true }, created_at: "2026-11-16T10:04:00Z" },
    { id: 5, kind: "perfil", data: { tipo: "Apartamento", regiao: "Gramado e Canela", prazo: "Até 3 meses" }, created_at: "2026-11-16T10:05:00Z" },
    { id: 6, kind: "tempo", data: { secoes: { "h-neg": 95, "h-galeria": 30 } }, created_at: "2026-11-16T10:06:00Z" },
    // Segunda visita, no dia seguinte, pelo mesmo link
    { id: 7, kind: "visita", data: { codigo: "FAB-0427" }, created_at: "2026-11-17T09:00:00Z" },
    { id: 8, kind: "whatsapp", data: { origem: "duvida" }, created_at: "2026-11-17T09:02:00Z" },
    { id: 9, kind: "proposta", data: { proposal_id: "p2", resumo: "Entrada de R$ 200 mil" }, created_at: "2026-11-17T09:05:00Z" },
  ],
  proposals: [
    {
      id: "p2",
      author: "cliente",
      based_on: null,
      summary: "Entrada de R$ 200 mil, 2 reforços de R$ 15 mil e saldo em 36 parcelas",
      note: "Posso dar o carro na entrada?",
      wants_contract: false,
      client_name: "Maria",
      client_phone: "54977776666",
      seen_at: null,
      created_at: "2026-11-17T09:05:00Z",
      condition: {
        preco: 370000,
        preco_referencia: 460000,
        campanha: "Condição especial de lançamento",
        validade: "30/11/2026",
        entrada: 200000,
        entrada_parcelas: 1,
        parcelas: 36,
        parcela_valor: 2777.78,
        saldo: 100000,
        reforcos: 2,
        reforco_valor: 15000,
        chaves: 0,
        veiculos: [{ modelo: "Compass 2022", ano: "2022", km: "30000", valor: 40000 }],
        sujeita_aprovacao: false,
      },
    },
    {
      id: "p1",
      author: "cliente",
      based_on: null,
      summary: "Entrada de R$ 150 mil e saldo em 36 parcelas",
      note: "",
      wants_contract: true,
      seen_at: "2026-11-16T10:10:00Z",
      created_at: "2026-11-16T10:04:00Z",
      condition: {},
    },
  ],
};
