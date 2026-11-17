# ADR-0018 — Publicação no Railway: projeto próprio, Postgres próprio e schema neo360

- **Status:** aceita
- **Data:** 17/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** ADR-0017

## Contexto e problema

A primeira tentativa foi no projeto `neo` da conta do Eliseu, no plano gratuito. O Railway recusou criar o Postgres e, depois, novos serviços também no projeto `neonflow`: "Free plan resource provision limit exceeded". Nesse caminho, o usuário pediu para usar o Postgres do neonflow "em um schema diferente exclusivo para este projeto", e a API ganhou suporte a `DB_SCHEMA`.

Depois, o usuário trocou para a própria conta do Railway e indicou o projeto `8d27127a-b88a-4d99-841a-05899a5b4c9c`, com "pode criar o banco do zero".

## Decisão

- **Projeto `8d27127a-…`, ambiente `production`, três serviços:**
  - `Postgres`, criado do zero;
  - `neo-api`, ligado a `andrelbraga/neo-api` (deploy a cada push na `main`);
  - `neo-app`, ligado a `andrelbraga/neo-app`.
- **Variáveis da `neo-api`:**
  - `DATABASE_URL=${{Postgres.DATABASE_URL}}`, pela rede privada, sem copiar a URL;
  - `DB_SCHEMA=neo360` e `APP_ENV=production`;
  - `JWT_SECRET` aleatório, gerado e gravado sem ser exibido;
  - `ALLOWED_ORIGINS` com a URL do app.
- **Variável da `neo-app`:** `VITE_API_BASE_URL` com a URL da API + `/api`.
- **Schema `neo360`:** mesmo com banco próprio, tudo do Neo360 fica nesse schema, inclusive o histórico de migrations. Se um dia for preciso dividir o servidor com outro projeto, basta apontar o `DATABASE_URL`. Com `DB_SCHEMA`:
  - as conexões usam só esse schema (`search_path`), e ele é criado se não existir;
  - o nome é validado (minúsculas, números e `_`).
- Sem `DB_SCHEMA`, como no desenvolvimento local, vale o `public`.
- **Endereços:**
  - API: https://neo-api-production-ef2ad24b.up.railway.app
  - App: https://neo-app-production-4de6da2c.up.railway.app

## Consequências

- O primeiro admin é criado pelo dono da conta, dentro do serviço (`railway ssh --service neo-api`, depois `./create-admin`), com e-mail e senha que só ele conhece.
- A configuração do Railway em `railway.json` está marcada como obsoleta pelo Railway (vale até 01/12/2026). É preciso migrar para `.railway/railway.ts` (`railway config migrate`) antes dessa data.
- Testado localmente: as 7 migrations rodaram num schema isolado, com histórico próprio, sem tocar no `public`.
