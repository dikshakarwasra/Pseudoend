# ==============================================================================
# Pseudoend - Smart Continuous Update and Sync Engine (PowerShell)
# Checks the latest Git commit: If new changes exist, implements them; else does nothing.
# ==============================================================================
[CmdletBinding()]
param(
    [switch]$Force,
    [string]$Branch = ""
)

$ErrorActionPreference = "Continue"
if (Test-Path variable:global:PSNativeCommandUseErrorActionPreference) {
    $global:PSNativeCommandUseErrorActionPreference = $false
}
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  [*] Pseudoend Continuous Update Engine" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify Git and AWS CLI availability
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Git is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

$callerId = $null
try {
    $callerJson = aws sts get-caller-identity --output json 2>$null
    if ($callerJson) {
        $callerId = $callerJson | ConvertFrom-Json
        Write-Host "[INFO] Active AWS Account: $($callerId.Account)" -ForegroundColor DarkGray
    }
} catch {}

# 2. Check current branch and fetch latest from remote
if (-not $Branch) {
    $Branch = (git rev-parse --abbrev-ref HEAD 2>$null)
    if (-not $Branch -or $Branch -eq "HEAD") { $Branch = "main" }
}

Write-Host "[*] Fetching latest commits from origin/$Branch..." -ForegroundColor Cyan
try {
    & git fetch origin $Branch --quiet 2>$null
} catch {}

$localHash = (git rev-parse HEAD 2>$null)
$remoteHash = (git rev-parse "origin/$Branch" 2>$null)

# 3. Pull if remote has newer commits
if ($remoteHash -and ($localHash -ne $remoteHash)) {
    $behindCount = (git rev-list --count "HEAD..origin/$Branch" 2>$null)
    $numBehind = 0
    if ($behindCount) {
        [int]::TryParse($behindCount.ToString().Trim(), [ref]$numBehind) | Out-Null
    }
    if ($numBehind -gt 0) {
        Write-Host "[*] Remote has $numBehind new commit(s). Pulling updates..." -ForegroundColor Yellow
        git pull origin $Branch
        $localHash = (git rev-parse HEAD 2>$null)
    }
}

# 4. Check against last deployed state
$stateFile = ".pseudoend-deploy-state.json"
$lastDeployedCommit = ""

if (Test-Path $stateFile) {
    try {
        $stateJson = Get-Content $stateFile -Raw | ConvertFrom-Json
        $lastDeployedCommit = $stateJson.lastDeployedCommit
    } catch {}
}

$commitMsg = (git log -1 --pretty=format:"%s" 2>$null)
$shortLocal = $localHash.Substring(0, [System.Math]::Min(7, $localHash.Length))

if (-not $Force -and $lastDeployedCommit -and ($lastDeployedCommit -eq $localHash)) {
    Write-Host ""
    Write-Host "[OK] Everything is up to date!" -ForegroundColor Green
    Write-Host "   Latest Commit: $shortLocal - `"$commitMsg`"" -ForegroundColor White
    Write-Host "   Deployed at:   $($stateJson.timestamp)" -ForegroundColor DarkGray
    Write-Host "   Status:        No new changes to implement. Exiting." -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

# 5. Changes detected! Analyze what was modified
Write-Host ""
Write-Host "[*] New commit detected: $shortLocal - `"$commitMsg`"" -ForegroundColor Yellow
if ($lastDeployedCommit) {
    $shortPrev = $lastDeployedCommit.Substring(0, [System.Math]::Min(7, $lastDeployedCommit.Length))
    Write-Host "   Comparing against previously deployed: $shortPrev" -ForegroundColor DarkGray
    $changedFiles = (git diff --name-only $lastDeployedCommit $localHash 2>$null)
} else {
    Write-Host "   First tracked update run (no previous deployment state found)." -ForegroundColor DarkGray
    $changedFiles = (git diff --name-only "HEAD~1" "HEAD" 2>$null)
}

$backendChanged = $false
$infraChanged = $false
$portalChanged = $false

if ($changedFiles) {
    Write-Host ""
    Write-Host "[*] Changed files in this update:" -ForegroundColor DarkGray
    $changedFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor DarkGray }

    if ($changedFiles -match '^backend/') { $backendChanged = $true }
    if ($changedFiles -match '^infrastructure/') { $infraChanged = $true }
    if ($changedFiles -match '^portal/') { $portalChanged = $true }
} else {
    # If forced or clean run, re-run everything
    $backendChanged = $true
    $infraChanged = $true
    $portalChanged = $true
}

