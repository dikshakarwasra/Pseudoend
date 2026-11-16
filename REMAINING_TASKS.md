# sudoend — Remaining Production Tasks & Action Checklist

Use this checklist to track remaining operational tasks, custom domain setup, HTTPS/SSL certificates, theming, and cloud verification.

---

### 1. Domain Registration & Free SSL / HTTPS Setup
- [ ] Purchase a custom domain name (e.g., via Namecheap, Cloudflare Registrar, or AWS Route 53)
- [ ] Create an AWS Route 53 Hosted Zone for your custom domain
- [ ] Request a free SSL/TLS certificate in AWS Certificate Manager (ACM) in the `us-east-1` region (covers `yourdomain.com` and `*.yourdomain.com`)
- [ ] Add DNS CNAME validation records in your domain registrar to verify SSL certificate ownership
- [ ] Attach the validated ACM certificate and custom domain (CNAME) to the CloudFront distribution in `infrastructure/s3_cloudfront.tf`
- [ ] Create an API Gateway Custom Domain Name in AWS (e.g., `api.yourdomain.com`) and map it to the `$default` stage

---

### 2. Branding, Themes & UX Customization
- [ ] Implement a Light / Dark mode theme toggle button in `portal/src/components/Header.tsx` (using Tailwind `dark:` classes and `localStorage`)
- [ ] Replace the placeholder SVG favicon in `portal/index.html` with your custom `sudoend` logo icon
- [ ] Add OpenGraph and Twitter card `<meta>` tags in `portal/index.html` for rich link previews when sharing on Discord, Twitter/X, and LinkedIn
- [ ] Customize the initial mock routes seeded during user registration in `backend/src/handlers/management.ts` (e.g., adding sample ecommerce or auth routes)

---

### 3. Cloud Deployment & Initial Production Bootstrap
- [ ] Ensure local toolchain (Node.js 20, npm, AWS CLI, and Terraform) can execute outside sandbox restrictions
- [ ] Run `aws configure` with your `sudoend-admin` IAM credentials
- [ ] Execute the master deployment script: `./sudoend-bootstrap.sh`
- [ ] Note down the generated API Gateway URL and CloudFront CDN endpoint from the terminal output
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
    --alarm-name "sudoend-Zero-Dollar-Guardrail" \
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
- [ ] Create a private or public GitHub repository for `sudoend` and push the project code
- [ ] Set up a `.github/workflows/deploy.yml` GitHub Actions pipeline for automated testing (`vitest`) and zero-downtime static builds
- [ ] (Optional) Connect a free transactional email service (such as Resend Free Tier or AWS SES) to send automated welcome and password-reset emails
- [ ] Test connecting a real frontend app (React, Vue, iOS, or Flutter) using the generated code snippets from the portal

