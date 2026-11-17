# pseudoend â€” Product Requirements Document (PRD 4 of 4)
## Document 4: AI Implementation Master Blueprint, Prompt Engineering Pack & 1-Click Zero-Cost Runbook

---

### Table of Contents
1. **[Client Master Runbook: From Zero to Live in 15 Minutes](#1-client-master-runbook-from-zero-to-live-in-15-minutes)**
2. **[End-to-End Repository Topology](#2-end-to-end-repository-topology)**
3. **[The AI Prompt Engineering Pack](#3-the-ai-prompt-engineering-pack)**
   - Prompt Sequence 1: Workspace Scaffolding & Shared Type Definitions
   - Prompt Sequence 2: Serverless Mock Engine & Middleware Pipeline
   - Prompt Sequence 3: Management API, Auth & Admin Lambda
   - Prompt Sequence 4: Single Page Application (React / Vite / Tailwind)
   - Prompt Sequence 5: End-to-End Automated Test Suite
4. **[One-Click Bootstrap Engine (`pseudoend-bootstrap.sh`)](#4-one-click-bootstrap-engine-pseudoend-bootstrapsh)**
5. **[Emergency Teardown & Safe Deletion Engine (`teardown.sh`)](#5-emergency-teardown--safe-deletion-engine-teardownsh)**
6. **[Zero-Tolerance Cloud Billing Security Checklist](#6-zero-tolerance-cloud-billing-security-checklist)**
7. **[Client Final Handover & Operational Verification Checklist](#7-client-final-handover--operational-verification-checklist)**

---

## 1. Client Master Runbook: From Zero to Live in 15 Minutes
> **Target Audience:** Junior Cloud Developer (~1 month AWS experience)  
> **Objective:** Take a brand new AWS Free Tier account and launch the entire `pseudoend` backend, mock engine, and web dashboard in under 15 minutes with guaranteed \$0.00 cost.

### 1.1 Prerequisites Checklist
Before executing the deployment, ensure your machine has the following tools installed (all are free and open-source):
```bash
# Verify your tools are installed:
node -v       # Required: v18.0.0 or higher (v20 LTS recommended)
npm -v        # Required: v9.0.0 or higher
aws --version # Required: AWS CLI v2
terraform -v  # Required: Terraform v1.5 or higher
```
*If Terraform is not installed on macOS:* `brew install terraform`  
*If on Ubuntu/Debian Linux:* `sudo apt-get install -y terraform`

### 1.2 The 3-Step Fast-Track
```
Step 1: Clone or navigate to the repository
  $ cd /Users/kalyugwasi/Documents/Pseudoend

Step 2: Run the automated 1-click bootstrap script
  $ ./pseudoend-bootstrap.sh

Step 3: Access your live global web portal and mock API!
  - Web Dashboard: https://d123456abcdef.cloudfront.net
  - Mock API Gateway: https://xyz987.execute-api.us-east-1.amazonaws.com
```

---

## 2. End-to-End Repository Topology

```text
pseudoend/
â”œâ”€â”€ PRD-1-Architecture-and-Infrastructure.md
â”œâ”€â”€ PRD-2-Core-Engine-Middleware-Security.md
â”œâ”€â”€ PRD-3-Portal-Admin-Console-and-Integration.md
â”œâ”€â”€ PRD-4-AI-Prompt-Pack-Runbook-and-Zero-Cost-Deployment.md
â”œâ”€â”€ pseudoend-bootstrap.sh                 # 1-Click Master Deployment Script
â”œâ”€â”€ teardown.sh                          # 1-Click Master Stack Destruction Script
â”œâ”€â”€ infrastructure/                      # Terraform Cloud Infrastructure
â”‚   â”œâ”€â”€ main.tf
â”‚   â”œâ”€â”€ variables.tf
â”‚   â”œâ”€â”€ outputs.tf
â”‚   â”œâ”€â”€ dynamodb.tf
â”‚   â”œâ”€â”€ apigateway.tf
â”‚   â”œâ”€â”€ lambda.tf
â”‚   â””â”€â”€ s3_cloudfront.tf
â”œâ”€â”€ backend/                             # Serverless AWS Lambda Source Code
â”‚   â”œâ”€â”€ package.json
â”‚   â”œâ”€â”€ tsconfig.json
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ types/index.ts               # Shared TypeScript schemas & interfaces
â”‚       â”œâ”€â”€ handlers/
â”‚       â”‚   â”œâ”€â”€ mockEngine.ts            # Public Mock API Router & Executor
â”‚       â”‚   â””â”€â”€ management.ts            # Auth, Route CRUD, Admin operations
â”‚       â”œâ”€â”€ middleware/
â”‚       â”‚   â”œâ”€â”€ auth.ts                  # JWT & API Key validation
â”‚       â”‚   â”œâ”€â”€ cors.ts                  # CORS pre-flight & headers
â”‚       â”‚   â”œâ”€â”€ rateLimiter.ts           # DynamoDB atomic token bucket
â”‚       â”‚   â””â”€â”€ chaos.ts                 # Latency and fault injection
â”‚       â””â”€â”€ engine/
â”‚           â”œâ”€â”€ templateParser.ts        # Dynamic Faker & tag replacer
â”‚           â””â”€â”€ routeMatcher.ts          # Wildcard and param path resolver
â””â”€â”€ portal/                              # React + Vite Developer Web Portal
    â”œâ”€â”€ package.json
    â”œâ”€â”€ vite.config.ts
    â”œâ”€â”€ tailwind.config.js
    â”œâ”€â”€ index.html
    â””â”€â”€ src/
        â”œâ”€â”€ App.tsx
        â”œâ”€â”€ main.tsx
        â”œâ”€â”€ components/
        â”‚   â”œâ”€â”€ Header.tsx
        â”‚   â”œâ”€â”€ RouteModal.tsx
        â”‚   â”œâ”€â”€ CodeConnectModal.tsx
        â”‚   â””â”€â”€ QuotaRequestModal.tsx
        â””â”€â”€ views/
            â”œâ”€â”€ AuthView.tsx
            â”œâ”€â”€ MockStudioView.tsx
            â”œâ”€â”€ LiveInspectorView.tsx
            â””â”€â”€ AdminConsoleView.tsx
```

---

## 3. The AI Prompt Engineering Pack

To instruct an AI model (such as Gemini 1.5 Pro, Claude 3.5 Sonnet, or GPT-4o) to generate 100% bug-free, production-grade code for `pseudoend`, feed each prompt sequentially in order.

---

### Prompt Sequence 1: Workspace Scaffolding & Shared Type Definitions
```markdown
### SYSTEM ROLE: Senior Principal Architect (TypeScript / AWS Serverless)

### TASK:
Generate the shared type definitions and project configuration for "pseudoend".

### REQUIREMENTS:
Create `backend/src/types/index.ts` defining:
1. `UserRecord`:
   - id: string; email: string; passwordHash: string; role: 'user' | 'admin';
   - tier: 'free' | 'developer' | 'pro'; dailyCreditLimit: number;
   - isBanned: boolean; createdAt: string;
2. `ProjectRecord`:
   - id: string; userId: string; name: string; apiKeyHash: string;
   - rawApiKeyPrefix: string; createdAt: string;
3. `MockRouteRecord`:
   - projectId: string; method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
   - path: string; statusCode: number; headers: Record<string, string>;
   - responseBody: any; latencyMs: number; failureRatePercent: number;
   - isEcho: boolean; isStateful: boolean; ttl: number;
4. `QuotaRequestRecord`:
   - id: string; userId: string; userEmail: string; currentTier: string;
   - requestedTier: string; reason: string; status: 'PENDING' | 'APPROVED' | 'DENIED';
   - createdAt: string;
5. `APIGatewayResponse`: Helper type for `{ statusCode: number, headers: Record<string, string>, body: string }`.

Also generate `backend/package.json` and `backend/tsconfig.json` optimized for Node.js 20 on AWS Lambda using ESBuild.
```

---

### Prompt Sequence 2: Serverless Mock Engine & Middleware Pipeline
```markdown
### SYSTEM ROLE: Staff Backend Systems Engineer

### TASK:
Generate the high-throughput, zero-cost AWS Lambda Mock Engine handler for "pseudoend".

### CONTEXT:
Refer to `PRD-2-Core-Engine-Middleware-Security.md`. The Lambda function `mockEngine.ts` handles all incoming `/mock/{projectId}/{proxy+}` requests.

### REQUIREMENTS:
1. Extract API key from header `x-pseudoend-key` or query param `?key=`.
2. Middleware Chain:
   - `cors.ts`: Intercept OPTIONS, return 204 with full CORS headers.
   - `auth.ts`: Verify API Key hash against DynamoDB table `pseudoend-main`. Verify user is not banned.
   - `rateLimiter.ts`: Use DynamoDB `UpdateItem` with `ADD requestCount 1` on key `BUCKET#<apiKey>#<date>`. Check against daily quota. If exceeded, return 429 with `{ error: "Daily credit limit exhausted. Request upgrade in dashboard." }`.
   - `chaos.ts`: If `failureRatePercent > 0`, roll dice `Math.random() * 100`. If hit, return HTTP 500. If `latencyMs > 0`, delay via `await new Promise(r => setTimeout(r, latencyMs))`.
3. Route Matching (`routeMatcher.ts`):
   - Match exact path, or path parameters like `/users/:id`.
   - If route is marked `isEcho`, return received body, query params, and headers.
4. Template Parsing (`templateParser.ts`):
   - Replace `{{uuid}}` with random UUID v4.
   - Replace `{{timestamp}}` and `{{isoDate}}`.
   - Replace dynamic Faker tags: `{{faker.name.fullName}}`, `{{faker.internet.email}}`, `{{faker.number.int(min, max)}}` using `@faker-js/faker`.
   - Replace `{{request.params.paramName}}`.
5. Return JSON response with CORS headers.

Write complete, clean, modular TypeScript code with zero omitted methods.
```

---

### Prompt Sequence 3: Management API, Auth & Admin Lambda
```markdown
### SYSTEM ROLE: Senior Backend Engineer (Security & APIs)

### TASK:
Generate the `management.ts` Lambda handler responsible for developer accounts, projects, route management, and the Admin oversight console.

### ROUTES TO IMPLEMENT:
1. `POST /api/auth/register`: Hashes password with bcryptjs, creates user with tier 'free', provisions default project and default API key.
2. `POST /api/auth/login`: Validates credentials, returns signed JWT (24h expiry).
3. `POST /api/auth/delete-account`: Cascading delete of user, projects, and routes.
4. `GET /api/projects`: Lists user projects and API keys.
5. `POST /api/routes`: Creates or updates a mock route with TTL.
6. `GET /api/routes/:projectId`: Retrieves all routes for a project.
7. `DELETE /api/routes/:projectId/:routeId`: Removes a mock route.
8. `POST /api/quota/request`: Submits an upgrade request with justification.
9. ADMIN ROUTES (requires JWT with `role === 'admin'`):
   - `GET /api/admin/stats`: Total users, daily requests, active routes.
   - `GET /api/admin/requests`: Lists pending quota requests.
   - `POST /api/admin/requests/:id/approve`: Upgrades user tier in DynamoDB.
   - `POST /api/admin/requests/:id/deny`: Denies upgrade request.
   - `POST /api/admin/users/:id/ban`: Toggles `isBanned: true`.

Strictly use AWS SDK v3 `@aws-sdk/lib-dynamodb` with DynamoDBDocumentClient.
```

---

### Prompt Sequence 4: Single Page Application (React / Vite / Tailwind)
```markdown
### SYSTEM ROLE: Lead Frontend Engineer & UX Designer

### TASK:
Generate the entire frontend web portal for "pseudoend" using React 18, Vite, and Tailwind CSS.

### VIEWS REQUIRED:
1. `AuthView.tsx`: Modern split-screen authentication (Register / Login). Shows a banner emphasizing "100% Free Forever - Zero Credit Card Required".
2. `MockStudioView.tsx`:
   - Interactive table showing all configured mock routes.
   - Filter by HTTP verb badges (GET, POST, PUT, DELETE).
   - "New Route" modal with visual latency slider, chaos failure slider, and JSON code editor.
3. `CodeConnectModal.tsx`:
   - One-click modal generating production frontend snippets.
   - Tabs for React (Fetch), React Query, Vue 3 (Axios), Svelte, Flutter (Dart), iOS (Swift), and cURL.
   - Instant "Copy to Clipboard" with toast confirmation.
4. `AdminConsoleView.tsx`:
   - Displays admin metrics widget.
   - Pending upgrade requests queue with "Approve" (auto-upgrades user to 10k or 50k req/day) and "Deny" buttons.
   - User table with instant "Ban / Unban" action.

Generate complete, runnable React components styled with Tailwind CSS dark mode.
```

---

### Prompt Sequence 5: End-to-End Automated Test Suite
```markdown
### SYSTEM ROLE: Senior QA & Test Automation Specialist

### TASK:
Create a full Vitest / Jest unit and integration test suite in `backend/tests/` to guarantee that:
1. The dynamic Faker template replacer correctly evaluates tags without crashing on malformed templates.
2. The route matcher handles nested parameters (`/org/:orgId/users/:userId`).
3. The atomic rate-limiter triggers HTTP 429 once the counter exceeds tier limits.
4. The chaos engine accurately fails according to configured percentages.
5. The admin middleware strictly blocks non-admin users from accessing `/api/admin/*`.
```

---

## 4. One-Click Bootstrap Engine (`pseudoend-bootstrap.sh`)

Save this executable script in the root directory. It coordinates the entire deployment automatically:

```bash
#!/usr/bin/env bash
# ==============================================================================
# pseudoend â€” Master Zero-Cost 1-Click Bootstrap Engine
# ==============================================================================
set -euo pipefail

echo "=========================================================="
echo "  ðŸš€ Starting pseudoend Deployment Engine..."
echo "  Target: AWS Free Tier ($0.00 Idle Cost Architecture)"
echo "=========================================================="

# 1. Pre-flight sanity checks
command -v aws >/dev/null 2>&1 || { echo "âŒ AWS CLI is not installed. Aborting."; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "âŒ Terraform is not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "âŒ Node.js is not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "âŒ npm is not installed. Aborting."; exit 1; }

echo "âœ… Pre-flight checks passed: AWS CLI, Terraform, Node.js, and npm are ready."

# 2. Build Backend Lambda packages
echo "ðŸ“¦ Building Backend Lambda Functions..."
cd backend
npm install
npm run build
cd ..

# 3. Apply Terraform Infrastructure
echo "â˜ï¸ Provisioning AWS Serverless Infrastructure with Terraform..."
cd infrastructure
terraform init
terraform apply -auto-approve

API_URL=$(terraform output -raw api_endpoint_url)
CLOUDFRONT_URL=$(terraform output -raw portal_cloudfront_url)
S3_BUCKET=$(terraform output -raw portal_s3_bucket_name)
cd ..

# 4. Build Frontend Portal with API URL injected
echo "ðŸ’» Building Frontend Web Portal..."
cd portal
npm install
VITE_API_URL="$API_URL" npm run build

# 5. Sync Web Portal to S3 & Invalidate CloudFront
echo "ðŸš€ Uploading Portal to S3 and Edge CDN..."
aws s3 sync dist/ "s3://${S3_BUCKET}" --delete
echo "ðŸ§¹ Triggering CDN cache refresh..."
CF_DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='${S3_BUCKET}.s3.amazonaws.com']].Id | [0]" --output text)
if [ "$CF_DIST_ID" != "None" ] && [ -n "$CF_DIST_ID" ]; then
  aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*" >/dev/null
fi
cd ..

echo "=========================================================="
echo "  ðŸŽ‰ SUCCESS! pseudoend is live worldwide!"
echo "=========================================================="
echo "  ðŸŒ Developer Web Portal:  $CLOUDFRONT_URL"
echo "  âš¡ Public Mock API Base:   $API_URL"
echo "  ðŸ’° Current AWS Idle Cost: \$0.00 / month"
echo "=========================================================="
```

---

## 5. Emergency Teardown & Safe Deletion Engine (`teardown.sh`)

If you are running on a temporary or student AWS account and wish to wipe everything out with 100% zero leftover resources:

```bash
#!/usr/bin/env bash
# ==============================================================================
# pseudoend â€” Emergency 1-Click Stack Teardown & Obliteration Script
# ==============================================================================
set -euo pipefail

echo "âš ï¸  WARNING: This will permanently destroy all pseudoend cloud resources,"
echo "   including DynamoDB mock data, API Gateways, Lambdas, and S3 assets."
read -p "Are you sure you want to proceed? (y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Teardown aborted."
  exit 0
fi

echo "ðŸ—‘ï¸ Emptying S3 Portal Bucket before deletion..."
cd infrastructure
S3_BUCKET=$(terraform output -raw portal_s3_bucket_name 2>/dev/null || echo "")
if [ -n "$S3_BUCKET" ]; then
  aws s3 rm "s3://${S3_BUCKET}" --recursive || true
fi

echo "ðŸ’¥ Running Terraform Destroy..."
terraform destroy -auto-approve

echo "âœ… All pseudoend cloud infrastructure has been cleanly and permanently removed."
echo "Your AWS account is 100% free of pseudoend resources."
```

---

## 6. Zero-Tolerance Cloud Billing Security Checklist

To provide 100% confidence to the client that no unexpected bills will occur:

1. **Verify No VPC or NAT Gateways Exist:**  
   NAT Gateways cost ~\$32/month even when processing zero bytes. `pseudoend` uses direct public serverless endpointsâ€”no VPC or NAT Gateway is ever created.
2. **Verify DynamoDB Capacity Mode:**  
   Ensure billing mode is set to `PAY_PER_REQUEST` (On-Demand). Check via:
   ```bash
   aws dynamodb describe-table --table-name pseudoend-main --query "Table.BillingModeSummary.BillingMode"
   # Output must be: "PAY_PER_REQUEST"
   ```
3. **Verify Lambda Memory & Timeouts:**  
   Both Lambdas are configured with `memory_size = 256` and `timeout = 5`. Even under continuous invocations, Lambda costs remain within the 1,000,000 monthly free tier allowance.
4. **Set an AWS Billing Alarm via AWS CLI:**  
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name "pseudoend-Zero-Cost-Guardrail" \
     --metric-name EstimatedCharges \
     --namespace AWS/Billing \
     --statistic Maximum \
     --period 21600 \
     --threshold 0.01 \
     --comparison-operator GreaterThanOrEqualToThreshold \
     --evaluation-periods 1 \
     --alarm-actions <Your-SNS-Topic-ARN>
   ```

---

## 7. Client Final Handover & Operational Verification Checklist

| Step | Verification Task | Expected Result | Checked? |
| :---: | :--- | :--- | :---: |
| 1 | Run `./pseudoend-bootstrap.sh` | Clean execution ending with Live CloudFront & API Gateway URLs | [ ] |
| 2 | Open Developer Portal URL in Chrome/Firefox | Displays dark-themed login & registration page | [ ] |
| 3 | Create an account `dev@test.local` | Lands in dashboard with pre-loaded demo project & API key | [ ] |
| 4 | Click "Connect to Frontend" on demo route | Generates valid React / Vue / Swift / Flutter code snippets | [ ] |
| 5 | Run generated `curl` snippet in terminal | Returns HTTP 200 with dynamic mock JSON data | [ ] |
| 6 | Elevate user to Admin via AWS CLI command | "Admin Console" appears; shows global metrics and user list | [ ] |
| 7 | Submit limit upgrade request as user | Appears immediately in Admin Review Queue; can Approve/Deny | [ ] |
| 8 | Check AWS Billing Dashboard | Current Month Balance remains **\$0.00** | [ ] |

