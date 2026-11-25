import { useQuery } from "@tanstack/react-query";
import { Bell, BellRing, Building2, Home, KeyRound, LayoutGrid, LogOut, MessageSquareText, Search, User, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { SeeAsSelect } from "@/modules/admin/components/SeeAsSelect";
import { useSeeAsStore } from "@/modules/admin/store/seeAs.store";
import { authService } from "@/modules/auth/services/auth.service";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useLiveUpdates } from "@/modules/leads/hooks/useLiveUpdates";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/ui";
import { ProfileMenu } from "./ProfileMenu";

const brokerNav = [
  { to: "/painel", label: "Início", icon: Home, end: true },
  { to: "/painel/clientes", label: "Meus clientes", icon: Users, badge: true },
  { to: "/painel/mensagens", label: "Meus modelos", icon: MessageSquareText },
  { to: "/painel/perfil", label: "Meu perfil", icon: User },
];

const adminNav = [
  { to: "/admin", label: "Visão geral", icon: LayoutGrid, end: true },
  { to: "/admin/clientes", label: "Clientes", icon: Users, badge: true },
  { to: "/admin/empreendimentos", label: "Empreendimentos", icon: Building2 },
  { to: "/admin/profissionais", label: "Profissionais", icon: User },
  { to: "/admin/usuarios", label: "Usuários", icon: KeyRound },
];

/** Título da barra superior: a seção do menu que contém a página aberta. */
function sectionTitle(nav: typeof brokerNav, path: string) {
  const hit = [...nav].sort((a, b) => b.to.length - a.to.length).find((n) => (n.end ? path === n.to : path.startsWith(n.to)));
  return hit?.label ?? nav[0].label;
}

/**
 * Moldura do painel no desenho da Central de trabalho (ADR-0023): barra lateral com marca, ambiente (no admin,
 * o "ver como" um corretor, RN-01.10) e menu com rótulo; barra superior com o caminho da página, busca e avisos.
 * No celular, o menu é uma pílula escura flutuante. Recarrega a conta ao abrir e acompanha os avisos ao vivo.
 */
