import type { ButtonHTMLAttributes, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";
import { buttonClass, type Variant } from "./styles";

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function Field({ id, label, hint, className, children }: { id: string; label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, eyebrow, action }: { title: string; subtitle?: string; eyebrow?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{eyebrow}</span>}
        <h1 className="mt-1 text-[34px] leading-tight text-ink md:text-[40px]">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("card p-5", className)}>{children}</div>;
}

export function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-4">
      <small className="block text-xs text-ink-muted">{label}</small>
      <b className="font-serif text-3xl font-semibold text-ink">{value}</b>
    </div>
  );
}

export type Tone = "green" | "gold" | "gray" | "red" | "blue" | "ok" | "coral";

const badgeTones: Record<Tone, { pill: string; text: string; dot: string }> = {
  green: { pill: "bg-forest-soft text-forest", text: "text-forest", dot: "bg-forest" },
  gold: { pill: "bg-gold-soft text-gold", text: "text-gold", dot: "bg-gold" },
  gray: { pill: "bg-line text-ink-muted", text: "text-ink-muted", dot: "bg-ink-muted/60" },
  red: { pill: "bg-rose-100 text-rose-700", text: "text-rose-600", dot: "bg-rose-500" },
  blue: { pill: "bg-teal-soft/60 text-teal", text: "text-teal", dot: "bg-teal" },
  ok: { pill: "bg-ok/10 text-ok", text: "text-ok", dot: "bg-ok" },
  coral: { pill: "bg-coral-soft text-coral", text: "text-coral", dot: "bg-coral" },
};

/**
 * Etiqueta de situação, como na referência de layout: ponto colorido e texto curto em caixa alta.
 * `pill` põe o fundo (cabeçalho da ficha); sem ele, fica só ponto e texto (listas).
 */
export function Badge({ tone = "green", pill = true, children }: { tone?: Tone; pill?: boolean; children: ReactNode }) {
  const t = badgeTones[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.06em]",
        pill ? cn("rounded-full px-2.5 py-1", t.pill) : t.text,
      )}
    >
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", pill && tone === "coral" ? "bg-white/90" : t.dot)} />
      {children}
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card px-6 py-10 text-center">
      <b className="block text-ink">{title}</b>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Janela sobre a página para os formulários do admin. Fecha no X ou no Esc. */
/**
 * Janela por cima da página inteira (fora de painéis e gavetas, que cortariam a posição fixa). Centralizada
 * quando cabe; mais alta que a tela, rola sem cortar o título.
 */
export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-ink/40 p-3 sm:p-6"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="card my-auto w-full max-w-2xl p-5 shadow-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-full px-2 text-2xl leading-none text-ink-muted hover:text-forest">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Loading() {
  return <p className="py-10 text-center text-sm text-ink-muted">Carregando…</p>;
}

/** Logo da Neo360, o mesmo arquivo usado na apresentação do protótipo (img/neo360-logo-nova.png). */
export function Logo({ className }: { className?: string }) {
  return <img src="/neo360-logo-nova.png" alt="Neo 360" className={cn("h-10 w-auto select-none", className)} draggable={false} />;
}
