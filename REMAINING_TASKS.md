# Pseudoend — Remaining Production Tasks & Action Checklist

Use this checklist to track remaining operational tasks, custom domain setup, HTTPS/SSL certificates, theming, and cloud verification.

---

### 1. Zero-Cost Production Domains & Hosting Strategy
- [ ] **Client-Side Portal**:
  - **Option A (Vercel)**:
    - [x] Added `portal/vercel.json` for SPA routing & edge caching
    - [x] Added `portal/.env.production` pointing to live AWS API Gateway
    - [ ] Import repo into Vercel (Root Directory: `portal`) to deploy at `https://<your-project>.vercel.app`
  - **Option B (AWS CloudFront)**:
    - [x] CloudFront CDN & S3 provisioned at: `https://d1qp1cubuc7v6p.cloudfront.net` (Bucket: `sudoend-portal-3g8ng5`)
    - [ ] Sync built static portal files: `aws s3 sync portal/dist/ s3://sudoend-portal-3g8ng5 --delete`
- [x] **Backend & Mock Engine**: Deployed on **AWS Serverless Free Tier**
  - [x] API Gateway Live Endpoint: `https://hvr5wkatpa.execute-api.us-east-1.amazonaws.com` (Free, built-in Amazon SSL)
  - [x] DynamoDB table: `sudoend-main` (PAY_PER_REQUEST on-demand mode, TTL enabled)
  - [x] Lambda functions: `sudoend-mock-engine-fn-3g8ng5` & `sudoend-management-fn-3g8ng5` (Node.js 20, 256MB)
- [ ] *(Optional Future Step)* Custom Domain Name (e.g., `pseudoend.com` via Cloudflare/Route 53 if moving off `*.vercel.app` and `*.amazonaws.com`)

---

### 2. Branding, Themes & UX Customization
- [ ] Implement a Light / Dark mode theme toggle button in `portal/src/components/Header.tsx` (using Tailwind `dark:` classes and `localStorage`)
- [ ] Replace the placeholder SVG favicon in `portal/index.html` with your custom `Pseudoend` logo icon
- [ ] Add OpenGraph and Twitter card `<meta>` tags in `portal/index.html` for rich link previews when sharing on Discord, Twitter/X, and LinkedIn
- [ ] Customize the initial mock routes seeded during user registration in `backend/src/handlers/management.ts` (e.g., adding sample ecommerce or auth routes)

---

### 3. Cloud Deployment & Initial Production Bootstrap
- [x] Ensure local toolchain (Node.js 20, npm, AWS CLI, and Terraform) can execute outside sandbox restrictions
- [x] Run `aws configure` with your `pseudoend-admin` IAM credentials
- [x] Provisioned via Terraform (`terraform apply` succeeded)
- [x] Live Deployment Endpoints:
  - **API Gateway URL**: `https://hvr5wkatpa.execute-api.us-east-1.amazonaws.com`
  - **CloudFront CDN Endpoint**: `https://d1qp1cubuc7v6p.cloudfront.net`
  - **S3 Bucket**: `sudoend-portal-3g8ng5`
  - **DynamoDB Table**: `sudoend-main`
- [ ] Register the very first account on your live portal (`admin@yourdomain.com`)
- [ ] Run the AWS CLI command to grant that account `role: "admin"` in the DynamoDB table:
  ```bash
  aws dynamodb update-item \
    --table-name sudoend-main \
    --key '{"PK": {"S": "USER#<your-user-id>"}, "SK": {"S": "METADATA"}}' \
    --update-expression "SET #r = :role" \
    --expression-attribute-names '{"#r": "role"}' \
    --expression-attribute-values '{":role": {"S": "admin"}}'
  ```

---

### 4. Billing Safety & CloudWatch Monitoring
- [ ] Verify in AWS Console that DynamoDB table `sudoend-main` is running in `PAY_PER_REQUEST` mode
- [ ] Verify that DynamoDB Time-To-Live (TTL) is marked as `ENABLED` on attribute `TTL`
- [ ] Create an AWS CloudWatch billing alarm configured to send an urgent email if estimated charges reach $0.01:
  ```bash
  aws cloudwatch put-metric-alarm \
    --alarm-name "pseudoend-Zero-Dollar-Guardrail" \
    --metric-name EstimatedCharges \
    --namespace AWS/Billing \
    --statistic Maximum \
    --period 21600 \
    --threshold 0.01 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --evaluation-periods 1 \
    --alarm-actions <Your-SNS-Topic-ARN>
  ```
- [ ] Confirm that CloudWatch Log Groups are set strictly to 7-day expiration so log storage remains free

---

### 5. Production Operations & CI/CD
- [ ] Create a private or public GitHub repository for `Pseudoend` and push the project code
- [ ] Set up a `.github/workflows/deploy.yml` GitHub Actions pipeline for automated testing (`vitest`) and zero-downtime static builds
- [ ] (Optional) Connect a free transactional email service (such as Resend Free Tier or AWS SES) to send automated welcome and password-reset emails
- [ ] Test connecting a real frontend app (React, Vue, iOS, or Flutter) using the generated code snippets from the portal

