# ADR-0024 — Clientes cadastrados pelo corretor, com link de convite próprio

- **Status:** aceita
- **Data:** 24/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** RN-03.1, RN-03.14, RN-03.16, RN-02.3, ADR-0016, ADR-0019, P-01, P-18

## Contexto e problema

Pedido (CLI, 24/11/2026), sobre a tela de convites da entrega v12 (`dashboard.html#convites`): "idéia é que os corretores possam incluir os clientes via upload de csv (nome, telefone) ou de forma manual." Até aqui o cliente só existia quando abria o link do corretor (RN-03.1, RN-03.2), e o link era um só por corretor e empreendimento.

Decisões do usuário, no mesmo dia: dono quando o WhatsApp já é de outro corretor, "b" (vale quem cadastrou primeiro, mesmo sem visita); etapa do cliente cadastrado, "novo"; LGPD, "ja tem autorizacao para contatar os clientes"; empreendimento, o corretor "pode escolher conforme o que o admin tem cadastrado".

## Opções consideradas

1. Cadastrar o cliente e esperar que ele digite o WhatsApp na apresentação para juntar as fichas (RN-03.14).
2. Cadastrar o cliente com um link de convite próprio (`/e/<empreendimento>/<código>?convite=<código do cliente>`), como o convite individual da v12.

## Decisão

Opção 2. Pela opção 1, a visita criaria uma ficha anônima, e as duas só se juntariam se o cliente digitasse o WhatsApp; a jornada ficaria separada da ficha cadastrada.

- `leads.origin` (`link` ou `corretor`) e `leads.invite_code` (V10). O cliente cadastrado nasce em "novo", com nome e WhatsApp sem o 55 do país.
- Cadastro à mão (`POST /api/me/leads`) e por planilha (`POST /api/me/leads/import`, multipart, com conferência antes de gravar). A planilha aceita ponto e vírgula, vírgula ou tabulação, UTF-8 ou Latin-1, com ou sem cabeçalho (nome; telefone, whatsapp ou celular), até 500 linhas. Cada linha volta com a situação; só as válidas entram.
- O WhatsApp já cadastrado no empreendimento é recusado: "já é seu cliente" ou "já cadastrado neste empreendimento", sem dizer de quem é.
- Na visita com `convite`, o navegador ganha um token ligado à ficha cadastrada por um cadastro juntado (`merged_into`), o mesmo mecanismo da ADR-0016. A primeira visita grava o layout. Convite que não existe vale como o link do corretor.
- O convite vai pelo WhatsApp do corretor, um a um, com o texto do link exclusivo (RN-02.4) e o nome do cliente. Não há disparo em massa.
- A comparação A × B (ADR-0019) conta o cliente cadastrado só depois que ele abre o link.

## Consequências

- Boas: a jornada do cliente convidado fica na ficha dele desde a primeira abertura; nada muda para quem chega pelo link.
- Ruins / riscos: se o cliente já tinha visitado pelo link de outro corretor sem deixar o WhatsApp e depois é cadastrado, a junção pelo WhatsApp (RN-03.14) fica com o cadastro mais antigo, o da visita (P-18). O texto personalizado da v12 (saudação pelo horário, boas-vindas na página) fica para depois.

## Fontes

- `resources/Neo360_BoaVista_COMPLETO_v12/dist/cockpit/invites.mjs` (neo360-app), convite individual: telefone de 10 a 13 dígitos, um telefone por campanha, "Preparar o convite não transfere o lead".
- Conversa de 24/11/2026 (CLI).
