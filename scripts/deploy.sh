#!/usr/bin/env bash
# ============================================================
# AI_Doctor — Deploy Script
# Supports: staging, production, rollback
#
# Usage:
#   ./scripts/deploy.sh staging          # Deploy to staging
#   ./scripts/deploy.sh production       # Deploy to production
#   ./scripts/deploy.sh rollback staging # Rollback staging
#   ./scripts/deploy.sh rollback prod    # Rollback production
# ============================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ── Pre-flight checks ───────────────────────────────────
check_prerequisites() {
    log_info "Running pre-flight checks..."

    # Docker
    if ! command -v docker &>/dev/null; then
        log_error "Docker is not installed."
        exit 1
    fi

    # Docker Compose
    if ! docker compose version &>/dev/null; then
        log_error "Docker Compose v2 is not available."
        exit 1
    fi

    # .env file
    if [ ! -f .env ]; then
        log_error ".env file not found. Copy .env.example and fill in values."
        exit 1
    fi

    log_ok "Pre-flight checks passed."
}

# ── Health check ────────────────────────────────────────
wait_for_healthy() {
    local max_attempts="${1:-30}"
    local wait_seconds="${2:-5}"
    local attempt=1

    log_info "Waiting for healthy state (max ${max_attempts} attempts)..."

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "http://localhost:${PORT:-3000}/api/health" >/dev/null 2>&1; then
            local response
            response=$(curl -sf "http://localhost:${PORT:-3000}/api/health" 2>/dev/null)
            log_ok "Application is healthy! (attempt ${attempt}/${max_attempts})"
            echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
            return 0
        fi

        log_warn "Attempt ${attempt}/${max_attempts} — not ready yet..."
        sleep "$wait_seconds"
        attempt=$((attempt + 1))
    done

    log_error "Application did not become healthy after $((max_attempts * wait_seconds))s"
    log_info "Last 50 lines of logs:"
    docker compose logs --tail=50 2>/dev/null || true
    return 1
}

# ── Pre-deploy validation ──────────────────────────────
pre_deploy_check() {
    local env="$1"

    log_info "Running pre-deploy validation for ${env}..."

    # Type check
    log_info "TypeScript check..."
    npx tsc --noEmit || { log_error "TypeScript check failed!"; return 1; }
    log_ok "TypeScript check passed."

    # Tests
    log_info "Running tests..."
    npx vitest run --reporter=verbose || { log_error "Tests failed!"; return 1; }
    log_ok "All tests passed."

    # Build
    log_info "Building production bundle..."
    npm run build || { log_error "Build failed!"; return 1; }
    log_ok "Build succeeded."
}

# ── Deploy ─────────────────────────────────────────────
do_deploy() {
    local env="$1"
    local compose_file

    case "$env" in
        staging)
            compose_file="docker-compose.staging.yml"
            ;;
        production|prod)
            compose_file="docker-compose.prod.yml"
            ;;
        *)
            log_error "Unknown environment: $env. Use 'staging' or 'production'."
            exit 1
            ;;
    esac

    log_info "Deploying to ${env}..."
    echo "  Compose file: ${compose_file}"
    echo "  Timestamp:    $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo ""

    # Save current image tag for rollback
    local current_image
    current_image=$(docker compose -f "$compose_file" images -q app 2>/dev/null || echo "none")
    echo "$current_image" > ".deploy-backup-${env}.txt"

    # Build and deploy
    docker compose -f "$compose_file" up -d --build --force-recreate

    log_ok "Deployment triggered. Waiting for health check..."
    if wait_for_healthy 30 5; then
        log_ok "Deployment to ${env} completed successfully!"
    else
        log_error "Health check failed after deployment."
        log_info "To rollback: make rollback ENV=${env}"
        exit 1
    fi
}

# ── Rollback ───────────────────────────────────────────
do_rollback() {
    local env="${1:-staging}"
    local compose_file

    case "$env" in
        staging)  compose_file="docker-compose.staging.yml" ;;
        prod|production) compose_file="docker-compose.prod.yml" ;;
        *) log_error "Unknown environment: $env"; exit 1 ;;
    esac

    local backup_file=".deploy-backup-${env}.txt"
    if [ ! -f "$backup_file" ]; then
        log_error "No backup found at ${backup_file}. Cannot rollback."
        exit 1
    fi

    log_warn "Rolling back ${env} deployment..."
    docker compose -f "$compose_file" down
    docker compose -f "$compose_file" up -d

    if wait_for_healthy 30 5; then
        log_ok "Rollback completed successfully!"
    else
        log_error "Rollback health check failed."
        exit 1
    fi
}

# ── Main ───────────────────────────────────────────────
ACTION="${1:-}"
ENV_TARGET="${2:-staging}"

case "$ACTION" in
    staging|production|prod)
        check_prerequisites
        pre_deploy_check "$ACTION"
        do_deploy "$ACTION"
        ;;
    rollback)
        check_prerequisites
        do_rollback "$ENV_TARGET"
        ;;
    *)
        echo ""
        echo "AI_Doctor — Deploy Script"
        echo ""
        echo "Usage:"
        echo "  ./scripts/deploy.sh <environment>        Deploy (staging|production|prod)"
        echo "  ./scripts/deploy.sh rollback <env>       Rollback to previous version"
        echo ""
        echo "Examples:"
        echo "  ./scripts/deploy.sh staging"
        echo "  ./scripts/deploy.sh production"
        echo "  ./scripts/deploy.sh rollback staging"
        echo ""
        exit 1
        ;;
esac