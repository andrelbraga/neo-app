import { cn } from "@/shared/lib/cn";

export type Variant = "primary" | "outline" | "ghost" | "whatsapp";

const base =
  "btn inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-forest text-cream hover:bg-forest/90",
  outline: "border border-line bg-cream-card text-forest hover:border-forest",
  ghost: "px-3 text-ink-muted hover:text-forest",
  whatsapp: "bg-whatsapp text-white hover:brightness-95",
};

/** Classes dos botões, também para links. */
export function buttonClass(variant: Variant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

export const inputClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-ink outline-none transition focus:border-forest disabled:opacity-60";

