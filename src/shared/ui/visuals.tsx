import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { avatarColor, initials } from "./visuals.lib";

/** Avatar com as iniciais e uma cor fixa por nome. */
export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-xl" };
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white", sizes[size], className)}
      style={{ background: avatarColor(name) }}
    >
      {initials(name)}
    </span>
  );
}

/** Número que sobe até o valor quando aparece ou muda. */
export function CountUp({ value, duration = 700 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current;
    if (start === value || typeof requestAnimationFrame === "undefined") {
      setShown(value);
      from.current = value;
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(start + (value - start) * eased));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{shown}</>;
}

/** Cartão de indicador com ícone, número animado e uma linha de apoio. */
export function KpiCard({ icon, label, value, hint, tone = "forest" }: { icon: ReactNode; label: string; value?: number; hint?: string; tone?: "forest" | "teal" | "gold" | "rose" }) {
  const tones = { forest: "bg-forest-soft text-forest", teal: "bg-teal-soft/40 text-teal", gold: "bg-gold-soft text-gold", rose: "bg-rose-100 text-rose-700" };
  return (
    <div className="card card-hover animate-rise p-4">
      <div className="flex items-center justify-between">
        <small className="text-xs font-medium text-ink-muted">{label}</small>
        <span className={cn("rounded-xl p-2", tones[tone])}>{icon}</span>
      </div>
      <b className="mt-2 block font-serif text-4xl font-semibold text-ink">{value === undefined ? <span className="skeleton inline-block h-9 w-12 align-middle" /> : <CountUp value={value} />}</b>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

/** Ponto pulsando: algo novo ou ao vivo. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2.5 w-2.5", className)} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal" />
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}
