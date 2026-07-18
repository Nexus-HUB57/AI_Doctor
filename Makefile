# AI_Doctor — Makefile
# Unified commands for development, testing, and deployment.

.PHONY: help dev install lint test test-watch test-coverage build clean \
        staging staging-down staging-logs prod prod-down prod-logs \
        fullstack fullstack-down fullstack-logs fullstack-restart \
        deploy rollback health ps shell \
        agent agent-logs streamlit-logs db-shell

# Default target
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

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

stress: ## Run all 100 stress tests
	node scripts/stress-runner.mjs all

# ── Build ───────────────────────────────────────────────
build: ## Build production frontend bundle
	npm run build

clean: ## Remove build artifacts
	rm -rf dist node_modules/.vite

# ── Full-Stack Docker (Web + Python Agent + DIMHEX) ────
fullstack: ## Start full-stack environment (all 7 services)
	docker compose -f docker-compose.fullstack.yml up -d --build

fullstack-down: ## Stop full-stack environment
	docker compose -f docker-compose.fullstack.yml down

fullstack-logs: ## Tail all full-stack logs
	docker compose -f docker-compose.fullstack.yml logs -f

fullstack-restart: ## Restart all services
	docker compose -f docker-compose.fullstack.yml restart

# ── Docker Environments (Web Only) ──────────────────────
staging: ## Start staging environment (web only)
	docker compose -f docker-compose.staging.yml up -d --build

staging-down: ## Stop staging environment
	docker compose -f docker-compose.staging.yml down

staging-logs: ## Tail staging logs
	docker compose -f docker-compose.staging.yml logs -f

prod: ## Start production environment (web only)
	docker compose -f docker-compose.prod.yml up -d --build

prod-down: ## Stop production environment
	docker compose -f docker-compose.prod.yml down

prod-logs: ## Tail production logs
	docker compose -f docker-compose.prod.yml logs -f

# ── Agent Python ────────────────────────────────────────
agent: ## Run Python agent locally (DIMHEX + Monte Carlo)
	cd "Agentic IA Doctor/AI_Doctor" && python main.py

agent-test: ## Run Python agent tests
	cd "Agentic IA Doctor/AI_Doctor" && python -m pytest tests/ -v

streamlit: ## Run Streamlit dashboard locally
	cd "Agentic IA Doctor/AI_Doctor" && streamlit run dashboard/app.py

# ── Deployment ──────────────────────────────────────────
deploy: ## Run deployment script (staging, prod, or fullstack)
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
	docker compose exec web sh

agent-shell: ## Open shell in running agent container
	docker compose -f docker-compose.fullstack.yml exec agente sh

db-shell: ## Open MySQL shell
	docker compose -f docker-compose.fullstack.yml exec mysql mysql -u ai_doctor -p

agent-logs: ## Tail DIMHEX agent logs
	docker compose -f docker-compose.fullstack.yml logs -f agente

streamlit-logs: ## Tail Streamlit logs
	docker compose -f docker-compose.fullstack.yml logs -f streamlit