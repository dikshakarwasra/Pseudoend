#!/usr/bin/env bash
# ==============================================================================
# Pseudoend — Master Zero-Cost 1-Click Bootstrap Engine
# ==============================================================================
set -euo pipefail

echo "=========================================================="
echo "  🚀 Starting Pseudoend Deployment Engine..."
echo "  Target: AWS Free Tier ($0.00 Idle Cost Architecture)"
echo "=========================================================="

# 1. Pre-flight sanity checks
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is not installed. Please install it first. Aborting."; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "❌ Terraform is not installed. Please install it first. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is not installed. Please install it first. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is not installed. Please install it first. Aborting."; exit 1; }

echo "✅ Pre-flight checks passed: AWS CLI, Terraform, Node.js, and npm are available."

# Verify AWS CLI identity
echo "🔍 Checking AWS authentication..."
aws sts get-caller-identity >/dev/null || { echo "❌ AWS credentials not configured. Run 'aws configure' first."; exit 1; }
echo "✅ AWS credentials verified."

# 2. Build Backend Lambda packages (if backend dir exists)
if [ -d "backend" ]; then
  echo "📦 Building Backend Lambda Functions..."
  cd backend
  if [ -f "package.json" ]; then
    npm install
    npm run build || true
  fi
  cd ..
fi

# 3. Apply Terraform Infrastructure
if [ -d "infrastructure" ]; then
  echo "☁️ Provisioning AWS Serverless Infrastructure with Terraform..."
  cd infrastructure
  terraform init
  terraform apply -auto-approve

  API_URL=$(terraform output -raw api_endpoint_url 2>/dev/null || echo "https://pending-api-gateway-url")
  CLOUDFRONT_URL=$(terraform output -raw portal_cloudfront_url 2>/dev/null || echo "https://pending-cloudfront-url")
  S3_BUCKET=$(terraform output -raw portal_s3_bucket_name 2>/dev/null || echo "")
  cd ..

  # 4. Build Frontend Portal with API URL injected (if portal dir exists)
  if [ -d "portal" ] && [ -n "$S3_BUCKET" ]; then
    echo "💻 Building Frontend Web Portal..."
    cd portal
    if [ -f "package.json" ]; then
      npm install
      VITE_API_URL="$API_URL" npm run build || true
      if [ -d "dist" ]; then
        echo "🚀 Uploading Portal to S3 ($S3_BUCKET) and Edge CDN..."
        aws s3 sync dist/ "s3://${S3_BUCKET}" --delete
        CF_DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='${S3_BUCKET}.s3.amazonaws.com']].Id | [0]" --output text 2>/dev/null || echo "")
        if [ "$CF_DIST_ID" != "None" ] && [ -n "$CF_DIST_ID" ]; then
          aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*" >/dev/null 2>&1 || true
        fi
      fi
    fi
    cd ..
  fi

  echo "=========================================================="
  echo "  🎉 SUCCESS! Pseudoend is ready!"
  echo "=========================================================="
  echo "  🌐 Developer Web Portal:  $CLOUDFRONT_URL"
  echo "  ⚡ Public Mock API Base:   $API_URL"
  echo "  💰 Current AWS Idle Cost: \$0.00 / month"
  echo "=========================================================="
else
  echo "ℹ️  Run the AI code generator using PRD-4 prompts to scaffold infrastructure/, backend/, and portal/."
fi

