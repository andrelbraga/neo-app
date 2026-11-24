import { useQuery } from "@tanstack/react-query";
import { brokerService } from "@/modules/brokers/services/broker.service";
import { cn } from "@/shared/lib/cn";
import { useSeeAsStore } from "../store/seeAs.store";

/**
 * "Visualizar como" da Central (RN-01.10): o admin escolhe um corretor e a visão geral e os clientes passam a
 * mostrar só os dele. É leitura: nada muda na conta do corretor.
 */
export function SeeAsSelect({ className }: { className?: string }) {
  const brokers = useQuery({ queryKey: ["admin-brokers"], queryFn: brokerService.list });
  const { broker, set } = useSeeAsStore();
  return (
    <label className={cn("block", className)}>
      <span className="sr-only">Visualizar como</span>
      <select
        value={broker?.id ?? ""}
        onChange={(e) => {
          const b = brokers.data?.find((x) => x.id === e.target.value);
          set(b ? { id: b.id, name: `${b.first_name} ${b.last_name}` } : null);
        }}
        className="w-full rounded-[7px] border border-line bg-cream px-2 py-2.5 text-xs text-ink outline-none focus:border-forest"
      >
        <option value="">Neo360 · Administração</option>
        {brokers.data?.map((b) => (
          <option key={b.id} value={b.id}>
            Ver como {b.first_name} {b.last_name}
          </option>
        ))}
      </select>
    </label>
  );
}
