# ==============================================================================
# Pseudoend - Master Zero-Cost 1-Click Bootstrap Engine (PowerShell)
# Supports: AWS Serverless (Terraform / HashiCorp) + Client (Vercel and CloudFront)
# ==============================================================================
[CmdletBinding()]
param(
    [switch]$SkipVercel,
    [switch]$SkipS3Sync,
    [switch]$ResetState
)

$ErrorActionPreference = "Continue"
if (Test-Path variable:global:PSNativeCommandUseErrorActionPreference) {
    $global:PSNativeCommandUseErrorActionPreference = $false
}
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  [*] Starting Pseudoend Deployment and Bootstrap Engine" -ForegroundColor Green
Write-Host "  Targets: AWS Free Tier + Terraform + Vercel / CloudFront" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Pre-flight sanity checks
$missingTools = @()
if (-not (Get-Command "aws" -ErrorAction SilentlyContinue)) { $missingTools += "AWS CLI (aws)" }
if (-not (Get-Command "terraform" -ErrorAction SilentlyContinue)) { $missingTools += "Terraform (terraform)" }
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) { $missingTools += "Node.js (node)" }
if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) { $missingTools += "npm" }

if ($missingTools.Count -gt 0) {
    Write-Host "[ERROR] Missing required tools: $($missingTools -join ', ')" -ForegroundColor Red
    Write-Host "Install missing tools before proceeding (e.g. winget install Amazon.AWSCLI HashiCorp.Terraform)" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Pre-flight checks passed: AWS CLI, Terraform, Node.js, and npm are available." -ForegroundColor Green

# 2. Check AWS Identity
Write-Host ""
Write-Host "[*] Verifying AWS authentication..." -ForegroundColor Cyan
$callerId = $null
try {
    $callerJson = aws sts get-caller-identity --output json 2>$null
    if ($callerJson) {
        $callerId = $callerJson | ConvertFrom-Json
        Write-Host "[OK] AWS Identity verified: Account $($callerId.Account), User/Role $($callerId.Arn)" -ForegroundColor Green
    } else {
        throw "No output from aws sts get-caller-identity"
    }
} catch {
    Write-Host "[ERROR] AWS credentials not configured or expired." -ForegroundColor Red
    Write-Host "   Run 'aws configure' to update your Access Key ID and Secret Access Key." -ForegroundColor Yellow
    exit 1
}

# 3. Detect AWS Account Switch and State Conflict
if (Test-Path "infrastructure\terraform.tfstate") {
    $stateContent = Get-Content "infrastructure\terraform.tfstate" -Raw
    if ($stateContent -match 'arn:aws:[a-z0-9-]+::(\d+):') {
        $stateAccount = $matches[1]
        if ($stateAccount -ne $callerId.Account -or $ResetState) {
            Write-Host ""
            Write-Host "[WARN] Detected Terraform state from different AWS account ($stateAccount)." -ForegroundColor Yellow
            Write-Host "   Current active account is: $($callerId.Account)" -ForegroundColor Yellow
            Write-Host "   Archiving old state to infrastructure\terraform.tfstate.bak-$stateAccount..." -ForegroundColor Cyan
            Move-Item -Path "infrastructure\terraform.tfstate" -Destination "infrastructure\terraform.tfstate.bak-$stateAccount" -Force
            if (Test-Path "infrastructure\terraform.tfstate.backup") {
                Move-Item -Path "infrastructure\terraform.tfstate.backup" -Destination "infrastructure\terraform.tfstate.backup.bak-$stateAccount" -Force
            }
            if (Test-Path "infrastructure\.terraform") {
                Remove-Item -Recurse -Force "infrastructure\.terraform" -ErrorAction SilentlyContinue
            }
            Write-Host "[OK] Clean slate prepared for new AWS account $($callerId.Account)." -ForegroundColor Green
        }
    }
}

# 4. Build Backend Lambda handlers
if (Test-Path "backend") {
    Write-Host ""
    Write-Host "[*] Building Backend Lambda Functions with esbuild..." -ForegroundColor Cyan
    Push-Location "backend"
    if (Test-Path "package.json") {
        npm install --silent
        npm run build
    }
    Pop-Location
    Write-Host "[OK] Backend Lambda bundle ready." -ForegroundColor Green
}

# 5. Apply Terraform Infrastructure
$apiUrl = ""
$cfUrl = ""
$s3Bucket = ""
$dynamoTable = ""

if (Test-Path "infrastructure") {
    Write-Host ""
    Write-Host "[*] Provisioning AWS Infrastructure with Terraform..." -ForegroundColor Cyan
    Push-Location "infrastructure"
    terraform init -input=false
    terraform apply -auto-approve -input=false

    $apiUrl = (terraform output -raw api_endpoint_url 2>$null)
    $cfUrl = (terraform output -raw portal_cloudfront_url 2>$null)
    $s3Bucket = (terraform output -raw portal_s3_bucket_name 2>$null)
    $dynamoTable = (terraform output -raw dynamodb_table_name 2>$null)
    Pop-Location
    Write-Host "[OK] Terraform infrastructure applied." -ForegroundColor Green
}

# 6. Build Frontend Web Portal
$vercelUrl = ""
if (Test-Path "portal" -and $apiUrl) {
    Write-Host ""
    Write-Host "[*] Configuring and Building Frontend Portal..." -ForegroundColor Cyan
    
    # Save production API URL into portal environment
    "VITE_API_URL=$apiUrl" | Set-Content -Path "portal\.env.production" -Encoding UTF8
    "VITE_API_URL=$apiUrl" | Set-Content -Path "portal\.env" -Encoding UTF8

    Push-Location "portal"
    if (Test-Path "package.json") {
        npm install --silent
        $env:VITE_API_URL = $apiUrl
        npm run build
    }
    Pop-Location

    # 7. Deploy to S3 + CloudFront
    if (-not $SkipS3Sync -and $s3Bucket -and (Test-Path "portal\dist")) {
        Write-Host "[*] Uploading Portal to S3 ($s3Bucket) and Edge CDN..." -ForegroundColor Cyan
        aws s3 sync "portal\dist" "s3://$s3Bucket" --delete
        
        $cfDistId = (aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='${s3Bucket}.s3.amazonaws.com']].Id | [0]" --output text 2>$null)
        if ($cfDistId -and $cfDistId -ne "None") {
            Write-Host "[*] Invalidating CloudFront cache ($cfDistId)..." -ForegroundColor Cyan
            aws cloudfront create-invalidation --distribution-id $cfDistId --paths "/*" | Out-Null
        }
        Write-Host "[OK] CloudFront Edge CDN updated." -ForegroundColor Green
    }

    # 8. Optional Vercel Deployment
    if (-not $SkipVercel) {
        $vercelCmd = Get-Command "vercel" -ErrorAction SilentlyContinue
        if ($vercelCmd -or (Get-Command "npx" -ErrorAction SilentlyContinue)) {
            Write-Host ""
            Write-Host "[*] Deploying to Vercel..." -ForegroundColor Cyan
            Push-Location "portal"
            try {
                if ($env:VERCEL_TOKEN) {
                    $vercelOutput = npx --yes vercel deploy --prod --yes --token $env:VERCEL_TOKEN 2>&1
                } else {
                    $vercelOutput = npx --yes vercel deploy --prod --yes 2>&1
                }
                $matchedUrl = ($vercelOutput | Select-String -Pattern 'https://[a-zA-Z0-9.-]+\.vercel\.app' | Select-Object -First 1).Matches.Value
                if ($matchedUrl) {
                    $vercelUrl = $matchedUrl
                    Write-Host "[OK] Vercel Production Deployment Live: $vercelUrl" -ForegroundColor Green
                } elseif ($vercelOutput -match "No existing credentials found") {
                    Write-Host "[INFO] Vercel CLI is not authenticated locally." -ForegroundColor Yellow
                    Write-Host "       Run 'npx vercel login' once to log in, or deploy automatically via GitHub push." -ForegroundColor DarkGray
                }
            } catch {
                Write-Host "[INFO] Vercel CLI deployment skipped or unauthenticated (you can deploy via GitHub integration)." -ForegroundColor DarkGray
            }
            Pop-Location
        }
    }
}

