import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import { leadName, type Lead } from "../model/lead.types";
import { myLeadService } from "../services/lead.service";

/** Arquivar e restaurar: o "excluir" do corretor, sem apagar nada (RN-03.19). */
export function useArchive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (l: Lead) => (l.archived_at ? myLeadService.restore(l.id) : myLeadService.archive(l.id)),
    onSuccess: (l) => {
      toast.success(l.archived_at ? `${leadName(l)} arquivado. Veja em "Arquivados".` : `${leadName(l)} de volta aos clientes`);
      qc.invalidateQueries({ queryKey: ["lead"] });
      qc.invalidateQueries({ queryKey: ["my-leads"] });
      qc.invalidateQueries({ queryKey: ["corretor", "summary"] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}
