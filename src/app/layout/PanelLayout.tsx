import { useQuery } from "@tanstack/react-query";
import { Bell, BellRing, Building2, Home, LayoutGrid, LogOut, Search, User, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "@/modules/auth/services/auth.service";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useLiveUpdates } from "@/modules/leads/hooks/useLiveUpdates";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/ui";
import { ProfileMenu } from "./ProfileMenu";

const brokerNav = [
  { to: "/painel", label: "Início", icon: Home, end: true },
  { to: "/painel/clientes", label: "Meus clientes", icon: Users, badge: true },
  { to: "/painel/perfil", label: "Meu perfil", icon: User },
];

const adminNav = [
  { to: "/admin", label: "Visão geral", icon: LayoutGrid, end: true },
  { to: "/admin/clientes", label: "Clientes", icon: Users, badge: true },
  { to: "/admin/empreendimentos", label: "Empreendimentos", icon: Building2 },
  { to: "/admin/profissionais", label: "Profissionais", icon: User },
];

/** Título da barra superior: a seção do menu que contém a página aberta. */
function sectionTitle(nav: typeof brokerNav, path: string) {
  const hit = [...nav].sort((a, b) => b.to.length - a.to.length).find((n) => (n.end ? path === n.to : path.startsWith(n.to)));
  return hit?.label ?? nav[0].label;
}

/**
 * Moldura do painel, no desenho da referência de layout (resources/design_tela.jpg, ADR-0013): barra superior
 * com título, busca e avisos; menu de ícones à esquerda; conteúdo sobre fundo lavanda. No celular, o menu é
 * uma pílula escura flutuante. Recarrega a conta ao abrir e acompanha os avisos ao vivo.
 */
export function PanelLayout({ area }: { area: "admin" | "corretor" }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { user, setUser, clear } = useAuthStore();
  const me = useQuery({ queryKey: ["me"], queryFn: authService.me });
  const live = useLiveUpdates(area);
  const [q, setQ] = useState(params.get("q") ?? "");
  useEffect(() => {
    if (me.data) setUser(me.data);
  }, [me.data, setUser]);

  const nav = area === "admin" ? adminNav : brokerNav;
  const clientsPath = area === "admin" ? "/admin/clientes" : "/painel/clientes";
  // Propostas dos clientes que ainda não foram abertas: o ponto vermelho do sino, do menu e do avatar.
  const unread = live.summary.data?.new_proposals ?? 0;
  const logout = () => {
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

  return (
    <div className="theme-sys panel-bg min-h-screen">
      <div className="flex min-h-screen flex-col bg-cream-card">
        {/* Barra superior */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-cream-card/95 px-4 backdrop-blur sm:px-5 lg:h-[72px] lg:pl-0">
          <div className="flex shrink-0 items-center lg:w-[84px] lg:justify-center">
            <Logo className="h-8 lg:h-9" />
          </div>
          <p className="min-w-0 truncate text-lg font-bold tracking-tight text-ink lg:text-xl">{sectionTitle(nav, pathname)}</p>
          <form onSubmit={search} role="search" className="ml-auto hidden md:block">
            <label className="flex w-64 items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-3 pr-1.5 transition focus-within:border-forest/40 focus-within:ring-4 focus-within:ring-forest-soft xl:w-80">
              <Search size={15} className="shrink-0 text-ink-muted" />
              <span className="sr-only">Buscar cliente</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted/70" />
              <span className="shrink-0 rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-ink">Clientes</span>
            </label>
          </form>
          <div className="ml-auto flex items-center gap-1 md:ml-2">
            {bell}
            <ProfileMenu variant="top" {...account} />
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Menu de ícones (desktop) */}
          {/* z-20: o menu fixo forma uma camada própria; acima do conteúdo (para os rótulos e o menu da conta sobreporem)
              e abaixo da barra superior (z-30). */}
          <aside className="sticky top-[72px] z-20 hidden h-[calc(100vh-72px)] w-[84px] shrink-0 flex-col items-center pb-5 pt-3 lg:flex">
            <nav className="flex flex-col items-center gap-2" aria-label="Menu">
              {nav.map(({ to, label, icon: Icon, end, badge }, i) => (
                <div key={to} className="flex flex-col items-center gap-2">
                  {i > 0 && i % 2 === 0 && <span aria-hidden="true" className="h-1 w-1 rounded-full bg-line" />}
                  <NavLink
                    to={to}
                    end={end}
                    aria-label={label}
                    className={({ isActive }) =>
                      cn(
                        "group relative inline-flex h-11 w-11 items-center justify-center rounded-full transition",
                        isActive ? "bg-forest-soft text-forest" : "text-ink-muted hover:bg-cream hover:text-ink",
                      )
                    }
                  >
                    <Icon size={19} />
                    {badge && unread > 0 && <span className="absolute -top-0.5 right-0 h-2.5 w-2.5 animate-pop rounded-full bg-rose-500 ring-2 ring-white" />}
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-forest-deep px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lift transition group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                      {label}
                    </span>
                  </NavLink>
                </div>
              ))}
            </nav>
            <div className="mt-auto flex flex-col items-center gap-3">
              <ProfileMenu variant="rail" {...account} />
              <button type="button" onClick={logout} aria-label="Sair" title="Sair" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink-muted transition hover:bg-forest-soft hover:text-forest">
                <LogOut size={16} />
              </button>
            </div>
          </aside>

          {/* Conteúdo sobre o fundo lavanda, com o canto superior arredondado como na referência */}
          <main className="min-w-0 flex-1 bg-cream px-4 pb-28 pt-5 sm:px-6 lg:rounded-tl-[28px] lg:px-7 lg:pb-10 lg:pt-7 2xl:px-10">
            <div className="mx-auto w-full max-w-[1600px]">
              <form onSubmit={search} role="search" className="mb-4 md:hidden">
                <label className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2">
                  <Search size={15} className="text-ink-muted" />
                  <span className="sr-only">Buscar cliente</span>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                </label>
              </form>
              <Outlet />
            </div>
          </main>
        </div>
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
