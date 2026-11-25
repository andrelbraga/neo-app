# Specs — registro de mudanças

## 16/11/2026 — Início do projeto

Pedido (CLI): sistema tipo CMS de showroom de empreendimentos; corretor se cadastra (nome, sobrenome, telefone, e-mail, CRECI), opera o sistema e gera link exclusivo para enviar pelo WhatsApp; Boa Vista Residencial pré-carregado; visibilidade dos clientes que reagirem e comunicação entre eles. Decisões do usuário na mesma conversa: monorepo `api/` + `app/` (ADR-0002), escopo B com admin que vê tudo (ADR-0005), chat na página sem descartar WhatsApp e sem e-mail por enquanto (ADR-0004), CRECI opcional e link gerado na hora (ADR-0006).

Feito:
- `prototipo/boa-vista-104a/`: protótipo estático movido para cá, congelado (ADR-0003).
- API: domínios `account`, `broker`, `organization`, `development`, `lead`; migrations V1 (schema) e V2 (seed Boa Vista com textos do protótipo); CLI `create-admin`. 95,7% de cobertura em `internal/` (unitários + integração).
- App: showroom público com rastreio, contato, chat e WhatsApp; área do corretor (links, clientes, ficha com linha do tempo e chat, perfil); admin (visão geral, empreendimentos, incorporadoras, imobiliárias, profissionais, clientes). 24 testes.
- Tour 3D do protótipo servido em `app/public/showroom/boa-vista/` (ADR-0007).
- Fluxo ponta a ponta conferido com a API e o app locais (cadastro → link → visita → eventos → contato → chat → CRM → admin → desativação).

## 16/11/2026 — Apresentação do protótipo, logo e CRM mais interativo

Pedido (CLI): a apresentação do empreendimento igual a `prototipo/boa-vista-104a/index.html`; o logo idêntico ao usado; páginas mais interativas e modernas, incluindo o CRM e a tela do profissional.

Feito:
- ADR-0008: campo `presentation_url` (V3); cópia da apresentação em `app/public/showroom/boa-vista/` (com `img/` e `modelos/`) e `neo360-bridge.js` ligando visita, corretor do link, medição com aceite, proposta, perfil, chat e WhatsApp. Conferido no Chrome headless: corretor trocado, proposta e perfil viram lead, chat vai e volta.
- API: eventos `acao`, `tempo`, `proposta`, `perfil`; `agency_name` no showroom; `signals` na lista de clientes; `GET /me/activity` e `GET /admin/activity`.
- Logo: `neo360-logo-nova.png` do protótipo em todo o app e no favicon.
- App: painel com fundo e cartões novos, avisos ao vivo (toast e navegador), contador de mensagens no menu; início do corretor com saudação, indicadores animados, cartões de link com copiar/compartilhar, feed ao vivo e funil; clientes em quadro arrastável ou lista, com busca e sinais de interesse; ficha do cliente com etapas clicáveis, proposta em destaque, interesse, tempo por seção, perfil, chat com respostas rápidas e linha do tempo com ícones; admin com ranking de corretores, funil, feed e quadro.

## 16/11/2026 — Troca de conta no login

Relato: "Sempre ao clicar em entrar aparece 'Seu perfil não abre esta tela'". Causa reproduzida no Chrome: com uma conta já conectada no navegador (ex.: corretor), `/entrar` redirecionava para a área dela sem mostrar o formulário, então não havia como entrar como admin; ao abrir `/admin`, o aviso não dizia com que conta a pessoa estava nem como trocar.

Feito: `/entrar` com sessão ativa mostra quem está conectado, com "Continuar" e "Entrar com outra conta"; o aviso de acesso restrito diz a conta e o papel atuais e oferece "Ir para a minha área" e "Sair e entrar com outra conta"; depois do login, a volta para a página anterior só acontece se o papel puder abri-la (`canOpen`). 40 testes no app.

## 16/11/2026 — Empresas fora da tela e troca de dados do cliente

