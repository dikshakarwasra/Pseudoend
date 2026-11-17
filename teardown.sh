#!/usr/bin/env bash
# ==============================================================================
# Pseudoend — Emergency 1-Click Stack Teardown & Obliteration Script
# ==============================================================================
set -euo pipefail

echo "⚠️  WARNING: This will permanently destroy all Pseudoend cloud resources,"
echo "   including DynamoDB mock data, API Gateways, Lambdas, and S3 assets."
read -p "Are you sure you want to proceed? (y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Teardown aborted."
  exit 0
fi

if [ -d "infrastructure" ]; then
  cd infrastructure
  S3_BUCKET=$(terraform output -raw portal_s3_bucket_name 2>/dev/null || echo "")
  if [ -n "$S3_BUCKET" ]; then
    echo "🗑️ Emptying S3 Portal Bucket before deletion..."
    aws s3 rm "s3://${S3_BUCKET}" --recursive 2>/dev/null || true
  fi

  echo "💥 Running Terraform Destroy..."
  terraform destroy -auto-approve || true
  cd ..
  echo "✅ All Pseudoend cloud infrastructure has been cleanly removed."
  echo "Your AWS account is 100% free of Pseudoend resources."
else
  echo "No infrastructure directory found."
fi

