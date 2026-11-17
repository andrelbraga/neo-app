import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import { leadName, stageLabel, type Lead, type StageChange } from "../model/lead.types";
import { myLeadService } from "../services/lead.service";

/** Muda a etapa e atualiza ficha, listas e resumo. Desfazer em caso de erro fica com quem chama (quadro). */
export function useStageChange(onError?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lead, change }: { lead: Lead; change: StageChange }) => myLeadService.setStage(lead.id, change),
    onSuccess: (_, { lead, change }) => {
      toast.success(`${leadName(lead)}: ${stageLabel[change.stage]}`);
      qc.invalidateQueries({ queryKey: ["lead"] });
      qc.invalidateQueries({ queryKey: ["my-leads"] });
      qc.invalidateQueries({ queryKey: ["corretor", "summary"] });
    },
    onError: (e) => {
      toast.error(apiErrorMessage(e));
      onError?.();
    },
  });
}