- ADR-0009: telas, menu e seletores de imobiliárias e incorporadoras retirados do app (API e dados mantidos; vínculos existentes preservados ao salvar). Módulo `app/src/modules/organizations` removido.
- RN-03.10: análise da troca de nome/WhatsApp depois da proposta. Antes, a troca sobrescrevia em silêncio e o anterior se perdia; reenvio igual gerava evento repetido. Agora: a troca guarda os dados anteriores no evento `contato` (`antes`), aparece na linha do tempo e no feed do corretor; reenvio igual não gera evento; a apresentação mostra os dados resumidos com "Trocar meus dados". Conferido no Chrome headless.

## 16/11/2026 — Imobiliárias pré-cadastradas com logo

- ADR-0010 / RN-01.6: `organizations.logo_url` e seed da Omni (V4); seletor de imobiliária com logos no cadastro e edição do profissional; coluna com logo na lista; `agency_logo_url` no corretor e no showroom; a ponte põe o logo da imobiliária no cartão "Imobiliária parceira" da apresentação. Conferido no Chrome (admin e apresentação no celular).
- Ajuste no mesmo dia: no admin a imobiliária é escolhida numa lista por nome (sem logo, também na tabela); o logo fica só na apresentação.

## 16/11/2026 — Imobiliárias da Serra Gaúcha e de Porto Alegre; etapas da apresentação

- V5: `organizations.city` e 20 imobiliárias pré-cadastradas (Gramado, Canela, Caxias do Sul, Bento Gonçalves, Porto Alegre), levantadas em fontes públicas (P-12). Lista do profissional agrupada por cidade.
- ADR-0011 / RN-03.11: apresentação reorganizada em Conheça → Explore → Dúvidas → Proposta, com barra de etapas fixa, ações de contato no cartão do consultor, seção "Ficou com alguma dúvida?" (perguntas prontas, chat, WhatsApp, imobiliária e incorporadora), perfil no fim e convite no chat para deixar o WhatsApp. Conferido no Chrome (celular) com corretora ligada à Foxter.

## 16/11/2026 — Aplicação responsiva e perfil de cliente fora

- `shared/ui/ResponsiveTable`: toda tabela é de layout fixo com larguras por coluna e reticências a partir de 1024 px, e lista de cartões abaixo disso. Usada em clientes (corretor e admin) e profissionais.
- Painel: menu lateral só a partir de 1024 px; conteúdo usa a largura ao lado do menu (máx. 1600 px); itens de grade não alargam a página (`.grid > * { min-width: 0 }`); visão geral do admin, início do corretor, ficha do cliente, quadro e formulário de empreendimento ajustados por largura.
- Conferido no Chrome em 1920, 1366, 1024, 768 e 390 px, 13 telas: nenhum estouro de largura nem tabela com rolagem lateral.
- Apresentação: "Crie seu perfil" escondido (CSS), a pedido; a seção fica no HTML porque o script do protótipo usa o botão `#p-criar`.

## 16/11/2026 — Apresentação em capítulos (itens 1 a 4)

- ADR-0012: barra de capítulos Lugar → Projeto → Apartamento → Dúvidas → Condições; abertura guiada pela rolagem (4 cenas, "Apresentado por" com o corretor); capítulo Projeto com imagem fixa e passos; sobrevoo da maquete (`BV3D.voo`); planta viva com pontos sobre o encarte, área, foto e "Um dia no apartamento" (`BV3D.dia`); "Como você paga" com barra e marcos a partir de `calc()`.
- CRM: rótulos para `voo_3d`, `comodo_*`, `dia_no_apto` e `abriu_planta3d_viva`.
- Conferido no Chrome headless em 1440 e 390 px: sem erros de JS, sem estouro de largura, chat e convite de WhatsApp funcionando.

## 17/11/2026 — Painel e admin no layout da referência

