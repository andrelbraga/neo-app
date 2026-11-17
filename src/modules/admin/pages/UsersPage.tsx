import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/app/providers/api/client";
import type { Account } from "@/modules/auth/model/auth.types";
import { accountAdminService } from "@/modules/auth/services/auth.service";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { formatDateTime } from "@/shared/lib/format";
import { ResponsiveTable, type Column } from "@/shared/ui/ResponsiveTable";
import { Badge, Button, Dialog, EmptyState, PageHeader } from "@/shared/ui/ui";
import { Avatar, Skeleton } from "@/shared/ui/visuals";

const roleName = (a: Account) => (a.role === "admin" ? "Administrador" : `Corretor${a.broker_code ? ` · ${a.broker_code}` : ""}`);

/** Situação da senha: nunca a senha em si, que só existe como hash (ADR-0020). */
function PasswordState({ a }: { a: Account }) {
  return a.must_change_password ? (
    <Badge tone="gold">Provisória · aguardando troca</Badge>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted" title="A senha é guardada criptografada e não pode ser exibida">
      <Lock size={13} /> •••••••• protegida
    </span>
  );
}

/** Senha provisória recém-gerada: escondida por padrão, com o olho para mostrar e o botão de copiar. Aparece uma vez. */
function TemporaryPasswordDialog({ account, password, onClose }: { account: Account; password: string; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar. Mostre a senha e copie à mão.");
    }
  };
  return (
    <Dialog title="Senha provisória criada" onClose={onClose}>
      <p className="text-sm text-ink">
        Passe esta senha a <b>{account.name}</b> por um canal seguro. No próximo acesso, {account.name.split(" ")[0]} vai criar a própria senha.
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-cream p-2 pl-4">
        <code aria-label="Senha provisória" className="min-w-0 flex-1 truncate font-mono text-lg tracking-wider text-ink">
          {visible ? password : "•".repeat(password.length)}
        </code>
        <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition hover:bg-white hover:text-ink">
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button type="button" onClick={copy} aria-label="Copiar senha" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition hover:bg-white hover:text-ink">
          {copied ? <Check size={18} className="text-ok" /> : <Copy size={18} />}
        </button>
      </div>
      <p className="mt-3 text-xs text-ink-muted">Ela não aparece de novo: depois de fechar, só gerando outra.</p>
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose}>Pronto</Button>
      </div>
    </Dialog>
  );
}

/**
 * Usuários da plataforma (admins e corretores), com a situação da senha e o reset por senha provisória
 * (ADR-0020). A senha cadastrada não aparece: ela só existe como hash, que não se desfaz.
 */
export function UsersPage() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const users = useQuery({ queryKey: ["admin-users"], queryFn: accountAdminService.list });
  const [confirming, setConfirming] = useState<Account | null>(null);
  const [created, setCreated] = useState<{ account: Account; password: string } | null>(null);
  const reset = useMutation({
    mutationFn: (a: Account) => accountAdminService.resetPassword(a.id),
    onSuccess: (r, a) => {
      setConfirming(null);
      setCreated({ account: a, password: r.temporary_password });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const action = (a: Account) => (
    <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => setConfirming(a)} aria-label={`Redefinir a senha de ${a.name}`}>
      <KeyRound size={14} /> Redefinir senha
    </Button>
  );
  const columns: Column<Account>[] = [
    {
      key: "nome",
      header: "Usuário",
      width: "30%",
      cell: (a) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={a.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{a.name}</span>
            <span className="block truncate text-xs text-ink-muted">{a.email}</span>
          </span>
        </span>
      ),
    },
    { key: "perfil", header: "Perfil", width: "18%", cell: (a) => roleName(a) },
    { key: "situacao", header: "Situação", width: "12%", cell: (a) => <Badge tone={a.active ? "ok" : "gray"}>{a.active ? "Ativo" : "Desativado"}</Badge> },
    {
      key: "senha",
      header: "Senha",
      width: "22%",
      cell: (a) => (
        <span className="block min-w-0">
          <PasswordState a={a} />
          {a.password_reset_at && <small className="mt-0.5 block truncate text-[11px] text-ink-muted">Redefinida em {formatDateTime(a.password_reset_at)}</small>}
        </span>
      ),
    },
    { key: "acao", header: "", width: "18%", align: "right", cell: action },
  ];

  return (
    <>
      <PageHeader title="Usuários" subtitle="Quem acessa a plataforma. As senhas são guardadas criptografadas e não podem ser vistas por ninguém; para liberar o acesso, redefina com uma senha provisória." />
      {users.isPending && <Skeleton className="h-64" />}
      {users.data?.length === 0 && <EmptyState title="Nenhum usuário" />}
      {users.data && users.data.length > 0 && (
        <ResponsiveTable
          label="Usuários"
          rows={users.data}
          columns={columns}
          rowKey={(a) => a.id}
          card={(a) => (
            <article className="card flex h-full flex-col gap-3 p-4">
              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={a.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-ink">{a.name}</b>
                  <small className="block truncate text-xs text-ink-muted">{a.email}</small>
                </span>
                <Badge tone={a.active ? "ok" : "gray"}>{a.active ? "Ativo" : "Desativado"}</Badge>
              </span>
              <span className="text-xs text-ink-muted">{roleName(a)}</span>
              <PasswordState a={a} />
              <span className="mt-auto">{action(a)}</span>
            </article>
          )}
        />
      )}

      {confirming && (
        <Dialog title="Redefinir senha" onClose={() => setConfirming(null)}>
          <p className="text-sm text-ink">
            A senha atual de <b>{confirming.name}</b> deixa de valer e uma senha provisória é criada para você passar a {confirming.id === me?.id ? "você mesmo" : "ele ou ela"}. No próximo acesso, a pessoa cria a própria senha.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancelar
            </Button>
            <Button disabled={reset.isPending} onClick={() => reset.mutate(confirming)}>
              Gerar senha provisória
            </Button>
          </div>
        </Dialog>
      )}
      {created && <TemporaryPasswordDialog account={created.account} password={created.password} onClose={() => setCreated(null)} />}
    </>
  );
}
