export type DevelopmentStatus = "lancamento" | "em_obras" | "pronto";

export const statusLabel: Record<DevelopmentStatus, string> = {
  lancamento: "Lançamento",
  em_obras: "Em obras",
  pronto: "Pronto para morar",
};

export interface Image {
  url: string;
  caption: string;
}

export interface Highlight {
  label: string;
  value: string;
}

export interface Development {
  id: string;
  slug: string;
  name: string;
  developer_id: string | null;
  developer_name: string;
  city: string;
  state: string;
  status: DevelopmentStatus;
  published: boolean;
  headline: string;
  description: string;
  cover_image_url: string;
  tour_url: string;
  /** Página própria do empreendimento (HTML servido pelo app). Vazia: o showroom usa o modelo padrão. */
  presentation_url: string;
  /** Layout da apresentação quando o link não pede um (ADR-0019). */
  default_layout?: "a" | "b";
  gallery: Image[];
  highlights: Highlight[];
  leads_count: number;
  created_at: string;
  updated_at: string;
}

export type DevelopmentRequest = Omit<Development, "id" | "developer_name" | "leads_count" | "created_at" | "updated_at">;
