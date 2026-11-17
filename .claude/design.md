# Design — Neo360

## API: um domínio por pasta

```
internal/domain/<dominio>/
  entity.go        tipos, Request.Validate() (normaliza e confere)
  errors.go        erros com mensagem para o usuário
  contracts.go     interfaces Repository, Service, Logger
  repository/      SQL com pgx; erros do banco viram erros do domínio (pkg/pgerr)
  service/         regras; recebe Repository por interface
  handler/         Gin; traduz erro → status HTTP
  route/           Register(app, ...) monta repo → service → handler e as rotas
```

Testes: `entity_test.go`, `service/*_test.go` com repositório falso, `handler/*_test.go` com serviço falso e tabela de erros → status, `route/*_test.go` confere as rotas registradas, `repository/*_integration_test.go` com `testutil.MigratedDB`.

## Modelo de dados

- `users` (conta: admin ou corretor) 1—1 `brokers` (perfil do corretor, código do link).
- `organizations` com `kind` incorporadora | imobiliaria. Empreendimento aponta para incorporadora; corretor pode apontar para imobiliária.
- `developments`: conteúdo do showroom (textos, capa, tour, `gallery` e `highlights` em JSONB) e `published`.
- `leads`: cliente por empreendimento e navegador (`token_hash` único), dono fixo (`broker_id`), etapa do funil.
- `lead_events`: o que o cliente fez (visita, seção, galeria, tour, WhatsApp, contato, proposta).
- `proposals`: propostas do cliente e ajustes do corretor (`author`, `based_on`, `condition` JSONB, `seen_at` para "proposta nova"). Desfecho em `leads` (`outcome_at`, `sale_value`, `sale_proposal_id`, `outcome_note`). `messages` ficou sem uso desde a ADR-0015 (chat removido), só com o histórico.

## Rotas

| Grupo | Prefixo | Proteção |
|---|---|---|
| Público | `/api/auth/login`, `/api/auth/signup`, `/api/public/*` | nenhuma; showroom usa `X-Visitor-Token` |
| Conta | `/api/auth/me` | JWT |
| Corretor | `/api/me/*` | JWT + `area.corretor` |
| Admin | `/api/admin/*` | JWT + `admin` |

## App

Rotas: `/` (apresentação), `/entrar`, `/cadastro`, `/e/:slug/:code` (showroom), `/painel/*` (corretor), `/admin/*` (admin). Guardas em `app/routes/guards.tsx`.
