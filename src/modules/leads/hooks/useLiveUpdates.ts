import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { eventLabel, type Activity } from "../model/lead.types";
import { adminLeadService, myLeadService } from "../services/lead.service";

/** Eventos que merecem aviso: o cliente chegou ou deu um passo forte. */
const notify = new Set(["visita", "contato", "proposta", "perfil", "whatsapp"]);
const INTERVAL = 10_000;

function browserNotify(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted" || !document.hidden) return;
  try {
    new Notification(title, { body, icon: "/neo360-logo-nova.png" });
  } catch {
    /* navegador sem suporte a notificação fora de service worker */
  }
}

/**
 * Painel ao vivo: consulta o feed e o resumo a cada 10 s e avisa (toast, e notificação do navegador com a
 * aba em segundo plano) quando chega cliente novo, proposta, contato ou toque no WhatsApp. Substitui por
 * ora o aviso por e-mail, que ficou fora desta fase (ADR-0004, P-05). O chat saiu (ADR-0015).
 */
export function useLiveUpdates(area: "corretor" | "admin") {
  const navigate = useNavigate();
  const base = area === "admin" ? "/admin/clientes" : "/painel/clientes";
  const svc = area === "admin" ? adminLeadService : myLeadService;
  const activity = useQuery({ queryKey: [area, "activity"], queryFn: svc.activity, refetchInterval: INTERVAL });
  const summary = useQuery({ queryKey: [area, "summary"], queryFn: svc.summary, refetchInterval: INTERVAL });
  const seen = useRef<Set<string> | null>(null);
  const [permission, setPermission] = useState(typeof Notification === "undefined" ? "denied" : Notification.permission);

  useEffect(() => {
    if (!activity.data) return;
    const key = (a: Activity) => `${a.lead_id}|${a.kind}|${a.created_at}`;
    if (seen.current === null) {
      seen.current = new Set(activity.data.map(key));
      return;
    }
    const fresh = activity.data.filter((a) => !seen.current!.has(key(a)) && notify.has(a.kind));
    activity.data.forEach((a) => seen.current!.add(key(a)));
    fresh.slice(0, 3).forEach((a) => {
      const who = a.lead_name || "Um visitante";
      const what = a.kind === "visita" ? "abriu o seu link" : eventLabel(a).toLowerCase();
      toast(`${who} ${what}`, { description: a.development_name, action: { label: "Abrir", onClick: () => navigate(`${base}/${a.lead_id}`) } });
      browserNotify(`${who} ${what}`, a.development_name);
    });
  }, [activity.data, base, navigate]);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return;
    setPermission(await Notification.requestPermission());
  };

  return { activity, summary, permission, enableNotifications };
}
