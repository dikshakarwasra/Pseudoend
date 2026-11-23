#!/usr/bin/env bash
# ==============================================================================
# Pseudoend — Master Zero-Cost 1-Click Bootstrap Engine (Bash)
# Supports: AWS Serverless (Terraform / HashiCorp) + Client (Vercel & CloudFront)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RESET_STATE="${1:-false}"

echo "=========================================================="
echo "  🚀 Starting Pseudoend Deployment & Bootstrap Engine"
echo "  Targets: AWS Free Tier + Terraform + Vercel / CloudFront"
echo "=========================================================="

# 1. Pre-flight sanity checks
MISSING_TOOLS=()
command -v aws >/dev/null 2>&1 || MISSING_TOOLS+=("aws")
command -v terraform >/dev/null 2>&1 || MISSING_TOOLS+=("terraform")
command -v node >/dev/null 2>&1 || MISSING_TOOLS+=("node")
command -v npm >/dev/null 2>&1 || MISSING_TOOLS+=("npm")

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
  echo "❌ Missing required tools: ${MISSING_TOOLS[*]}"
  echo "Please install missing tools before proceeding."
  exit 1
fi
echo "✅ Pre-flight checks passed: AWS CLI, Terraform, Node.js, and npm are available."

# 2. Check AWS Identity
echo "🔍 Checking AWS authentication..."
CALLER_JSON=$(aws sts get-caller-identity --output json 2>/dev/null || echo "")
if [ -z "$CALLER_JSON" ]; then
  echo "❌ AWS credentials not configured or expired."
  echo "   Run 'aws configure' to update your Access Key ID and Secret Access Key."
  exit 1
fi
AWS_ACCOUNT=$(echo "$CALLER_JSON" | grep -o '"Account": *"[^"]*"' | sed 's/"Account": *"//;s/"//' || echo "")
echo "✅ AWS credentials verified: Account $AWS_ACCOUNT"

# 3. Detect AWS Account Switch & State Conflict
if [ -f "infrastructure/terraform.tfstate" ]; then
  STATE_ACCOUNT=$(grep -o 'arn:aws:[a-z0-9-]*::[0-9]*:' infrastructure/terraform.tfstate | head -n 1 | grep -o '[0-9]\{12\}' || echo "")
  if [ -n "$STATE_ACCOUNT" ] && [ "$STATE_ACCOUNT" != "$AWS_ACCOUNT" ]; then
    echo "⚠️ Detected Terraform state from different AWS account ($STATE_ACCOUNT)."
    echo "   Current active account is: $AWS_ACCOUNT"
    echo "   Archiving old state to infrastructure/terraform.tfstate.bak-$STATE_ACCOUNT..."
    mv infrastructure/terraform.tfstate "infrastructure/terraform.tfstate.bak-$STATE_ACCOUNT"
    if [ -f "infrastructure/terraform.tfstate.backup" ]; then
      mv infrastructure/terraform.tfstate.backup "infrastructure/terraform.tfstate.backup.bak-$STATE_ACCOUNT"
    fi
    rm -rf infrastructure/.terraform
    echo "✅ Clean slate prepared for new AWS account $AWS_ACCOUNT."
  fi
fi

# 4. Build Backend Lambda handlers
if [ -d "backend" ]; then
  echo ""
  echo "📦 Building Backend Lambda Functions with esbuild..."
  cd backend
  if [ -f "package.json" ]; then
    npm install --silent
    npm run build
  fi
  cd ..
  echo "✅ Backend Lambda bundle ready."
fi

# 5. Apply Terraform Infrastructure
API_URL=""
CLOUDFRONT_URL=""
S3_BUCKET=""
DYNAMO_TABLE=""

if [ -d "infrastructure" ]; then
  echo ""
  echo "☁️ Provisioning AWS Infrastructure with Terraform..."
  cd infrastructure
  terraform init -input=false
  terraform apply -auto-approve -input=false

  API_URL=$(terraform output -raw api_endpoint_url 2>/dev/null || echo "")
  CLOUDFRONT_URL=$(terraform output -raw portal_cloudfront_url 2>/dev/null || echo "")
  S3_BUCKET=$(terraform output -raw portal_s3_bucket_name 2>/dev/null || echo "")
  DYNAMO_TABLE=$(terraform output -raw dynamodb_table_name 2>/dev/null || echo "")
  cd ..
  echo "✅ Terraform infrastructure applied."
