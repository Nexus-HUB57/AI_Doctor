# AI_Doctor — Makefile
# Unified commands for development, testing, and deployment.

.PHONY: help dev build test lint clean staging prod deploy rollback logs

# Default target
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Development ─────────────────────────────────────────
dev: ## Start development server with hot reload
	npm run dev

install: ## Install all dependencies
	npm ci

# ── Quality ─────────────────────────────────────────────
lint: ## Run TypeScript type checking
	npx tsc --noEmit

test: ## Run all tests (vitest)
	npx vitest run --reporter=verbose

test-watch: ## Run tests in watch mode
	npx vitest

test-coverage: ## Run tests with coverage report
	npx vitest run --coverage

# ── Build ───────────────────────────────────────────────
build: ## Build production frontend bundle
	npm run build

clean: ## Remove build artifacts
	rm -rf dist node_modules/.vite

# ── Docker Environments ─────────────────────────────────
staging: ## Start staging environment
	docker compose -f docker-compose.staging.yml up -d --build

staging-down: ## Stop staging environment
	docker compose -f docker-compose.staging.yml down

staging-logs: ## Tail staging logs
	docker compose -f docker-compose.staging.yml logs -f

prod: ## Start production environment
	docker compose -f docker-compose.prod.yml up -d --build

prod-down: ## Stop production environment
	docker compose -f docker-compose.prod.yml down

prod-logs: ## Tail production logs
	docker compose -f docker-compose.prod.yml logs -f

# ── Deployment ──────────────────────────────────────────
deploy: ## Run deployment script (staging or prod)
	@bash scripts/deploy.sh $(ENV)

rollback: ## Rollback to previous version
	@bash scripts/deploy.sh rollback $(ENV)

# ── Utilities ───────────────────────────────────────────
health: ## Check application health
	@curl -sf http://localhost:${PORT:-3000}/api/health | python3 -m json.tool 2>/dev/null || \
		echo "Server not responding on port ${PORT:-3000}"

ps: ## Show running containers
	docker compose ps

shell: ## Open shell in running app container
	docker compose exec app sh