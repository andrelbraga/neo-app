import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Corretor que o admin escolheu para "ver como" (RN-01.10). Vazio é a visão de toda a plataforma. */
export interface SeeAs {
  id: string;
  name: string;
}

interface SeeAsState {
  broker: SeeAs | null;
  set: (broker: SeeAs | null) => void;
}

/** Vale só nesta aba do navegador: ao fechar ou sair, o admin volta à visão da plataforma. */
export const useSeeAsStore = create<SeeAsState>()(
  persist((set) => ({ broker: null, set: (broker) => set({ broker }) }), { name: "neo360-see-as", storage: createJSONStorage(() => sessionStorage) }),
);