- ADR-0013: cores do Tailwind por variável CSS; `.theme-sys` com a paleta medida em `resources/design_tela.jpg` (índigo `#3227DB`, lavanda `#F5F4F9`, branco, `#232230`, situações verde/azul/amarelo/coral) no painel, no admin, na entrada e no cadastro. Apresentação e página pública sem mudança.
- Moldura nova: barra superior com título, busca (`?q=` nos clientes) e sino; menu de ícones; menu do celular em pílula escura flutuante.
- Ficha do cliente com lista ao lado (`LeadList`, a partir de 1280 px), abas Resumo/Conversa/Atividade, ações em botões redondos, cartão Contato, etapas segmentadas e interesse em tabela de cartões. Etiquetas com ponto e caixa alta; tabelas com linhas em cartões; quadro com colunas lavanda e faixa da etapa.
- Testes: `LeadList.test.tsx`, busca `matchesLead` e a ficha com abas. Conferido no Chrome em 1440 e 390 px, 13 telas sem estouro de largura.
- Ajuste no mesmo dia (elementos que pareciam clicáveis e não eram): o avatar do menu lateral e o perfil da barra superior abrem o menu da conta (`ProfileMenu`: nome e código, mensagens novas, meu perfil, avisos do navegador, sair; fecha no Esc e no clique fora). Na ficha, os ícones de sinal e as linhas de interesse abrem a aba Atividade filtrada, com "Mostrando só" e opção de limpar. Linhas de interesse filtram pelo rótulo, porque tipos diferentes podem ter o mesmo rótulo ("Abriu o chat").
- Correção: os rótulos do menu lateral (e o menu da conta aberto por ele) ficavam atrás do conteúdo e apareciam pela metade. O menu lateral fixo forma uma camada própria; ganhou `z-20`, acima do conteúdo e abaixo da barra superior (`z-30`). Conferido no Chrome em todos os ícones do corretor e do admin.

## 17/11/2026 — Proposta em seção própria

- ADR-0014: a ponte manda `condicao` (preço, referência, campanha, entrada, parcelas, reforços, chaves, veículos, saldo, sujeita à aprovação) junto com o texto da proposta. A ficha ganhou a aba **Propostas** com cada proposta formatada (`ProposalSheet`): situação, preço, barra e lista de como o cliente paga, veículos, observação, texto original, WhatsApp e copiar. O resumo da ficha tem só o atalho. Propostas antigas aparecem com o texto.
- Conferido de ponta a ponta no Chrome: proposta enviada pela apresentação (entrada de R$ 180 mil e um veículo) chegou com os mesmos números do simulador (saldo R$ 115.000, 36 × R$ 3.194,44). Sem estouro de largura em 1440 e 390 px.

## 17/11/2026 — Ciclo de venda pelo WhatsApp, sem chat

- ADR-0015 (substitui a ADR-0004), RN-03.5 a RN-03.13. V6: `proposals` (versões do cliente e do corretor), etapa `fechado` e desfecho em `leads`. As 10 propostas já gravadas como eventos viraram registros.
- API: `POST /api/public/lead/proposals` (proposta com contato, evento e etapa proposta automática), `POST /api/me/leads/:id/proposals` (ajuste do corretor), `PATCH /me/leads/:id/stage` com valor, proposta de base e observação. Saem as rotas de mensagens. Resumo com propostas novas, vendas e valor vendido.
- Apresentação: sem chat. Dúvidas, bolha, cartão do consultor e fechamento abrem o WhatsApp do corretor com o texto pronto; depois do envio, "Continuar no WhatsApp". Showroom padrão: botão flutuante de WhatsApp.
- CRM:
  - quadro com cinco colunas e "Mover para" no cartão (saiu o seletor que duplicava a coluna); desfecho pede o registro;
  - ficha com Resumo (controle de etapa, última proposta, interesse), Propostas (versões, ajustar, WhatsApp, base da venda) e Atividades (jornada por visita no estilo do Google Analytics, tempo por seção e principais ações);
  - "propostas novas" no lugar de "mensagens novas"; vendas nas visões gerais.
- Correção encontrada no teste: campos de valor com passo de 1.000 bloqueavam valores como R$ 365.500 no navegador.
- Conferido de ponta a ponta no Chrome: dúvida e bolha no WhatsApp, proposta com veículo, etapa proposta, ajuste (versão 2 sobre a 1), venda de R$ 362.500 registrada, coluna "Venda fechada" com o total e visão geral do admin com a venda. 26 telas sem estouro de largura em 1440 e 390 px.

