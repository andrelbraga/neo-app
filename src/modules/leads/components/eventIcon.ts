import {
  Box,
  Clock,
  Eye,
  FileSignature,
  Image,
  Link2,
  MessageCircle,
  MessagesSquare,
  MousePointerClick,
  Phone,
  UserRound,
  type LucideIcon,
} from "lucide-react";

/** Ícone e cor de cada tipo de evento, na linha do tempo, no feed e nos sinais dos cartões. */
export const eventIcon: Record<string, { icon: LucideIcon; tone: string }> = {
  visita: { icon: Link2, tone: "bg-forest-soft text-forest" },
  secao: { icon: Eye, tone: "bg-line/60 text-ink-muted" },
  galeria: { icon: Image, tone: "bg-teal-soft/40 text-teal" },
  tour_3d: { icon: Box, tone: "bg-teal-soft/50 text-teal" },
  whatsapp: { icon: MessageCircle, tone: "bg-whatsapp/15 text-[#128C4B]" },
  chat_aberto: { icon: MessagesSquare, tone: "bg-forest-soft text-forest" },
  contato: { icon: Phone, tone: "bg-gold-soft text-gold" },
  proposta: { icon: FileSignature, tone: "bg-gold text-white" },
  perfil: { icon: UserRound, tone: "bg-gold-soft text-gold" },
  acao: { icon: MousePointerClick, tone: "bg-line/60 text-ink-muted" },
  tempo: { icon: Clock, tone: "bg-line/60 text-ink-muted" },
};

export function iconFor(kind: string) {
  return eventIcon[kind] ?? eventIcon.acao;
}
