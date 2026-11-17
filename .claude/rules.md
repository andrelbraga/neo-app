# Regras — Neo360

> Leia antes de qualquer alteração de código. Após cada alteração, atualize `specs.md`.

## Gerais

1. **Commits somente quando solicitado.** Nunca `--no-verify` nem `push --force` em main sem autorização.
2. **Não adicione dependências** sem aprovação — confira `api/go.mod` e `app/package.json`.
3. **Não refatore código não relacionado** à tarefa.
4. **Regra de negócio sem fonte não entra no código**: registre em `docs/pendencias.md` e pergunte.
5. **Não edite `prototipo/`** (ADR-0003). Para usar algo dele, copie para `app/public/` ou porte para o código.

## API

1. Toda rota protegida usa `app.API(api.Routes{Authorization: true, Permission: ...})`; permissões em `internal/pkg/authz` (RN-01.4).
2. O papel vale pelo banco a cada requisição (RN-01.5); nunca confie só no token.
3. Rotas do corretor derivam o corretor da conta (`userID` → `brokers.user_id`); nunca aceite `broker_id` do pedido.
4. Rotas públicas do showroom identificam o cliente pelo cabeçalho `X-Visitor-Token`; o banco guarda só o hash (RN-03.2).
5. Respostas sempre no envelope `{status, data}` (`api.Respond`/`api.RespondError`). Mensagens de erro em português, para o usuário final.
6. Não logue corpo, query string, telefone, nome nem mensagens (LGPD).
7. Migrations novas: `make -C api migrate-create name=descricao`; nunca altere migration já aplicada.
8. Fora do ambiente local a API não sobe sem `JWT_SECRET` e `DATABASE_URL` (`config.Validate`).

## App

1. Chamadas à API só pelos `services/` do módulo, com o cliente de `app/providers/api/client.ts`.
2. Cores e fontes pelos tokens do `tailwind.config.ts` (creme, forest, gold, ink). Nada de cor solta.
3. Showroom: falha de rastreio nunca aparece para o cliente; o evento é descartado.
4. A conversa com o cliente é pelo WhatsApp do corretor; não há chat na página (ADR-0015).
