import { MessageCircle } from "lucide-react";
import { waChat } from "@/shared/lib/whatsapp";
import type { PublicBroker } from "../services/showroom.service";

/**
 * Botão flutuante do WhatsApp do corretor no showroom padrão. A conversa acontece no WhatsApp: o chat da
 * página saiu (ADR-0015).
 */
export function WhatsAppButton({ broker, text, onClick }: { broker: PublicBroker; text: string; onClick: () => void }) {
  const firstName = broker.name.split(" ")[0];
  return (
    <a
      href={waChat(broker.phone, text)}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      aria-label={`Falar com ${firstName} pelo WhatsApp`}
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-whatsapp px-5 py-3.5 text-sm font-semibold text-white shadow-lift transition hover:brightness-95"
    >
      <MessageCircle size={18} /> Falar com {firstName}
    </a>
  );
}
