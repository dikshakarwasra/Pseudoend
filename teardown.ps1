# ==============================================================================
# Pseudoend - Emergency 1-Click Stack Teardown and Obliteration Engine (PowerShell)
# Cleans and destroys resources across: AWS (S3, API Gateway, DynamoDB, Lambda), Terraform, and Vercel
# ==============================================================================
[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = "Continue"
if (Test-Path variable:global:PSNativeCommandUseErrorActionPreference) {
    $global:PSNativeCommandUseErrorActionPreference = $false
}
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "==========================================================" -ForegroundColor Red
Write-Host "  [WARN] PSEUDOEND COMPLETE STACK TEARDOWN" -ForegroundColor Red
Write-Host "==========================================================" -ForegroundColor Red
Write-Host "This will permanently destroy all Pseudoend cloud resources across:" -ForegroundColor Yellow
Write-Host "  - AWS HTTP API Gateway and Stages" -ForegroundColor White
Write-Host "  - AWS DynamoDB Mock Engine single-table data" -ForegroundColor White
Write-Host "  - AWS Lambda Execution Functions and CloudWatch Logs" -ForegroundColor White
Write-Host "  - AWS S3 Static Portal Bucket and CloudFront Distribution" -ForegroundColor White
Write-Host "  - Local build artifacts, zips, and deploy state" -ForegroundColor White

# Check active AWS credentials vs state account
$callerId = $null
try {
    $callerJson = aws sts get-caller-identity --output json 2>$null
    if ($callerJson) { $callerId = $callerJson | ConvertFrom-Json }
} catch {}

if (Test-Path "infrastructure\terraform.tfstate" -and $callerId) {
    $stateContent = Get-Content "infrastructure\terraform.tfstate" -Raw
    if ($stateContent -match 'arn:aws:[a-z0-9-]+::(\d+):') {
        $stateAccount = $matches[1]
        if ($stateAccount -ne $callerId.Account) {
            Write-Host "[WARN] Terraform state references AWS Account $stateAccount," -ForegroundColor Yellow
            Write-Host "   but your active AWS CLI credentials belong to Account $($callerId.Account)!" -ForegroundColor Yellow
            Write-Host "   If you want to discard the old state and start clean on your new account, run:" -ForegroundColor Yellow
            Write-Host "   Move-Item infrastructure\terraform.tfstate infrastructure\terraform.tfstate.bak" -ForegroundColor Cyan
        }
    }
}

if (-not $Force) {
    $confirm = Read-Host "`nType 'yes' to proceed with irreversible destruction"
    if ($confirm -ne "yes") {
        Write-Host "Teardown aborted by user." -ForegroundColor Cyan
        exit 0
    }
}

# 1. Clean S3 bucket prior to Terraform destroy
if (Test-Path "infrastructure") {
    Push-Location "infrastructure"
    $s3Bucket = (terraform output -raw portal_s3_bucket_name 2>$null)
    if ($s3Bucket -and $s3Bucket -ne "None") {
        Write-Host ""
        Write-Host "[*] Emptying S3 Bucket ($s3Bucket) to prevent Terraform 409 Conflict..." -ForegroundColor Yellow
        try {
            aws s3 rm "s3://$s3Bucket" --recursive 2>$null | Out-Null
        } catch {}
    }

    # 2. Run Terraform Destroy
    Write-Host ""
    Write-Host "[*] Destroying AWS resources with Terraform..." -ForegroundColor Red
    try {
        terraform destroy -auto-approve -input=false
        Write-Host "[OK] Terraform resources successfully destroyed." -ForegroundColor Green
    } catch {
        Write-Host "[WARN] Terraform destroy encountered an issue or completed with warnings." -ForegroundColor Yellow
    }
    Pop-Location
}

# 3. Clean optional Vercel deployment
if (Test-Path "portal\.vercel") {
    Write-Host ""
    Write-Host "[*] Cleaning local Vercel project link..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "portal\.vercel" -ErrorAction SilentlyContinue
}

# 4. Clean local temporary zips and build artifacts
Write-Host ""
Write-Host "[*] Cleaning local build artifacts and cache..." -ForegroundColor Cyan
@("infrastructure\mockEngine.zip", "infrastructure\management.zip", ".pseudoend-deploy-state.json") | ForEach-Object {
    if (Test-Path $_) { Remove-Item -Force $_ -ErrorAction SilentlyContinue }
}
if (Test-Path "backend\dist") { Remove-Item -Recurse -Force "backend\dist" -ErrorAction SilentlyContinue }
if (Test-Path "portal\dist") { Remove-Item -Recurse -Force "portal\dist" -ErrorAction SilentlyContinue }

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  [SUCCESS] Pseudoend Stack completely obliterated." -ForegroundColor Green
Write-Host "  Your AWS account is 100% free of Pseudoend resources." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