## 17/11/2026 — Apresentação em estilo metrô e cliente pelo WhatsApp

- ADR-0016, RN-03.11, RN-03.14, P-15. Apresentação:
  - sem cabeçalho, barra de capítulos, bolha de WhatsApp, maquete 3D, fundo de folhas e simulador genérico;
  - Plus Jakarta Sans, cantos retos, grafite e dourado no lugar do azul-claro, seções na largura do container;
  - consultor em faixa inteira; galeria em carrossel grande (setas, miniaturas, teclado, arrastar, troca automática, tela cheia);
  - planta, 3D e fichas à vista, sem abas;
  - proposta em formulário único com a simulação ao lado, nome e WhatsApp obrigatórios e pedido de contrato como caixa de seleção;
  - dúvidas no rodapé.
- V7: `leads.merged_into`; `proposals.client_name` e `client_phone`. Mesmo WhatsApp no mesmo empreendimento junta os cadastros no mais antigo (`MergeByPhone`, chamado ao gravar o contato). A ficha mostra quem enviou cada proposta.
- Conferido no Chrome em 1440 e 390 px: sem estouro de largura, sem serifa, sem cantos arredondados, sem azul-claro e sem erros de script. No formulário vazio, a página pede nome e WhatsApp. Proposta com pedido de contrato pelo link da Lúcia e outra, de outro navegador, pelo link do Fabiano com o mesmo WhatsApp: um cliente só, na Lúcia, com as duas propostas.

## 17/11/2026 — Repositórios separados

- ADR-0017 (substitui a ADR-0002): o monorepo virou `neo-api` e `neo-app`, públicos em github.com/andrelbraga, com histórico novo. Documentos compartilhados (ADRs, pendências, regras de negócio) existem nos dois; o protótipo e a referência de layout ficam no app. CI separado em cada um. No Railway (projeto `neo`), cada serviço é ligado ao seu repositório.
- ADR-0018: publicação no Railway da conta do André, projeto `8d27127a-…`: Postgres próprio, `neo-api` e `neo-app` ligados aos repositórios. A API usa `DB_SCHEMA=neo360`: `search_path` só no schema, criado se faltar, com histórico de migrations próprio. API em https://neo-api-production-ef2ad24b.up.railway.app e app em https://neo-app-production-4de6da2c.up.railway.app. (Antes, a conta do Eliseu, no plano gratuito, recusou Postgres e novos serviços.)

## 17/11/2026 — Layout A e B da apresentação

- ADR-0019, RN-03.15: a apresentação anterior ao estilo metrô voltou como layout A (`index.html`, padrão), e a metrô ficou como B (`index-b.html`). V8: `developments.default_layout` e `leads.layout`.
  - O admin escolhe o padrão do empreendimento; o corretor escolhe A ou B no link de cada envio (`?layout=`).
  - A visita grava o layout da primeira visita, e o resumo traz `by_layout`. Início do corretor e visão geral do admin com o cartão "Layout A × B" (clientes, propostas, vendas e valor).
- Conferido localmente: link sem layout abre o A; `?layout=b` abre o B; cada cliente conta no seu layout; o link do corretor muda para `?layout=b`; o admin vê o campo no empreendimento.

## 17/11/2026 — Usuários e senha provisória

- ADR-0020, RN-01.7, RN-01.8.
  - Admin: tela Usuários (`/admin/usuarios`) com todas as contas e a situação da senha, que nunca é exibida (só existe o hash). "Redefinir senha" gera uma senha provisória, mostrada uma vez, escondida, com o olho e o botão de copiar.
  - V9: `users.must_change_password` e `password_reset_at`. Com senha provisória, o usuário vai para "Crie a sua senha", e a API recusa o resto (403) até a troca (`PUT /api/auth/password`).
  - Olho em todos os campos de senha; "Trocar senha" no menu da conta.
- Conferido no Chrome: lista sem senhas, provisória escondida até o olho, login com a provisória levado à troca, API com 403 antes e 200 depois da troca.

