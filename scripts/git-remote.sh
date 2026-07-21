#!/usr/bin/env bash
# =============================================================================
# scripts/git-remote.sh — Helper para gerenciar pushes entre AI_Doctor e Academ-IA
# =============================================================================
# AI_Doctor   → https://github.com/Nexus-HUB57/AI_Doctor   (plataforma clínica)
# Academ-IA   → https://github.com/Nexus-HUB57/Academ-IA   (ecossistema acadêmico)
#
# Por padrão, novos commits devem ir para Academ-IA (migração de materiais
# didáticos é a direção atual). Commits de código/plataforma vão para AI_Doctor.
#
# Uso:
#   ./scripts/git-remote.sh push academ-ia feature/migracao-x
#   ./scripts/git-remote.sh push ai-doctor feature/fase-2-sync
#   ./scripts/git-remote.sh status
# =============================================================================

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

REMOTE_AI_DOCTOR="https://github.com/Nexus-HUB57/AI_Doctor.git"
REMOTE_ACADEM_IA="https://github.com/Nexus-HUB57/Academ-IA.git"

# Lê token do secret store se disponível
TOKEN_FILE="$HOME/.nexus_github_token"
if [ -f "$TOKEN_FILE" ]; then
  TOKEN=$(cat "$TOKEN_FILE")
  REMOTE_AI_DOCTOR="https://${TOKEN}@github.com/Nexus-HUB57/AI_Doctor.git"
  REMOTE_ACADEM_IA="https://${TOKEN}@github.com/Nexus-HUB57/Academ-IA.git"
fi

# Lê token da env var como fallback
if [ -z "$TOKEN" ] && [ -n "$NEXUS_GITHUB_TOKEN" ]; then
  TOKEN="$NEXUS_GITHUB_TOKEN"
  REMOTE_AI_DOCTOR="https://${TOKEN}@github.com/Nexus-HUB57/AI_Doctor.git"
  REMOTE_ACADEM_IA="https://${TOKEN}@github.com/Nexus-HUB57/Academ-IA.git"
fi

cmd="${1:-status}"
shift || true

case "$cmd" in
  status)
    echo "🔍 Remotes configurados em $(basename "$REPO_ROOT"):"
    git remote -v
    echo ""
    echo "📂 Onde estou:"
    echo "  Repo root:  $REPO_ROOT"
    echo "  Branch:     $(git branch --show-current)"
    echo "  Status:     $(git status --short | wc -l) arquivo(s) modificado(s)"
    echo ""
    echo "📌 Alvo padrão de pushes (este repo):"
    if git remote get-url origin 2>/dev/null | grep -q "AI_Doctor"; then
      echo "  → AI_Doctor (plataforma clínica)"
    elif git remote get-url origin 2>/dev/null | grep -q "Academ-IA"; then
      echo "  → Academ-IA (ecossistema acadêmico)"
    fi
    ;;
  push)
    target="${1:?informe o target: ai-doctor|academ-ia}"
    branch="${2:-$(git branch --show-current)}"
    if [ -z "$branch" ]; then
      echo "❌ Nenhuma branch ativa. Use: $0 push $target feature/nome"
      exit 1
    fi
    case "$target" in
      ai-doctor|ai_doctor|aidoctor)
        remote_url="$REMOTE_AI_DOCTOR"
        label="AI_Doctor"
        ;;
      academ-ia|academ_ia|academia)
        remote_url="$REMOTE_ACADEM_IA"
        label="Academ-IA"
        ;;
      *)
        echo "❌ target inválido: $target (use ai-doctor|academ-ia)"
        exit 1
        ;;
    esac
    echo "🚀 Pushing $branch → $label..."
    git push "$remote_url" "$branch"
    echo "✅ Push completo: $label/$branch"
    ;;
  setup)
    # Configura token e remotes para uso local
    echo "🔑 Configurando autenticação..."
    read -sp "GitHub token (input será oculto): " TOKEN
    echo
    mkdir -p "$HOME"
    echo -n "$TOKEN" > "$TOKEN_FILE"
    chmod 600 "$TOKEN_FILE"
    echo "✅ Token salvo em $TOKEN_FILE (perms 600)"
    echo ""
    echo "📂 Para qual repo você está configurando?"
    read -p "  (ai-doctor|academ-ia): " target
    case "$target" in
      ai-doctor)
        git remote set-url origin "$REMOTE_AI_DOCTOR"
        echo "✅ AI_Doctor origin configurado"
        ;;
      academ-ia)
        git remote set-url origin "$REMOTE_ACADEM_IA"
        echo "✅ Academ-IA origin configurado"
        ;;
    esac
    git remote -v
    ;;
  *)
    echo "Uso: $0 {status|push <ai-doctor|academ-ia> [branch]|setup}"
    exit 1
    ;;
esac
