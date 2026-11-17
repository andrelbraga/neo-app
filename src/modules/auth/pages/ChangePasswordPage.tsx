import { KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { buttonClass } from "@/shared/ui/styles";
import { Button, Field, Logo } from "@/shared/ui/ui";
import { authService } from "../services/auth.service";
import { homeFor, useAuthStore } from "../store/auth.store";

/**
 * Troca da própria senha. Com senha provisória (o admin redefiniu), é obrigatória antes de qualquer outra
 * tela; fora disso, o usuário chega aqui pelo menu da conta (ADR-0020).
 */
export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const forced = Boolean(user?.must_change_password);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (next.length < 8) return setError("A nova senha precisa de pelo menos 8 caracteres.");
    if (next !== confirm) return setError("A confirmação não confere com a nova senha.");
    setSaving(true);
    try {
      const updated = await authService.changePassword(current, next);
      setUser(updated);
      toast.success("Senha alterada");
      navigate(homeFor(updated), { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="theme-sys panel-bg min-h-screen">
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
        <Logo className="h-10" />
        <h1 className="mt-8 flex items-center gap-2 text-3xl text-ink">
          <KeyRound size={26} className="text-forest" /> {forced ? "Crie a sua senha" : "Trocar senha"}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {forced
            ? "Você entrou com uma senha provisória. Crie uma senha só sua para continuar: ninguém, nem o administrador, consegue vê-la depois."
            : "Informe a senha atual e escolha a nova."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field id="pw-current" label={forced ? "Senha provisória" : "Senha atual"}>
            <PasswordInput id="pw-current" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </Field>
          <Field id="pw-new" label="Nova senha" hint="Pelo menos 8 caracteres.">
            <PasswordInput id="pw-new" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
          </Field>
          <Field id="pw-confirm" label="Confirme a nova senha">
            <PasswordInput id="pw-confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          </Field>
          {error && (
            <p role="alert" className="text-sm font-medium text-rose-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving} className="w-full">
            Salvar a nova senha
          </Button>
          {!forced && (
            <Link to={homeFor(user)} className={buttonClass("ghost", "w-full")}>
              Cancelar
            </Link>
          )}
        </form>
      </main>
    </div>
  );
}