## 17/11/2026 — Layout B com a página da entrega v11

- ADR-0021 (substitui em parte a ADR-0019), P-16. `index-b.html` é o `dist/index.html` da v11 do Drive, idêntico ao arquivo mais a linha da ponte, com `sintetica.*`, `metrics/collector.js`, `planta.html`, `solar-study.js`, `assets/` (2 imagens) e `img/fundo-geada-referencia.jpeg`. Imagens e modelos são os do A. O estilo metrô sai do B.
- Ponte com `layout=b`:
  - medição pelo aceite do coletor da página;
  - ações e tempo lidos da medição local dela;
  - "Viu o layout B" com o aceite;
  - proposta ao registrar a intenção, com nome e WhatsApp obrigatórios e o valor proposto como preço;
  - avisos de "nada é enviado" corrigidos e atalhos de demonstração escondidos.
- Correção nos dois layouts: segundo WhatsApp ao tocar em "Prefiro conversar com o corretor".
- Admin, cartão "Layout A × B" e RN-03.15: o B passa a ser "página nova (v11)". Rótulos das ações novas e da seção "estudos" na jornada.

## 17/11/2026 — v11 como layout A, sem perfil e sem chat

- ADR-0022, RN-03.15. `index.html` (A, padrão) passa a ser a página da v11; `index-b.html` (B), a apresentação anterior. "Crie seu perfil" e o painel de chat ficam escondidos nas duas páginas, e a conversa é pelo WhatsApp do corretor.
- Ponte: reconhece a v11 pelo coletor de medição dela (`window.BVMetrics`), não pela letra do layout. As duas páginas mandam proposta, ações, seções e tempo ao corretor. Saíram os textos de perfil da v11.
- Admin e cartão A × B: "A · página nova (v11)" e "B · apresentação clássica".

## 17/11/2026 — Edição do corretor pelo admin com e-mail e botão "Editar"

- RN-01.9, P-17. `PUT /api/admin/brokers/:id` aceita `email`: normalizado, validado e único (409 se for de outra conta). Vazio mantém o atual. A troca recusada não muda nada.
- Admin, Profissionais: botão "Editar" em cada linha e em cada cartão do celular; a edição mostra o e-mail de acesso (a senha continua fora).
- Exclusão de corretor fica fora por ora (P-17): a cascata apagaria clientes, propostas e vendas.
- Testes: validação do e-mail, serviço, integração do repositório (troca e conflito) e `BrokersPage` (Editar visível e troca do e-mail).

## 24/11/2026 — Painel e admin no layout da Central de trabalho

Pedido (CLI): analisar as telas de `resources/Neo360_BoaVista_COMPLETO_v12/dist/dashboard.html` e implementar esse layout no app. Escolhas do usuário: visual da Central (ADR-0023, substitui a ADR-0013), só as telas que já existem e "ver como" no admin.

- ADR-0023: `.theme-sys` com a paleta da Central (verde `#245B49`, menta, dourado, fundo `#F4F6F1`), títulos em Georgia, cartões com borda fina e canto de 11 px, botões com canto de 7 px (`btn` em `buttonClass`).
- `PanelLayout`: barra lateral de 242 px (marca, "Seu ambiente", menu com rótulo, conta e sair) e barra superior com o caminho da página, busca, sino e conta. `PageHeader` com rótulo opcional e título de 40 px. Início do corretor e visão geral do admin com o destaque verde e o botão dourado.
- RN-01.10 "ver como": `?broker=` em `GET /api/admin/summary` e `/admin/activity`; `SeeAsSelect` e `useSeeAsStore` (sessionStorage); visão geral e clientes do admin filtram pelo corretor escolhido e o ranking sai; faixa "Visualizando como" com volta à visão Neo360.
- Testes: `TestAdminSeeAs` (handler), `TestAdminService` com corretor, `AdminHomePage.test.tsx`. App: typecheck, lint e 80 testes; API: `go test ./...`.
- Fora: Convites, Campanhas, Negociações, Financeiro, Participantes, Página e Histórico da Central (P-04, P-13; o convite com cadastro prévio do cliente mexe no dono do lead).
- Conferência no Chrome headless (24/11/2026), 14 telas em 1440 e 390 px (admin, admin vendo como corretor, ficha, empreendimentos, profissionais, corretor, entrar): sem estouro de largura e sem erro no console. Correções feitas a partir dela:
  - o fundo `.theme-sys .panel-bg` não pegava quando as duas classes estão no mesmo elemento; passou a valer `.theme-sys.panel-bg`;
  - a etapa proposta em cobre, em vez do vermelho que parecia erro;
  - no "ver como", os cartões da plataforma (corretores ativos, empreendimentos) viram propostas novas e em negociação do corretor, e o feed ocupa o lugar do ranking;
  - o seletor mostra só o nome;
  - os rótulos `h2` em caixa alta da ficha ficam sem serifa.

