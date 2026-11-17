# ADR-0014 — Proposta do cliente em seção própria, com a condição em números

- **Status:** aceita
- **Data:** 17/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** ADR-0012 (simulador e linha do tempo do pagamento), ADR-0013 (layout do painel), RN-03.4

## Contexto e problema

Pedido do usuário: "Quero que a proposta enviada pelo cliente sera em uma sessão exclusiva, formatada". A proposta chegava ao CRM só como texto corrido (`resumo`), junto com o resto do resumo da ficha. Não dava para ler de relance a entrada, as parcelas, os reforços nem os veículos.

## Decisão

- **Apresentação (ponte):** ao enviar, `neo360-bridge.js` lê o simulador (`calc()`, `CAMPANHA`, veículos) e manda, junto com o texto, um objeto `condicao` com:
  - preço e preço de referência, campanha e validade;
  - entrada (e em quantas vezes), parcelas e valor da parcela, saldo;
  - reforços (quantidade e valor) e pagamento nas chaves;
  - até 3 veículos;
  - `sujeita_aprovacao`, com a mesma regra que a apresentação já mostra (entrada abaixo do mínimo da campanha ou saldo negativo).

  Se o simulador não estiver disponível, vai só o texto, como antes. O texto passou a ter no máximo 700 caracteres, para caber no limite de 2 KB por evento da API. A API não muda.
- **CRM:** a ficha do cliente ganha a aba **Propostas**, com contador. Cada proposta é um documento (`ProposalSheet`) com:
  - número, data e situação ("Pediu para seguir ao contrato", "Dentro das regras da campanha" ou "Sujeita à aprovação especial");
  - valor da proposta, valor de referência riscado e campanha;
  - "Como o cliente paga": barra proporcional e lista com valor, detalhe e % de cada parte, mais o total;
  - veículos, observação do cliente e o texto original (recolhido);
  - "Responder no WhatsApp" (corretor) e "Copiar proposta".
- **Resumo da ficha:** fica só um atalho para a aba, com o número de propostas, a data, o valor e a entrada da última. O ícone de proposta e a linha "Enviou proposta" do interesse também abrem a aba.
- **Propostas antigas,** sem os números, aparecem na mesma aba só com o texto e um aviso.

## Consequências

- Nenhum número é calculado no CRM: tudo vem do simulador no momento do envio. Por isso o CRM mostra exatamente o que o cliente viu.
- A condição vem da página pública e é lida de forma defensiva (`proposalsOf`): campo ausente ou estranho vira zero ou é ignorado. Sem preço, a proposta é tratada como antiga.
