# ADR-0020 — Usuários no admin e reset por senha provisória, sem exibir senhas

- **Status:** aceita
- **Data:** 17/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** RN-01.7, RN-01.8, P-08

## Contexto e problema

Pedido do usuário (17/11/2026): "Me traga os usuários cadastrados na plataforma, quero poder visualizar a senha cadastrada com o ícone do olhinho e possibilidade de reset de senha".

A senha cadastrada não pode ser exibida: ela é guardada só como hash bcrypt, que não se desfaz. Guardar a senha de forma reversível exporia a senha de todos num vazamento do banco, ou a quem tiver acesso de admin, e muitas pessoas usam a mesma senha em outros serviços. Também seria um problema de LGPD. Perguntado, o usuário escolheu o reset por senha provisória, trocada no primeiro acesso.

## Decisão

- **Tela "Usuários" no admin** (`/admin/usuarios`, `GET /api/admin/users`):
  - todas as contas (admins e corretores), com nome, e-mail, perfil (com o código do corretor) e situação;
  - a situação da senha: "•••••••• protegida", ou "Provisória · aguardando troca" com a data do reset. A senha em si nunca sai da API.
- **Reset** (`POST /api/admin/users/:id/reset-password`):
  - gera uma senha provisória aleatória (3 blocos de 4 caracteres, sem os que se confundem, com fonte aleatória segura);
  - grava só o hash e marca `must_change_password` (V9);
  - a senha provisória volta uma única vez, num diálogo em que aparece escondida, com o olho para mostrar e o botão de copiar. Depois de fechar, só gerando outra.
- **Troca obrigatória:**
  - quem entra com a senha provisória vai direto para "Crie a sua senha";
  - a API recusa o resto até a troca (403 "troque a senha provisória para continuar"), liberando só `GET /api/auth/me` e `PUT /api/auth/password`;
  - a troca pede a senha atual (ou a provisória), 8 caracteres no mínimo e uma senha diferente da atual.
- **Olho nos campos de senha:** login, cadastro, cadastro de profissional e troca de senha, para conferir o que está sendo digitado.
- **Trocar senha** passa a estar no menu da conta, para qualquer usuário.

## Consequências

- Ninguém, nem o admin, sabe a senha final do usuário. O admin conhece só a provisória, que deixa de valer na troca.
- A senha provisória vai do admin ao usuário por fora da plataforma (WhatsApp, telefone): a plataforma não envia mensagens (P-05). A recuperação de senha pelo próprio usuário continua pendente (P-08).
