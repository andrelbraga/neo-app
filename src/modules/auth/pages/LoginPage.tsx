import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiErrorMessage } from "@/app/providers/api/client";
import { Button, Field, Logo } from "@/shared/ui/ui";
import { buttonClass, inputClass } from "@/shared/ui/styles";
import { authService } from "../services/auth.service";
import { canOpen, homeFor, roleLabel, useAuthStore } from "../store/auth.store";
import { PasswordInput } from "@/shared/ui/PasswordInput";

export function LoginPage() {
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const { setSession, clear, user } = useAuthStore();
  const authenticated = useAuthStore((s) => s.isAuthenticated());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await authService.login({ email, password });
      setSession(session);
      // Só volta para a página anterior se esta conta pode abri-la; senão, vai para a área dela.
      navigate(from && canOpen(session.user, from) ? from : homeFor(session.user), { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="theme-sys panel-bg min-h-screen">
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <Link to="/">
        <Logo />
      </Link>
      <h1 className="mt-8 text-3xl text-ink">Entrar</h1>

      {authenticated && user ? (
        // Já há uma conta neste navegador: deixa continuar com ela ou trocar, em vez de redirecionar sem avisar.
        <section className="card mt-6 space-y-4 p-5">
          <p className="text-sm text-ink">
            Você já está conectado como <b>{user.name}</b> ({roleLabel(user)}).
          </p>
          <Link to={homeFor(user)} className={buttonClass("primary", "w-full")}>
            Continuar como {user.name.split(" ")[0]}
          </Link>
          <Button variant="outline" className="w-full" onClick={clear}>
            Entrar com outra conta
          </Button>
        </section>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field id="email" label="E-mail">
            <input id="email" type="email" autoComplete="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field id="password" label="Senha">
            <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-ink-muted">
        É corretor e ainda não tem conta?{" "}
        <Link to="/cadastro" className="font-semibold text-forest underline">
          Cadastre-se
        </Link>
      </p>
    </main>
    </div>
  );
}
