# ADR-0004 — Chat na página por consulta periódica, com WhatsApp ao lado, sem e-mail

- **Status:** substituída pela ADR-0015 (17/11/2026): o chat da página saiu; a conversa é pelo WhatsApp
- **Data:** 16/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** RN-03.5, P-05, P-10

## Contexto e problema

O corretor precisa conversar com o cliente que reagiu ao empreendimento. O hábito do mercado é o WhatsApp do próprio corretor.

## Opções consideradas

1. Só link `wa.me` com mensagem pronta.
2. Chat na página, guardado no sistema, com o WhatsApp como alternativa.
3. WhatsApp Business API oficial (número central, pago por conversa, verificação da empresa).

## Decisão

Opção 2, escolhida pelo usuário: "Chat na página se possível porém de forma que não se descarta conversa via WhatsApp [...] notificações via e-mail por hora não irá ter".

- As mensagens ficam na tabela `messages`; o app consulta a cada 5 segundos com a conversa aberta.
- O botão do WhatsApp do corretor aparece no chat e na página; o clique é registrado como evento.
- Na ficha do cliente, o corretor responde pelo chat ou abre o WhatsApp do cliente, se ele deixou o número.

## Consequências

- Boas: o histórico fica no sistema; sem custo por mensagem; o cliente escolhe o canal.
- Ruins / riscos: sem e-mail nem push, o corretor só vê mensagem nova com o painel aberto (P-05). Consulta periódica não escala para muitos chats abertos; trocar por SSE quando o volume pedir (P-10).
