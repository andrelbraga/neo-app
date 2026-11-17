# ADR-0017 — API e app em repositórios separados

- **Status:** aceita
- **Data:** 17/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Substitui:** ADR-0002 (monorepo com api/ e app/)
- **Relacionados:** ADR-0003, ADR-0007, ADR-0008

## Contexto e problema

Pedido do usuário (17/11/2026): "Agora segregue as aplicações em dois repositórios separados, neo-app e neo-api, suba para o git após isso suba para o projeto [...] do railway". Perguntado, escolheu:
- repositórios **públicos** na conta andrelbraga;
- **documentação nos dois** e o protótipo no app;
- não mexer no serviço já existente no Railway;
- publicação **ligada ao GitHub**.

## Decisão

- **neo-api** (`github.com/andrelbraga/neo-api`): o conteúdo de `api/` na raiz, mais `docs/`, `.claude/`, `CLAUDE.md` e `AGENTS.md`. CI só da API, com Postgres de teste, cobertura mínima de 80% e build da imagem.
- **neo-app** (`github.com/andrelbraga/neo-app`): o conteúdo de `app/` na raiz, mais `prototipo/` (congelado, ADR-0003), `resources/`, `docs/`, `.claude/`, `CLAUDE.md` e `AGENTS.md`. CI do app: typecheck, lint, testes e build.
- **Documentos compartilhados:** ADRs, pendências e regras de negócio são cópias nos dois repositórios. Quem muda uma atualiza a outra, com o mesmo número de ADR ou de regra. O `.claude/CLAUDE.md` de cada um diz qual lado é.
- **Histórico novo:** o monorepo não tinha git. Os repositórios começam com um commit inicial, sem histórico e sem `.env`. Os `.env.example` foram reescritos só com nomes de variáveis e valores locais.
- **Railway** (projeto `neo`):
  - serviços `neo-api` e `neo-app`, cada um ligado ao seu repositório (deploy a cada push na `main`), mais um `Postgres`;
  - `railway.json` de cada repositório sem `watchPatterns`, porque o repositório inteiro é o serviço;
  - a API aplica as migrations ao subir (Dockerfile).

## Consequências

- Mudança que cruza os dois lados (por exemplo, um campo novo na API usado pelo app) vira dois commits, um em cada repositório. A API deve continuar aceitando a versão anterior do app até o deploy dos dois.
- Documentação duplicada pode divergir. A regra é a da cópia mais recente, registrada em `.claude/specs.md` de cada lado.
- Repositórios públicos: nenhuma credencial vai no código. Segredos só nas variáveis do Railway.
