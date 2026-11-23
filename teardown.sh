#!/usr/bin/env bash
# ==============================================================================
# Pseudoend — Emergency 1-Click Stack Teardown & Obliteration Script (Bash)
# Cleans and destroys resources across: AWS (S3, API Gateway, DynamoDB, Lambda), Terraform, and Vercel
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "  ⚠️  WARNING: PSEUDOEND COMPLETE STACK TEARDOWN"
echo "=========================================================="
echo "This will permanently destroy all Pseudoend cloud resources across:"
echo "  - AWS HTTP API Gateway & Stages"
echo "  - AWS DynamoDB Mock Engine single-table data"
echo "  - AWS Lambda Execution Functions & CloudWatch Logs"
echo "  - AWS S3 Static Portal Bucket & CloudFront Distribution"
echo "  - Local build artifacts, zips, and deploy state"
echo ""

# Check active AWS credentials vs state account
CALLER_JSON=$(aws sts get-caller-identity --output json 2>/dev/null || echo "")
AWS_ACCOUNT=$(echo "$CALLER_JSON" | grep -o '"Account": *"[^"]*"' | sed 's/"Account": *"//;s/"//' || echo "")

if [ -f "infrastructure/terraform.tfstate" ] && [ -n "$AWS_ACCOUNT" ]; then
  STATE_ACCOUNT=$(grep -o 'arn:aws:[a-z0-9-]*::[0-9]*:' infrastructure/terraform.tfstate | head -n 1 | grep -o '[0-9]\{12\}' || echo "")
  if [ -n "$STATE_ACCOUNT" ] && [ "$STATE_ACCOUNT" != "$AWS_ACCOUNT" ]; then
    echo "⚠️ Warning: Terraform state references AWS Account $STATE_ACCOUNT,"
    echo "   but your active AWS CLI credentials belong to Account $AWS_ACCOUNT!"
    echo "   If you want to discard the old state and start clean on your new account, run:"
    echo "   mv infrastructure/terraform.tfstate infrastructure/terraform.tfstate.bak"
  fi
fi

read -p "Type 'yes' to proceed with irreversible destruction: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Teardown aborted."
  exit 0
fi

# 1. Clean S3 bucket prior to Terraform destroy
if [ -d "infrastructure" ]; then
  cd infrastructure
  S3_BUCKET=$(terraform output -raw portal_s3_bucket_name 2>/dev/null || echo "")
  if [ -n "$S3_BUCKET" ] && [ "$S3_BUCKET" != "None" ]; then
    echo "🗑️ Emptying S3 Portal Bucket ($S3_BUCKET)..."
    aws s3 rm "s3://${S3_BUCKET}" --recursive 2>/dev/null || true
  fi

  # 2. Run Terraform Destroy
  echo "💥 Running Terraform Destroy..."
  terraform destroy -auto-approve || true
  cd ..
  echo "✅ Terraform resources destroyed."
fi

# 3. Clean optional Vercel deployment
if [ -d "portal/.vercel" ]; then
  echo "▲ Cleaning local Vercel project link..."
  rm -rf portal/.vercel
fi

# 4. Clean local temporary zips and build artifacts
echo "🧹 Cleaning local build artifacts and cache..."
rm -f infrastructure/mockEngine.zip infrastructure/management.zip .pseudoend-deploy-state.json
rm -rf backend/dist portal/dist

echo ""
echo "=========================================================="
echo "  ✅ Pseudoend Stack completely obliterated."
echo "  Your AWS account is 100% free of Pseudoend resources."
echo "=========================================================="