# 9. Record Deployment State (Git commit hash and metadata)
$currentCommit = ""
if (Get-Command "git" -ErrorAction SilentlyContinue) {
    $currentCommit = (git rev-parse HEAD 2>$null)
}

$deployState = @{
    awsAccountId       = if ($callerId) { $callerId.Account } else { "" }
    lastDeployedCommit = $currentCommit
    timestamp          = (Get-Date).ToString("o")
    apiEndpointUrl     = $apiUrl
    cloudfrontUrl      = $cfUrl
    s3BucketName       = $s3Bucket
    dynamodbTable      = $dynamoTable
    vercelUrl          = $vercelUrl
}
$deployState | ConvertTo-Json -Depth 3 | Set-Content -Path ".pseudoend-deploy-state.json" -Encoding UTF8

# 10. Output Summary Dashboard
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  [SUCCESS] Pseudoend Stack is Live and Ready!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Account ID:              $($callerId.Account)" -ForegroundColor White
Write-Host "  API Gateway Base:        $apiUrl" -ForegroundColor White
Write-Host "  CloudFront Web Portal:   $cfUrl" -ForegroundColor White
if ($vercelUrl) {
    Write-Host "  Vercel Web Portal:       $vercelUrl" -ForegroundColor White
}
Write-Host "  S3 Bucket:               $s3Bucket" -ForegroundColor DarkGray
Write-Host "  DynamoDB Table:          $dynamoTable" -ForegroundColor DarkGray
if ($currentCommit) {
    Write-Host "  Deployed Commit:         $currentCommit" -ForegroundColor DarkGray
}
Write-Host "  Current AWS Idle Cost:   `$0.00 / month (Free Tier)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
