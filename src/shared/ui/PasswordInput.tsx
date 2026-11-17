import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import { inputClass } from "./styles";

/**
 * Campo de senha com o olho para mostrar ou esconder o que foi digitado. Mostra só o que está no campo:
 * a senha cadastrada nunca volta da API (só existe o hash, ADR-0020).
 */
export function PasswordInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={cn(inputClass, "pr-12", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 mt-[3px] inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition hover:bg-cream hover:text-ink"
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
