# Estilo — Neo360

## Go

- `gofmt` sempre (`make -C api lint` confere). Identificadores em inglês; mensagens e comentários em português.
- Comentário de pacote e de função pública explica o porquê e cita a regra (`RN-xx.y`) quando houver.
- SQL como constantes no topo do repositório; `columns` e `from` compartilhados entre as consultas.
- Erros: `fmt.Errorf("op: %w", err)` para erro inesperado; erro do domínio para o que o usuário pode corrigir.

## SQL

- Tabelas e colunas em inglês, `snake_case`, chaves `UUID DEFAULT gen_random_uuid()`, datas `TIMESTAMPTZ`.
- Restrições no banco (`CHECK`, `UNIQUE`, `REFERENCES`) espelham a validação da entidade.

## TypeScript / React

- Componentes em `PascalCase.tsx`, um módulo por área (`modules/<area>/{model,services,components,pages}`).
- Arquivo de componente só exporta componentes; utilidades em `.ts` (fast refresh).
- Textos de tela em português do Brasil, frases curtas, sem jargão técnico para o cliente.
- Estilo com Tailwind e os tokens do tema; `cn()` para combinar classes.