## 24/11/2026 — Configuração do Railway como código (IaC)

- O `railway.json` (obsoleto a partir de 01/12/2026) saiu dos dois repositórios. A API passou a usar `.railway/railway.go`, um módulo Go próprio que não toca o `go.mod` da API. O app passou a usar `.railway/railway.ts`, com o pacote `railway` como dependência de desenvolvimento. ADR-0018 atualizada.
- O arquivo repete o que valia: build pelo Dockerfile, health check (`/api/health` com 60 s na API e `/` com 30 s no app) e uma réplica em `iad`. Nenhum valor de variável fica no repositório: a API preserva `ALLOWED_ORIGINS`, `APP_ENV`, `DATABASE_URL`, `DB_SCHEMA` e `JWT_SECRET` pelo nome, e o app deixa as variáveis fora do arquivo.
- `railway config apply` aplicado nos dois serviços. O plan seguinte diz "already up to date", e os serviços foram publicados de novo a partir do GitHub (`f266fd6` e `bb99460`).
- Para mudar build ou health check, edite o arquivo e rode `railway config plan` e depois `railway config apply`. Na API, rode com `GOARCH=arm64`, porque este ambiente tem `GOARCH=amd64` global.
- A pasta `neo-app` estava ligada ao projeto `ae2aa453` e foi religada ao `8d27127a` (production).
## 24/11/2026 — Clientes cadastrados pelo corretor (à mão ou por CSV)

- ADR-0024, RN-03.16, RN-03.1 revista, P-18. Ponto de partida: a tela de convites da v12 (`dashboard.html#convites`).
- V10: `leads.origin` (`link` ou `corretor`) e `leads.invite_code`.
- API:
  - `POST /api/me/leads` cadastra um cliente;
  - `POST /api/me/leads/import` (multipart `file`, `development_id`, `dry_run`) confere ou cadastra a planilha, com a situação de cada linha: pronta, sem nome, WhatsApp inválido, repetida na planilha, já é seu cliente ou já cadastrada no empreendimento;
  - a visita aceita `?convite=`: o navegador ganha um token ligado à ficha cadastrada (cadastro juntado, como na ADR-0016), e a primeira visita grava o layout.
- WhatsApp normalizado sem o 55 do país. Um WhatsApp já cadastrado no empreendimento é recusado sem dizer de quem é. A comparação A × B só conta o cliente cadastrado depois que ele abre o link.
- App:
  - "Adicionar clientes" em Meus clientes, com as abas "Um cliente" e "Planilha CSV", conferência antes de cadastrar e modelo para baixar;
  - na ficha do cliente cadastrado, "Enviar convite no WhatsApp" com o link próprio dele e "Cadastrado por você em";
  - showroom e ponte passam o `convite` para a visita.
- Testes: API com lint, unitários e integração (cobertura de `internal/` em 95,2%); app com 88 testes. Não foi conferido de ponta a ponta no navegador: o modo automático recusou a migration no banco de desenvolvimento.
- Documentos compartilhados sincronizados: o `neo-api` recebeu ADR-0021, ADR-0022, P-16 e os textos da RN-03.15 e da ADR-0019, que só existiam no `neo-app`.

## 24/11/2026 — Cliente editável e arquivável, só lista e mensagens por perfil e tom

