import { useCallback, useEffect, useRef, useState } from "react";
import { showroomService, visitorToken, type PageEvent, type Visit } from "../services/showroom.service";

/**
 * Abre a visita uma vez por página e devolve o token e o `track`. Falha de rastreio nunca
 * atrapalha o cliente: o evento é descartado em silêncio.
 */
export function useVisit(slug: string, code: string, enabled: boolean, invite = "") {
  const [visit, setVisit] = useState<Visit | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || started.current) return;
    started.current = true;
    showroomService
      .visit(slug, code, visitorToken.get(slug), invite)
      .then((v) => {
        visitorToken.set(slug, v.token);
        setVisit(v);
      })
      .catch(() => {});
  }, [slug, code, enabled, invite]);

  const track = useCallback(
    (kind: PageEvent, data: Record<string, unknown> = {}) => {
      if (visit) showroomService.track(visit.token, kind, data).catch(() => {});
    },
    [visit],
  );

  return { visit, setVisit, track };
}
