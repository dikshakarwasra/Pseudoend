#!/usr/bin/env bash
# ==============================================================================
# Pseudoend — Smart Continuous Update & Sync Engine (Bash)
# Checks the latest Git commit: If new changes exist, implements them; else does nothing.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BRANCH="${1:-}"
FORCE="${2:-false}"

echo "=========================================================="
echo "  🔄 Pseudoend Continuous Update Engine"
echo "=========================================================="

# 1. Verify Git availability
if ! command -v git >/dev/null 2>&1; then
  echo "❌ Git is not installed or not in PATH."
  exit 1
fi

# 2. Check branch & fetch
if [ -z "$BRANCH" ]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
  if [ "$BRANCH" = "HEAD" ]; then
    BRANCH="main"
  fi
fi

echo "📡 Fetching latest commits from origin/$BRANCH..."
git fetch origin "$BRANCH" --quiet 2>/dev/null || true

LOCAL_HASH=$(git rev-parse HEAD 2>/dev/null || echo "")
REMOTE_HASH=$(git rev-parse "origin/$BRANCH" 2>/dev/null || echo "")

# 3. Pull remote if ahead
if [ -n "$REMOTE_HASH" ] && [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
  BEHIND_COUNT=$(git rev-list --count "HEAD..origin/$BRANCH" 2>/dev/null || echo "0")
  if [ "$BEHIND_COUNT" -gt 0 ]; then
    echo "📥 Remote has $BEHIND_COUNT new commit(s). Pulling updates..."
    git pull origin "$BRANCH"
    LOCAL_HASH=$(git rev-parse HEAD 2>/dev/null || echo "")
  fi
fi

# 4. Check against state file
STATE_FILE=".pseudoend-deploy-state.json"
LAST_DEPLOYED=""

if [ -f "$STATE_FILE" ]; then
  LAST_DEPLOYED=$(grep -o '"lastDeployedCommit": *"[^"]*"' "$STATE_FILE" | sed 's/"lastDeployedCommit": *"//;s/"//' || echo "")
fi

COMMIT_MSG=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "commit")
SHORT_LOCAL="${LOCAL_HASH:0:7}"

if [ "$FORCE" != "true" ] && [ -n "$LAST_DEPLOYED" ] && [ "$LAST_DEPLOYED" = "$LOCAL_HASH" ]; then
  echo ""
  echo "✅ Everything is up to date!"
  echo "   Latest Commit: $SHORT_LOCAL - \"$COMMIT_MSG\""
  echo "   Status:        No new changes to implement. Exiting."
  echo ""
  exit 0
fi

# 5. New commits detected
echo ""
echo "🚀 New commit detected: $SHORT_LOCAL - \"$COMMIT_MSG\""

BACKEND_CHANGED=false
INFRA_CHANGED=false
PORTAL_CHANGED=false

if [ -n "$LAST_DEPLOYED" ]; then
  CHANGED_FILES=$(git diff --name-only "$LAST_DEPLOYED" "$LOCAL_HASH" 2>/dev/null || echo "")
else
  CHANGED_FILES=$(git diff --name-only "HEAD~1" "HEAD" 2>/dev/null || echo "")
fi

if [ -n "$CHANGED_FILES" ]; then
  echo "📝 Changed files in this update:"
  echo "$CHANGED_FILES" | sed 's/^/   - /'

  echo "$CHANGED_FILES" | grep -q '^backend/' && BACKEND_CHANGED=true || true
  echo "$CHANGED_FILES" | grep -q '^infrastructure/' && INFRA_CHANGED=true || true
  echo "$CHANGED_FILES" | grep -q '^portal/' && PORTAL_CHANGED=true || true
else
  BACKEND_CHANGED=true
  INFRA_CHANGED=true
  PORTAL_CHANGED=true
fi

# 6. Execute targeted updates
if [ "$BACKEND_CHANGED" = true ]; then
  echo ""
  echo "📦 Updating Backend (Lambda bundles)..."
  cd backend
  if [ -f "package.json" ]; then
    npm install --silent
    npm run build
  fi
  cd ..
fi

if [ "$INFRA_CHANGED" = true ] || [ "$BACKEND_CHANGED" = true ]; then
  echo ""
  echo "☁️ Applying Infrastructure updates (Terraform)..."
  cd infrastructure
  terraform init -input=false
  terraform apply -auto-approve -input=false
  API_URL=$(terraform output -raw api_endpoint_url 2>/dev/null || echo "")
  CLOUDFRONT_URL=$(terraform output -raw portal_cloudfront_url 2>/dev/null || echo "")
  S3_BUCKET=$(terraform output -raw portal_s3_bucket_name 2>/dev/null || echo "")
  cd ..
else
  API_URL=$(terraform -chdir=infrastructure output -raw api_endpoint_url 2>/dev/null || echo "")
  CLOUDFRONT_URL=$(terraform -chdir=infrastructure output -raw portal_cloudfront_url 2>/dev/null || echo "")
  S3_BUCKET=$(terraform -chdir=infrastructure output -raw portal_s3_bucket_name 2>/dev/null || echo "")
fi

if [ "$PORTAL_CHANGED" = true ] || [ "$BACKEND_CHANGED" = true ]; then
  echo ""
  echo "💻 Updating Frontend Web Portal..."
  if [ -n "$API_URL" ]; then
    echo "VITE_API_URL=$API_URL" > portal/.env.production
  fi
  cd portal
  if [ -f "package.json" ]; then
    npm install --silent
    VITE_API_URL="$API_URL" npm run build
  fi
  cd ..

  # Upload to S3 & invalidate CloudFront
  if [ -n "$S3_BUCKET" ] && [ -d "portal/dist" ]; then
    echo "🚀 Syncing new portal build to S3 ($S3_BUCKET)..."
    aws s3 sync portal/dist "s3://${S3_BUCKET}" --delete
    CF_DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='${S3_BUCKET}.s3.amazonaws.com']].Id | [0]" --output text 2>/dev/null || echo "")
    if [ "$CF_DIST_ID" != "None" ] && [ -n "$CF_DIST_ID" ]; then
      aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*" >/dev/null 2>&1 || true
    fi
  fi

  # Optional Vercel update
  if command -v npx >/dev/null 2>&1 && [ -n "${VERCEL_TOKEN:-}" ]; then
    cd portal
    npx --yes vercel deploy --prod --yes --token "$VERCEL_TOKEN" >/dev/null 2>&1 || true
    echo "✅ Vercel production deployment updated."
    cd ..
  fi
fi

# 7. Update state file
cat <<EOF > "$STATE_FILE"
{
  "lastDeployedCommit": "$LOCAL_HASH",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "commitMessage": "$COMMIT_MSG",
  "apiEndpointUrl": "$API_URL",
  "cloudfrontUrl": "$CLOUDFRONT_URL",
  "s3BucketName": "$S3_BUCKET"
}
EOF

echo ""
echo "=========================================================="
echo "  🎉 SUCCESS! Update implemented for commit: $SHORT_LOCAL"
echo "=========================================================="
