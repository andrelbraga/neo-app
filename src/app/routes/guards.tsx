import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { Permission } from "@/modules/auth/model/auth.types";
import { homeFor, roleLabel, useAuthStore } from "@/modules/auth/store/auth.store";
import { Button } from "@/shared/ui/ui";
import { buttonClass } from "@/shared/ui/styles";

export function ProtectedRoute() {
  const location = useLocation();
  const authenticated = useAuthStore((s) => s.isAuthenticated());
  if (!authenticated) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

const areaName: Record<Permission, string> = { admin: "do administrador", "area.corretor": "do corretor" };

/**
 * Guarda por permissão (RN-01.4). Sem a permissão, diz com qual conta a pessoa está conectada e
 * oferece a área dela ou a troca de conta: o caso comum é admin e corretor testados no mesmo navegador.
 */
export function RequirePermission({ permission }: { permission: Permission }) {
  const navigate = useNavigate();
  const { user, clear } = useAuthStore();
  if (user?.permissions.includes(permission)) return <Outlet />;
  const switchAccount = () => {
    clear();
    navigate("/entrar", { replace: true });
  };
  return (
    <div className="theme-sys panel-bg min-h-screen">
      <main className="mx-auto max-w-md px-4 py-24">
      <section className="card space-y-4 p-6 text-center">
        <h1 className="text-2xl text-ink">Esta tela é a área {areaName[permission]}</h1>
        <p className="text-sm text-ink">
          Você está conectado como <b>{user?.name ?? "outra conta"}</b> ({roleLabel(user)}), que não tem acesso a ela.
        </p>
        <div className="flex flex-col gap-2">
          <Link to={homeFor(user)} className={buttonClass()}>
            Ir para a minha área
          </Link>
          <Button variant="outline" onClick={switchAccount}>
            Sair e entrar com outra conta
          </Button>
        </div>
      </section>
    </main>
    </div>
  );
}
