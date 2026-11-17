import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiErrorMessage } from "@/app/providers/api/client";
import { Button, Field, Logo } from "@/shared/ui/ui";
import { inputClass } from "@/shared/ui/styles";
import type { SignupRequest } from "../model/auth.types";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { PasswordInput } from "@/shared/ui/PasswordInput";

const empty: SignupRequest = { first_name: "", last_name: "", phone: "", email: "", creci: "", password: "" };

/** Cadastro aberto do corretor: entra e já gera o link (RN-01.1). CRECI é opcional (RN-01.2). */
export function SignupPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof SignupRequest) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setSession(await authService.signup(form));
      navigate("/painel", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="theme-sys panel-bg min-h-screen">
      <main className="mx-auto max-w-lg px-4 py-12">
      <Link to="/">
        <Logo />
      </Link>
      <h1 className="mt-8 text-3xl text-ink">Cadastro do corretor</h1>
      <p className="mt-1 text-sm text-ink-muted">Em um minuto você tem seu link exclusivo para enviar aos clientes.</p>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field id="first_name" label="Nome">
          <input id="first_name" className={inputClass} value={form.first_name} onChange={set("first_name")} required autoComplete="given-name" />
        </Field>
        <Field id="last_name" label="Sobrenome">
          <input id="last_name" className={inputClass} value={form.last_name} onChange={set("last_name")} required autoComplete="family-name" />
        </Field>
        <Field id="phone" label="WhatsApp" hint="Com DDD. É por ele que o cliente fala com você.">
          <input id="phone" className={inputClass} value={form.phone} onChange={set("phone")} required inputMode="tel" autoComplete="tel" placeholder="(54) 99999-0000" />
        </Field>
        <Field id="creci" label="CRECI (opcional)">
          <input id="creci" className={inputClass} value={form.creci} onChange={set("creci")} />
        </Field>
        <Field id="email" label="E-mail" className="sm:col-span-2">
          <input id="email" type="email" className={inputClass} value={form.email} onChange={set("email")} required autoComplete="email" />
        </Field>
        <Field id="password" label="Senha" hint="Pelo menos 8 caracteres." className="sm:col-span-2">
          <PasswordInput id="password" value={form.password} onChange={set("password")} required minLength={8} autoComplete="new-password" />
        </Field>
        {error && <p className="text-sm text-rose-700 sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={busy} className="sm:col-span-2">
          {busy ? "Criando conta…" : "Criar minha conta"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">
        Já tem conta?{" "}
        <Link to="/entrar" className="font-semibold text-forest underline">
          Entrar
        </Link>
      </p>
    </main>
    </div>
  );
}
