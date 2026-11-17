.PHONY: help setup dev build preview test lint typecheck check

help: ## Mostra este menu de ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-12s\033[0m %s\n", $$1, $$2}'

setup: ## Instala dependências e copia .env.example (se não existir)
	@cp -n .env.example .env 2>/dev/null || true
	@npm install

dev: ## Vite em http://localhost:5174 (API em http://localhost:8081)
	@npm run dev

build: ## Build de produção em dist/
	@npm run build

preview: ## Serve o build de produção
	@npm run preview

test: ## Testes (Vitest)
	@npm test

lint: ## ESLint
	@npm run lint

typecheck: ## TypeScript sem emitir arquivos
	@npm run typecheck

check: typecheck lint test ## Tudo que precisa passar antes de um PR
