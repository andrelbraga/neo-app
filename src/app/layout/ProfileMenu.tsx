import { Bell, BellRing, ChevronDown, FileSignature, LogOut, User } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/visuals";

interface Props {
  name: string;
  detail: string;
  /** Propostas dos clientes que ainda não foram abertas. */
  newProposals: number;
  clientsPath: string;
  profilePath?: string;
  notificationsOn: boolean;
  onEnableNotifications: () => void;
  onLogout: () => void;
  /** "top": avatar com nome na barra superior; "rail": só o avatar, no pé do menu lateral. */
  variant: "top" | "rail";
}

/**
 * Menu da conta: abre no avatar da barra superior e no do menu lateral. Mostra quem está conectado,
 * as propostas novas, o perfil, os avisos do navegador e a saída. Fecha no Esc, num clique fora ou ao escolher.
 */
export function ProfileMenu({ name, detail, newProposals: unread, clientsPath, profilePath, notificationsOn, onEnableNotifications, onLogout, variant }: Props) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const close = () => setOpen(false);
  const item = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition hover:bg-cream focus-visible:bg-cream focus-visible:outline-none";

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Conta de ${name}${unread > 0 ? `, ${unread} propostas novas` : ""}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex items-center gap-2.5 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-soft",
          variant === "top" ? "py-1 pl-1 pr-2 hover:bg-cream" : "p-1 hover:bg-cream",
          open && "bg-cream",
        )}
      >
        <span className="relative">
          <Avatar name={name} size="sm" />
          {unread > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pop rounded-full bg-rose-500 ring-2 ring-white" />}
        </span>
        {variant === "top" && (
          <>
            <span className="hidden min-w-0 text-left leading-tight xl:block">
              <b className="block max-w-[11rem] truncate text-sm text-ink">{name}</b>
              <small className="block text-[11px] text-ink-muted">{detail}</small>
            </span>
            <ChevronDown size={15} className={cn("hidden text-ink-muted transition sm:block", open && "rotate-180")} />
          </>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Conta"
          className={cn(
            "absolute z-50 w-72 animate-rise rounded-2xl bg-cream-card p-2 shadow-lift ring-1 ring-line",
            variant === "top" ? "right-0 top-full mt-2" : "bottom-0 left-full ml-3",
          )}
        >
          <div className="flex items-center gap-3 px-3 pb-3 pt-2">
            <Avatar name={name} size="md" />
            <div className="min-w-0">
              <b className="block truncate text-sm text-ink">{name}</b>
              <small className="block truncate text-xs text-ink-muted">{detail}</small>
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link role="menuitem" to={clientsPath} onClick={close} className={item}>
            <FileSignature size={16} className="text-ink-muted" />
            <span className="flex-1">Propostas novas</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", unread > 0 ? "bg-rose-500 text-white" : "bg-cream text-ink-muted")}>{unread}</span>
          </Link>
          {profilePath && (
            <Link role="menuitem" to={profilePath} onClick={close} className={item}>
              <User size={16} className="text-ink-muted" /> Meu perfil
            </Link>
          )}
          {notificationsOn ? (
            <span role="menuitem" aria-disabled="true" className={cn(item, "cursor-default text-ok hover:bg-transparent")}>
              <BellRing size={16} /> Avisos do navegador ligados
            </span>
          ) : (
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                onEnableNotifications();
                close();
              }}
              className={item}
            >
              <Bell size={16} className="text-ink-muted" /> Ativar avisos do navegador
            </button>
          )}
          <div className="my-1 h-px bg-line" />
          <button role="menuitem" type="button" onClick={onLogout} className={cn(item, "text-rose-600 hover:bg-rose-50")}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      )}
    </div>
  );
}