export function PanelLayout({ area }: { area: "admin" | "corretor" }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { user, setUser, clear } = useAuthStore();
  const me = useQuery({ queryKey: ["me"], queryFn: authService.me });
  const live = useLiveUpdates(area);
  const { broker: seeAsBroker, set: setSeeAs } = useSeeAsStore();
  const seeAs = area === "admin" ? seeAsBroker : null;
  const [q, setQ] = useState(params.get("q") ?? "");
  useEffect(() => {
    if (me.data) setUser(me.data);
  }, [me.data, setUser]);

  const nav = area === "admin" ? adminNav : brokerNav;
  const clientsPath = area === "admin" ? "/admin/clientes" : "/painel/clientes";
  // Propostas dos clientes que ainda não foram abertas: o ponto vermelho do sino, do menu e do avatar.
  const unread = live.summary.data?.new_proposals ?? 0;
  const logout = () => {
    setSeeAs(null);
    clear();
    navigate("/entrar", { replace: true });
  };
  const search = (e: FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    navigate(t ? `${clientsPath}?ver=lista&q=${encodeURIComponent(t)}` : clientsPath);
  };
  const bellOn = live.permission === "granted";
  const account = {
    name: user?.name ?? "?",
    detail: user?.broker?.code ? `${user.broker.code} · ${user.email}` : (user?.email ?? (area === "admin" ? "Administração" : "Corretor")),
    newProposals: unread,
    clientsPath,
    profilePath: area === "corretor" ? "/painel/perfil" : undefined,
    notificationsOn: bellOn,
    onEnableNotifications: live.enableNotifications,
    onLogout: logout,
  };
  const bell = (
    <button
      type="button"
      onClick={bellOn ? () => navigate(clientsPath) : live.enableNotifications}
      aria-label={bellOn ? (unread > 0 ? `${unread} propostas novas` : "Avisos ligados") : "Ativar avisos do navegador"}
      title={bellOn ? "Avisos ligados" : "Ativar avisos"}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-cream hover:text-forest"
    >
      {bellOn ? <BellRing size={19} /> : <Bell size={19} />}
      {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 animate-pop rounded-full bg-rose-500 ring-2 ring-white" />}
    </button>
  );

  const areaTitle = area === "admin" ? "Neo360" : "Corretor";
  const crumb = [areaTitle, seeAs ? `vendo como ${seeAs.name}` : null, sectionTitle(nav, pathname)].filter(Boolean).join(" / ");

  return (
    <div className="theme-sys panel-bg min-h-screen lg:grid lg:grid-cols-[242px_minmax(0,1fr)]">
      {/* Barra lateral da Central (desktop): marca, ambiente, menu com rótulo e o pé com a conta */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-cream-card px-5 py-7 lg:flex">
        <NavLink to={nav[0].to} className="block">
          <Logo className="h-9" />
          <span className="mt-2 block text-[10px] font-semibold tracking-[0.14em] text-ink-muted">CENTRAL DE TRABALHO</span>
        </NavLink>
        <p className="mb-2 mt-7 text-[10px] font-semibold tracking-[0.14em] text-ink-muted">SEU AMBIENTE</p>
        {area === "admin" ? (
          <SeeAsSelect />
        ) : (
          <div className="rounded-[7px] border border-line bg-cream px-2.5 py-2.5 text-xs text-ink">Corretor · {user?.broker?.code ?? "atendimento"}</div>
        )}
        <nav className="mt-5 flex flex-col gap-0.5" aria-label="Menu">
          {nav.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center gap-3 rounded-[7px] px-3 py-[11px] text-sm transition",
                  isActive ? "bg-forest-soft font-semibold text-forest-deep" : "text-ink-muted hover:bg-cream hover:text-ink",
                )
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && unread > 0 && <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-line pt-4">
          <p className="truncate text-xs font-semibold text-ink">{account.name}</p>
          <p className="truncate text-[11px] text-ink-muted">{account.detail}</p>
          <button type="button" onClick={logout} className="mt-3 inline-flex items-center gap-2 text-[11px] text-ink-muted transition hover:text-forest">
            <LogOut size={13} /> Sair
          </button>
          <p className="mt-4 text-[10px] leading-relaxed text-ink-muted">Neo360 · Um lugar para cada parte da negociação.</p>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Barra superior: caminho da página, busca, avisos e conta */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-cream-card/70 px-4 backdrop-blur sm:px-6 lg:h-[68px] lg:px-9">
          <Logo className="h-8 lg:hidden" />
          <p className="min-w-0 truncate text-xs text-ink-muted">{crumb}</p>
          <form onSubmit={search} role="search" className="ml-auto hidden md:block">
            <label className="flex w-64 items-center gap-2 rounded-[7px] border border-line bg-white px-3 py-2 transition focus-within:border-forest/40 focus-within:ring-4 focus-within:ring-forest-soft xl:w-80">
              <Search size={15} className="shrink-0 text-ink-muted" />
              <span className="sr-only">Buscar cliente</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted/70" />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-1 md:ml-2">
            {bell}
            <ProfileMenu variant="top" {...account} />
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-9 lg:pb-10 lg:pt-9">
          <div className="mx-auto w-full max-w-[1600px]">
            {area === "admin" && <SeeAsSelect className="mb-4 lg:hidden" />}
            {seeAs && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[9px] border border-gold/30 bg-gold-soft px-4 py-3 text-sm text-ink">
                <span>
                  <b>Visualizando como {seeAs.name}.</b> Visão geral e clientes mostram só os dele. Somente leitura.
                </span>
                <button type="button" onClick={() => setSeeAs(null)} className="text-xs font-semibold text-forest underline">
                  Voltar à visão Neo360
                </button>
              </div>
            )}
            <form onSubmit={search} role="search" className="mb-4 md:hidden">
              <label className="flex items-center gap-2 rounded-[7px] border border-line bg-white px-3 py-2">
                <Search size={15} className="text-ink-muted" />
                <span className="sr-only">Buscar cliente</span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </label>
            </form>
            <Outlet />
          </div>
        </main>
        <footer className="hidden border-t border-line px-9 py-4 text-[11px] text-ink-muted lg:block">Neo360 · Um lugar para cada parte da negociação.</footer>
      </div>

      {/* Menu do celular: pílula escura flutuante, no estilo da barra de ações da referência */}
      <nav aria-label="Menu do celular" className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 lg:hidden">
        <div className="flex items-center gap-1.5 rounded-full bg-forest-deep p-2 shadow-lift">
          {nav.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                cn("relative inline-flex h-11 items-center justify-center gap-2 rounded-full px-3.5 text-sm font-semibold transition", isActive ? "bg-forest text-white" : "text-white/70 hover:bg-white/10 hover:text-white")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} />
                  {isActive && <span className="hidden sm:inline">{label}</span>}
                  {badge && unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-forest-deep" />}
                </>
              )}
            </NavLink>
          ))}
          <span aria-hidden="true" className="mx-1 h-6 w-px bg-white/15" />
          <button type="button" onClick={logout} aria-label="Sair" className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white">
            <LogOut size={17} />
          </button>
        </div>
      </nav>
    </div>
  );
}
