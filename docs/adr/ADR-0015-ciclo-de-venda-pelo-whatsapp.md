# ADR-0015 — Ciclo de venda: proposta na plataforma, conversa e fechamento pelo WhatsApp

- **Status:** aceita
- **Data:** 17/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Substitui:** ADR-0004 (chat na página)
- **Relacionados:** ADR-0008, ADR-0011, ADR-0013, ADR-0014, RN-03.5, RN-03.6, RN-03.8, RN-03.12, RN-03.13

## Contexto e problema

Pedido do usuário (17/11/2026):
- "Quero remover a estrutura de chat agora, apenas de envio de proposta e partindo principio que sera fechado pelo whatsapp, porém se caso o cliente fechar quero que seja possível incluir isso na plataforma."
- "o painel drag and drop esta com opção de arrastar para raia e também tem no proprio card de cliente a possibilidade de altear o status porém permanece na mesma raia [...] revisite este fluxo."
- "Interesse e o que o cliente fez [...] mais no formato timeline [...] como traz no google analitycs", com "Onde passou mais tempo" na mesma seção.
- "A alteração de status hoje esta contraintuitiva [...] quero algo mais intuitivo de verdade."
- Abas Resumo, Propostas e Atividades.
- "caso haja ajuste na proposta pode ser alterado por parte do corretor. Feche o ciclo de ponta a ponta."

O chat da página competia com o WhatsApp, que é onde a conversa acontece de fato. Além disso, a plataforma não tinha como registrar a venda fechada, e a proposta não tinha versões.

## Decisão

**Ciclo, de ponta a ponta:**
1. O corretor envia o link exclusivo (RN-02.1).
2. O cliente abre a apresentação; a navegação é medida com o aceite da página (RN-03.3).
3. Dúvidas, a bolha "Fale com seu corretor", o botão do cartão do consultor e "Prefiro conversar com o corretor" abrem o **WhatsApp do corretor com o texto pronto**. Cada toque é registrado (`whatsapp`, com a origem).
4. O cliente monta e envia a **proposta**, com nome e WhatsApp, em `POST /api/public/lead/proposals`. A proposta:
   - grava o contato;
   - cria o registro em `proposals` e o evento `proposta`;
   - leva o cliente à etapa **Proposta**, se ainda estava antes dela.

   A página oferece em seguida "Continuar no WhatsApp com <corretor>", com a proposta resumida.
5. O painel avisa ao vivo, e "propostas novas" substitui "mensagens novas" no sino, no menu e no quadro.
6. O corretor negocia pelo WhatsApp. Se a condição muda, ele **ajusta a proposta**: uma nova versão, com a anterior preservada, enviada ao cliente pelo WhatsApp com o texto da condição pronto (`POST /api/me/leads/:id/proposals`, RN-03.12).
7. O desfecho é registrado na plataforma (RN-03.13):
   - **Venda fechada**, com o valor (sugerido pela proposta escolhida), a proposta de base e uma observação;
   - **Sem venda**, com o motivo, opcional.

   "Reabrir negociação" volta para uma etapa em aberto e limpa o desfecho.
8. O corretor e o admin veem vendas fechadas e o valor vendido nas visões gerais e no quadro.

**Funil:** Novo → Em atendimento → Proposta, mais os desfechos Venda fechada e Sem venda (o antigo "encerrado"). A migração V6 aceita `fechado` e grava o desfecho em `leads` (`outcome_at`, `sale_value`, `sale_proposal_id`, `outcome_note`).

**Quadro:**
- uma coluna por etapa, cinco no total;
- o cartão perdeu o seletor de etapa, que duplicava a coluna e confundia;
- mudar de coluna é arrastar ou usar "Mover para" no cartão, que serve para celular e teclado;
- soltar em Venda fechada ou Sem venda abre o registro do desfecho antes de mover.

**Ficha com três abas:**
- **Resumo:**
  - controle de etapa: trilho só para mostrar onde o cliente está, botão "Avançar para <próxima>", botões "Venda fechada" e "Sem venda" e o menu "Outra etapa";
  - última proposta;
  - interesse em números.
- **Propostas:** versões do cliente e do corretor, com "Ajustar proposta" e WhatsApp.
- **Atividades:** análise no formato do explorador de usuário do Google Analytics:
  - números do topo (visitas, tempo lendo, seções vistas, eventos-chave);
  - jornada por visita (nova a cada abertura do link ou depois de 30 minutos parado), com hora, duração e eventos-chave marcados;
  - "Onde passou mais tempo" e "Principais ações", que filtram a jornada.

**Chat removido:**
- saem as rotas `/public/lead/messages` e `/me/leads/:id/messages`, o widget do showroom padrão (que vira um botão flutuante de WhatsApp) e a aba Conversa;
- a tabela `messages` fica no banco, sem uso, para não perder as conversas já registradas;
- os eventos antigos `chat_aberto` continuam com rótulo na jornada.

**Migração das propostas:** os eventos `proposta` já gravados viraram registros em `proposals`, marcados como vistos.

## Consequências

- A plataforma deixa de guardar a conversa: o que é combinado no WhatsApp entra como proposta ajustada ou no desfecho.
- "Subir o contrato" depois de enviar grava uma nova proposta marcada com o pedido. Reenviar a mesma condição não duplica.
- O ajuste do corretor não sabe as regras da campanha (estão no HTML da apresentação, P-03), então não mostra "Dentro das regras" nem "Sujeita à aprovação especial".
- Os valores de venda são os que o corretor informa; não há conferência com a incorporadora (P-13).