- ADR-0025, RN-03.17 a RN-03.20, RN-03.6 revista, P-19.
- V11: `leads.profile` (moradia, investimento, veraneio ou vazio), `leads.archived_at` e `message_templates`.
- API:
  - `PATCH /api/me/leads/:id` edita nome, WhatsApp e perfil, com o WhatsApp único do cadastro e o evento `edicao`;
  - `DELETE /api/me/leads/:id` arquiva e `POST .../restore` restaura; o arquivado sai da lista (`?arquivados=1` lista eles), do resumo, do feed e da comparação A × B; proposta nova do cliente tira do arquivo;
  - `GET /api/me/message-templates` devolve os doze modelos; `PUT` e `DELETE /api/me/message-templates/:perfil/:tom` salvam ou voltam ao padrão.
- App:
  - quadro de arrastar removido (corretor e admin); lista com menu ⋮ (Abrir ficha, Editar, Mensagem no WhatsApp, Mover para, Arquivar ou Restaurar) e filtro Ativos | Arquivados;
  - ficha com editar, arquivar ou restaurar, perfil e aviso de arquivado; "Mensagem no WhatsApp" escolhe perfil e tom e deixa editar o texto antes de abrir;
  - "Meus modelos" (`/painel/mensagens`) para o corretor ajustar os textos, com `{nome}`, `{empreendimento}`, `{link}` e `{corretor}`.
- Testes: API com lint, unitários e integração (cobertura de `internal/` em 95,3%); app com 96 testes. Não foi conferido no navegador.

## 24/11/2026 — Correção: menu ⋮ da lista sem opções visíveis

- O menu abria dentro da célula da tabela, que corta o que passa da borda (`truncate`), e ficava invisível. Agora abre num portal no `body`, com posição fixa junto ao botão; abre para cima quando falta espaço embaixo e fecha ao rolar ou redimensionar. Teste novo em `MyLeadsPage.test.tsx`.

## 24/11/2026 — Chegada exclusiva na apresentação

- ADR-0026, RN-03.21. A ponte abre a apresentação (layouts A e B) com a chegada da imagem de `resources-neo/` (convite da v12):
  - logo Neo360 e "Um convite de {corretor} para você";
  - "Boa noite, {nome}." pelo horário do aparelho, boas-vindas com o empreendimento e "{corretor} · seu corretor";
  - cartão com a capa, "Seu próximo lugar em {cidade}." e "Conhecer esta oportunidade →".
- Uma vez por sessão do navegador; quem volta lê "Que bom te ver de novo." O título da aba vira "{empreendimento} · preparado para {nome}". Fecha no botão ou no Esc.
- Testes: `bridge.test.ts` roda a ponte com a API simulada (primeiro teste automatizado da ponte). Conferido em prints do Chrome em 390 px e 1440 px com uma API simulada; não foi conferido com a API real.

## 24/11/2026 — Editor da página de apresentação no admin (mini CMS)

- ADR-0027, RN-02.6, P-20. V12: `developments.page_config` (seções ocultas, blocos desligados e textos trocados); `PUT /api/admin/developments/:id/page` publica; a configuração vem com o empreendimento no showroom.
- Ponte:
  - aplica a configuração na página do cliente (layouts A e B, mesmas chaves de seção);
  - no editor (`?cms=1`), conta seções, textos e blocos, aplica ao vivo e avisa o texto clicado;
  - textos achados pelo original, com `<br>` como quebra de linha;
  - blocos: planta 3D, condomínio em 3D e posição do sol;
  - a chegada exclusiva pode ser desligada.
- Admin: `/admin/empreendimentos/:id/pagina` ("Editar página" no cadastro), no modelo Shopify/WordPress:
  - seções com o olho, blocos com interruptor e textos com "Restaurar";
  - prévia ao vivo com A/B e Computador/Celular; clique no texto da prévia abre o campo;
  - "Publicar" e "Descartar".
- Conferido no Chrome com a página real e uma API simulada: editor carregado com as seções, título trocado, 3D e simulador ocultos e rodapé novo nos layouts A e B. Testes: API (cobertura 95,4%), app com 108 testes.