# 6. Execute targeted updates
if ($backendChanged) {
    Write-Host ""
    Write-Host "[*] Updating Backend (Lambda bundles)..." -ForegroundColor Cyan
    Push-Location "backend"
    if (Test-Path "package.json") {
        npm install --silent
        npm run build
    }
    Pop-Location
}

if ($infraChanged -or $backendChanged) {
    Write-Host ""
    Write-Host "[*] Applying Infrastructure updates (Terraform)..." -ForegroundColor Cyan
    Push-Location "infrastructure"
    terraform init -input=false
    terraform apply -auto-approve -input=false
    $apiUrl = (terraform output -raw api_endpoint_url 2>$null)
    $cfUrl = (terraform output -raw portal_cloudfront_url 2>$null)
    $s3Bucket = (terraform output -raw portal_s3_bucket_name 2>$null)
    Pop-Location
} else {
    $apiUrl = (terraform -chdir="infrastructure" output -raw api_endpoint_url 2>$null)
    $cfUrl = (terraform -chdir="infrastructure" output -raw portal_cloudfront_url 2>$null)
    $s3Bucket = (terraform -chdir="infrastructure" output -raw portal_s3_bucket_name 2>$null)
}

if ($portalChanged -or $backendChanged) {
    Write-Host ""
    Write-Host "[*] Updating Frontend Web Portal..." -ForegroundColor Cyan
    if ($apiUrl) {
        "VITE_API_URL=$apiUrl" | Set-Content -Path "portal\.env.production" -Encoding UTF8
    }
    Push-Location "portal"
    if (Test-Path "package.json") {
        npm install --silent
        if ($apiUrl) { $env:VITE_API_URL = $apiUrl }
        npm run build
    }
    Pop-Location

    # Upload to CloudFront / S3
    if ($s3Bucket -and (Test-Path "portal\dist")) {
        Write-Host "[*] Syncing new portal build to S3 ($s3Bucket)..." -ForegroundColor Cyan
        aws s3 sync "portal\dist" "s3://$s3Bucket" --delete
        $cfDistId = (aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='${s3Bucket}.s3.amazonaws.com']].Id | [0]" --output text 2>$null)
        if ($cfDistId -and $cfDistId -ne "None") {
            aws cloudfront create-invalidation --distribution-id $cfDistId --paths "/*" | Out-Null
        }
    }

    # Optional Vercel update
    try {
        Push-Location "portal"
        if ($env:VERCEL_TOKEN) {
            npx --yes vercel deploy --prod --yes --token $env:VERCEL_TOKEN 2>&1 | Out-Null
            Write-Host "[OK] Vercel production deployment updated." -ForegroundColor Green
        }
        Pop-Location
    } catch {}
}

# 7. Update deployment state file
$newState = @{
    lastDeployedCommit = $localHash
    timestamp          = (Get-Date).ToString("o")
    commitMessage      = $commitMsg
    apiEndpointUrl     = $apiUrl
    cloudfrontUrl      = $cfUrl
    s3BucketName       = $s3Bucket
}
$newState | ConvertTo-Json -Depth 3 | Set-Content -Path $stateFile -Encoding UTF8

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  [SUCCESS] Update implemented for commit: $shortLocal" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