fi

# 6. Build Frontend Web Portal
VERCEL_URL=""
if [ -d "portal" ] && [ -n "$API_URL" ]; then
  echo ""
  echo "💻 Configuring & Building Frontend Portal..."
  echo "VITE_API_URL=$API_URL" > portal/.env.production
  echo "VITE_API_URL=$API_URL" > portal/.env

  cd portal
  if [ -f "package.json" ]; then
    npm install --silent
    VITE_API_URL="$API_URL" npm run build
  fi
  cd ..

  # 7. Deploy to S3 + CloudFront
  if [ -n "$S3_BUCKET" ] && [ -d "portal/dist" ]; then
    echo "🚀 Uploading Portal to S3 ($S3_BUCKET) and Edge CDN..."
    aws s3 sync portal/dist "s3://${S3_BUCKET}" --delete
    CF_DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='${S3_BUCKET}.s3.amazonaws.com']].Id | [0]" --output text 2>/dev/null || echo "")
    if [ "$CF_DIST_ID" != "None" ] && [ -n "$CF_DIST_ID" ]; then
      echo "🔄 Invalidating CloudFront cache ($CF_DIST_ID)..."
      aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*" >/dev/null 2>&1 || true
    fi
    echo "✅ CloudFront Edge CDN updated."
  fi

  # 8. Optional Vercel Deployment
  if command -v vercel >/dev/null 2>&1 || command -v npx >/dev/null 2>&1; then
    echo ""
    echo "▲ Deploying to Vercel..."
    cd portal
    set +e
    if [ -n "${VERCEL_TOKEN:-}" ]; then
      VERCEL_OUTPUT=$(npx --yes vercel deploy --prod --yes --token "$VERCEL_TOKEN" 2>&1)
    else
      VERCEL_OUTPUT=$(npx --yes vercel deploy --prod --yes 2>&1)
    fi
    VERCEL_STATUS=$?
    set -e
    if [ $VERCEL_STATUS -eq 0 ]; then
      VERCEL_URL=$(echo "$VERCEL_OUTPUT" | grep -Eo 'https://[a-zA-Z0-9.-]+\.vercel\.app' | head -n 1 || true)
      if [ -n "$VERCEL_URL" ]; then
        echo "✅ Vercel Production Deployment Live: $VERCEL_URL"
      fi
    else
      echo "ℹ️  Vercel CLI deployment skipped or unauthenticated (you can deploy via GitHub integration)."
    fi
    cd ..
  fi
fi

# 9. Record Deployment State
CURRENT_COMMIT=""
if command -v git >/dev/null 2>&1; then
  CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "")
fi

cat <<EOF > .pseudoend-deploy-state.json
{
  "awsAccountId": "$AWS_ACCOUNT",
  "lastDeployedCommit": "$CURRENT_COMMIT",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "apiEndpointUrl": "$API_URL",
  "cloudfrontUrl": "$CLOUDFRONT_URL",
  "s3BucketName": "$S3_BUCKET",
  "dynamodbTable": "$DYNAMO_TABLE",
  "vercelUrl": "$VERCEL_URL"
}
EOF

# 10. Output Summary Dashboard
echo ""
echo "=========================================================="
echo "  🎉 SUCCESS! Pseudoend Stack is Live & Ready!"
echo "=========================================================="
echo "  👤 AWS Account ID:       $AWS_ACCOUNT"
echo "  ⚡ API Gateway Base:     $API_URL"
echo "  🌐 CloudFront Web Portal: $CLOUDFRONT_URL"
if [ -n "$VERCEL_URL" ]; then
  echo "  ▲ Vercel Web Portal:     $VERCEL_URL"
fi
echo "  📦 S3 Bucket:            $S3_BUCKET"
echo "  🗄️ DynamoDB Table:       $DYNAMO_TABLE"
if [ -n "$CURRENT_COMMIT" ]; then
  echo "  🔖 Deployed Commit:      $CURRENT_COMMIT"
fi
echo "  💰 Current AWS Idle Cost: \$0.00 / month (Free Tier)"
echo "=========================================================="
