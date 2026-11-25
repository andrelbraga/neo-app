# ADR-0028 — Fila de envio pelo WhatsApp, sem a API da Meta

- **Status:** aceita
- **Data:** 25/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** RN-03.6, RN-03.20, RN-03.22, ADR-0015, ADR-0024, ADR-0025, P-19

## Contexto e problema

Pergunta (CLI, 24/11/2026): "Qual forma seria mais pratica para o corretor na hora de enviar as mensagens para os whats dos clientes, partindo do proncipio que não estou plugado na API da Meta neste momento e quero continuar dentro da minha plataforma."

Com a ADR-0025, o corretor manda a mensagem de um cliente por vez, pela ficha ou pelo menu ⋮. Com dezenas de clientes cadastrados (RN-03.16), isso fica lento, e a plataforma não sabe para quem ele já mandou.

## Opções consideradas

1. Link `wa.me` com o texto pronto, um cliente por vez (o que havia).
2. Fila guiada sobre o `wa.me`: o corretor escolhe os clientes e o tom; a plataforma abre o WhatsApp de cada um com a mensagem pronta e registra o envio que o corretor confirma.
3. Copiar o texto para uma lista de transmissão do WhatsApp Business: sai da plataforma, exige o contato salvo na agenda do corretor e perde o link de convite de cada cliente.
4. Automação não oficial do WhatsApp Web (whatsapp-web.js, Baileys, extensões): viola os termos do WhatsApp e arrisca o número do corretor.

## Decisão

Opção 2. Decisões do usuário (25/11/2026): a confirmação leva **novo → em atendimento**; **sem limite** de clientes por fila; quem já recebeu aparece com **"enviado em DD/MM"**, sem impedir o reenvio.

- **API:**
  - `POST /api/me/leads/:id/message-sent` com `profile` e `tone` grava o evento `mensagem_enviada` e passa o cliente de novo para em atendimento. Quem já está adiante não muda. Cliente sem WhatsApp é recusado.
  - O evento é do corretor: não conta como atividade do cliente, não é sinal de interesse e não entra no feed ao vivo.
  - A lista e a ficha trazem `last_message_at`, o último envio confirmado.
- **App:**
  - Em Meus clientes (ativos), cada cliente tem um checkbox, e o cabeçalho marca todos os visíveis. Quem não tem WhatsApp fica com o checkbox desligado. Com alguém marcado, aparece a barra "N selecionados · Limpar · Enviar WhatsApp". Mudar a busca ou a aba limpa a seleção. Pedido do usuário (25/11/2026): "Na lista dos clientes quero que tenha checkboxes e com a opção de enviar WhatsApp".
  - "Enviar WhatsApp" abre a fila com os marcados: o corretor escolhe o tom e começa.
  - A fila mostra um cliente por vez, com a mensagem do modelo do perfil dele (RN-03.20) e o link próprio, editável. "Abrir no WhatsApp", depois "Sim, enviei", "Abrir de novo" ou "Pular". No fim, um resumo.
  - A mensagem avulsa da ficha e do menu ⋮ também pede a confirmação.
  - A mensagem enviada não entra na jornada do cliente (não é visita).
  - A tela avisa que muitas mensagens iguais em sequência podem fazer o WhatsApp sinalizar o número.

## Consequências

- Boas: o corretor envia muitas mensagens sem sair da plataforma, cada cliente recebe o próprio link (a abertura dele continua sendo medida) e a plataforma sabe para quem já foi. Quando houver a API da Meta, a fila é a mesma e só muda quem envia.
- Ruins / riscos:
  - "enviado" é a palavra do corretor: sem a API não há confirmação de entrega nem de leitura; a prova é a visita do cliente pelo link.
  - cada envio ainda é um toque no WhatsApp;
  - envio em volume pelo número pessoal pode ser sinalizado pelo WhatsApp.

## Fontes

- Conversa de 24 e 25/11/2026 (CLI).
