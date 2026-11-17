# pseudoend â€” Product Requirements Document (PRD 3 of 4)
## Document 3: Developer Web Portal, Universal Frontend Integration Engine & Administrative Governance Console

---

### Table of Contents
1. **[Client Onboarding Guide: S3, CloudFront & Single Page Applications (SPA)](#1-client-onboarding-guide-s3-cloudfront--single-page-applications-spa)**
2. **[Developer Portal UI/UX Architecture](#2-developer-portal-uiux-architecture)**
3. **[Authentication & Account Management Views](#3-authentication--account-management-views)**
4. **[Mock Studio & Visual Route Builder](#4-mock-studio--visual-route-builder)**
5. **[Live Request Inspector & Debugger](#5-live-request-inspector--debugger)**
6. **[Universal Frontend Code Generation Engine](#6-universal-frontend-code-generation-engine)**
   - React / Next.js (Native Fetch & TanStack Query)
   - Vue 3 (Axios)
   - Svelte / SvelteKit
   - Mobile: Flutter (Dart) & iOS (Swift async/await)
   - Android (Kotlin / Retrofit) & cURL
7. **[Quota Meter & Manual Upgrade Request Workflow](#7-quota-meter--manual-upgrade-request-workflow)**
8. **[Administrative Governance Console (Admin Mode)](#8-administrative-governance-console-admin-mode)**
   - Role-Based Access Control (RBAC)
   - User Governance & Instant Ban Toggles
   - Upgrade Request Review Queue
   - Zero-Dollar AWS Cost Monitor
9. **[AI Model Code-Generation Prompt: Phase 3 Web Portal & Admin](#9-ai-model-code-generation-prompt-phase-3-web-portal--admin)**
10. **[Client Verification Runbook: Testing Dashboard & Admin Features](#10-client-verification-runbook-testing-dashboard--admin-features)**

---

## 1. Client Onboarding Guide: S3, CloudFront & Single Page Applications (SPA)
> **Target Audience:** Junior Cloud Developer (~1 month AWS experience)  
> **Objective:** Understand how modern web apps run in the cloud with \$0.00 server costs using static hosting and content distribution networks.

### 1.1 How Web Apps Run Without a Dedicated Web Server
Instead of paying \$10â€“\$20/month for an Apache or Nginx virtual machine, modern frontends (built with React, Vite, or Next.js static export) are simply compiled into plain HTML, JavaScript, and CSS files:
```
[User Browser]
       â”‚
       â–¼
[Amazon CloudFront CDN (Global Edge Caching)]
       â”‚ (Cached static files delivered in < 20ms)
       â–¼
[Amazon S3 Bucket (Storage for index.html, bundle.js, style.css)]
```
- **S3 (Simple Storage Service):** Acts like an infinitely scalable hard drive in the cloud. It costs pennies per gigabyte (under 5 GB is 100% free under AWS Free Tier).
- **CloudFront:** AWSâ€™s global Content Delivery Network. It copies your files to servers in over 400 cities worldwide, provides free HTTPS/SSL certificates, and serves your website instantly.
- **Handling Client-Side Routing:** In a Single Page App (SPA), when a user refreshes `/admin` or `/dashboard`, S3 normally returns a `404 Not Found` because no file named `admin` exists on disk. CloudFront is configured with a **Custom Error Response** that automatically rewrites 404s back to `/index.html` with an HTTP 200, allowing the client-side JavaScript router to handle the page seamlessly.

---

## 2. Developer Portal UI/UX Architecture

The `pseudoend` Developer Portal is engineered with a modern, high-contrast, developer-first aesthetic (clean dark mode by default, inspired by Vercel, Linear, and Supabase).

### Tech Stack Recommendation:
- **Framework:** React 18 / Vite or Next.js (Static Export `output: 'export'`)
- **Styling:** Tailwind CSS + Radix UI / Lucide Icons
- **State Management & Fetching:** TanStack Query (React Query)
- **Code Highlighting & Editor:** Monaco Editor or `@codemirror` for JSON editing

---

## 3. Authentication & Account Management Views

### 3.1 Sign Up / Registration View
- **Simplicity First:** Email and Password only. **No credit card required.**
- Upon registration:
  - Generates initial User record with tier `free` and `1,000` daily credits.
  - Automatically provisions a sample `Default Demo Project` pre-loaded with sample routes (`GET /users`, `POST /login`, `GET /products`) so the developer can immediately test endpoints within 10 seconds of registering.
  - Automatically generates the first API Key (`sk_test_...`) and displays it in a one-click copy modal.

### 3.2 Account Settings & GDPR Safe Deletion
- **Key Rotation:** Users can roll (revoke and regenerate) their API keys at any time.
- **Delete Account (Immediate Self-Purge):** A dangerous action dialog requiring the user to type their email to confirm. This triggers a cascading deletion in DynamoDB, removing all user data, mock routes, and keys.

---

## 4. Mock Studio & Visual Route Builder

The Mock Studio is the primary workspace where developers configure their mock endpoints:

```
+------------------------------------------------------------------------------------+
|  [+ New Route]   Project: My React Ecommerce App    Base URL: https://api.pseudoend...|
+------------------------------------------------------------------------------------+
| Method | Path               | Status | Latency | Chaos | Actions                   |
|--------|--------------------|--------|---------|-------|---------------------------|
| GET    | /api/v1/products   | 200 OK | 150 ms  | 0%    | [Edit] [Copy URL] [Delete]|
| POST   | /api/v1/checkout   | 201 CR | 800 ms  | 25%   | [Edit] [Copy URL] [Delete]|
| GET    | /api/v1/user/stats | 200 OK | 0 ms    | 0%    | [Edit] [Copy URL] [Delete]|
+------------------------------------------------------------------------------------+
```

### Route Editor Modal Fields:
1. **HTTP Method:** Select dropdown (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
2. **Endpoint Path:** Text input with dynamic parameter support (e.g., `/users/:id/posts`).
3. **HTTP Status Code:** Presets (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Server Error`).
4. **Latency Simulator (Slider):** Range `0 ms` to `5000 ms` (default: `100 ms`).
5. **Chaos / Fault Rate (Slider):** Range `0%` to `100%` (simulates random HTTP 500 errors to test frontend resilience).
6. **Response Payload Editor:** Rich JSON editor with syntax highlighting, JSON auto-formatting, and autocomplete for Faker dynamic tags (`{{faker.name.fullName}}`, `{{uuid}}`, etc.).

---

## 5. Live Request Inspector & Debugger

To make frontend troubleshooting effortless, the portal includes an interactive **Live Network Inspector** panel:
- Whenever a request hits any endpoint in the userâ€™s project, the transaction is logged with:
  - Timestamp
  - HTTP Verb & Exact Path
  - Client IP & User-Agent
  - Response Code & Execution Time (e.g., `200 OK - 182ms`)
  - Request Headers & Body JSON
  - Returned Response JSON
- **Frontend Benefit:** If a frontend developerâ€™s `fetch()` call is failing, they can open the Inspector and immediately see whether their headers or payload were formatted incorrectly.

---

## 6. Universal Frontend Code Generation Engine

Under each mock route, a developer can click **"Connect to Frontend"** to open an interactive code generation modal with multi-language tabs. The code is dynamically generated with their real API endpoint, Project ID, and API Key pre-filled.

### 6.1 React / Next.js (Native Fetch)
```javascript
// Example: Fetching mock products in React
import { useEffect, useState } from 'react';

export function useProducts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('https://api.pseudoend.dev/mock/proj_987/api/v1/products', {
      headers: {
        'x-pseudoend-key': 'sk_test_demo12345',
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
```

### 6.2 React (TanStack Query / React Query)
```typescript
import { useQuery } from '@tanstack/react-query';

export const useGetProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('https://api.pseudoend.dev/mock/proj_987/api/v1/products', {
        headers: { 'x-pseudoend-key': 'sk_test_demo12345' }
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    }
  });
};
```

### 6.3 Mobile: Flutter (Dart)
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>> fetchProducts() async {
  final url = Uri.parse('https://api.pseudoend.dev/mock/proj_987/api/v1/products');
  final response = await http.get(
    url,
    headers: {
      'x-pseudoend-key': 'sk_test_demo12345',
      'Content-Type': 'application/json',
    },
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to load products: ${response.statusCode}');
  }
}
```

### 6.4 Mobile: iOS (Swift with `async/await`)
```swift
import Foundation

struct PseudoendClient {
    static func fetchProducts() async throws -> Data {
        guard let url = URL(string: "https://api.pseudoend.dev/mock/proj_987/api/v1/products") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.setValue("sk_test_demo12345", forHTTPHeaderField: "x-pseudoend-key")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        return data
    }
}
```

---

## 7. Quota Meter & Manual Upgrade Request Workflow

### 7.1 Visual Credit Progress Bar
Prominently displayed in the portal header:
```
[âš¡ Daily Credits: 420 / 1,000 used today]  [Request Higher Limit]
```
- Green: < 70% usage.
- Yellow: 70% - 90% usage.
- Red: > 90% usage.

### 7.2 Zero-Paid Limit Increase Modal
When a developer reaches their limit or starts a major project:
- Clicking **"Request Higher Limit"** opens a simple modal:
  - **Requested Tier:** Developer (10,000 req/day) or Pro (50,000 req/day).
  - **Project Context:** Brief description of what frontend is being developed.
  - **Security Assurance Notice:** *"pseudoend is a community service with zero paid upgrades. Requests are approved by the administrator to prevent cloud credit exhaustion."*
- Submitting the form creates a record in DynamoDB with `PK: QUOTA_REQ#<id>`, `SK: PENDING`.

---

## 8. Administrative Governance Console (Admin Mode)

If a user logs in with an account having `role: "admin"`, an **"Admin Console"** tab appears in the navigation bar.

### 8.1 Admin Dashboard Features
```
+------------------------------------------------------------------------------------+
|  PSEUDOEND ADMIN CONSOLE                                        [Cloud Status: $0.00]|
+------------------------------------------------------------------------------------+
| Total Users: 48    | Daily Requests: 8,421   | Pending Upgrade Requests: 3        |
+------------------------------------------------------------------------------------+

[PENDING UPGRADE REQUESTS]
User: alex@frontend.dev | Current: Free (1,000) -> Target: Dev (10,000)
Reason: "Building a complex React Native app for hackathon with 5 teammates"
Actions: [Approve Upgrade] [Deny]

[USER MANAGEMENT & SURVEILLANCE]
Filter: [Search user email...]
- john@test.com  | Tier: Free | Requests: 980/1000 | Status: Active | [Ban] [Edit Quota]
- spammer@bot.ru | Tier: Free | Requests: 1000/1000| Status: BANNED | [Unban]
```

### 8.2 Admin Actions:
1. **One-Click Approval:** Instantly updates the user's tier in DynamoDB to `developer` or `pro` and sends a notification.
2. **Instant Ban Hammer:** Clicking **[Ban]** sets `isBanned: true`. The Mock Engine immediately rejects all future requests using that user's API keys with `HTTP 403 Forbidden`.
3. **Zero-Dollar Billing Monitor:** Displays current month AWS invocation counts and confirms the deployment remains within Free Tier thresholds.

---

## 9. AI Model Code-Generation Prompt: Phase 3 Web Portal & Admin

```markdown
### SYSTEM ROLE: Senior Staff Frontend Architect & React / Tailwind Specialist

### MISSION:
Generate the complete production Single Page Application (SPA) for the "pseudoend" Developer Portal and Admin Console.

### TECHNICAL STACK:
- React 18, TypeScript, Vite.
- Tailwind CSS (Dark theme by default with clean borders, slate-900 background, emerald accents).
- Lucide React icons, Radix UI components (Dialog, Tabs, Toast, DropdownMenu).
- Axios / TanStack Query for communication with the `pseudoend` Management API.

### REQUIRED VIEWS & COMPONENTS:
1. `AuthView.tsx`: Tabbed Sign In / Sign Up with error banners and automatic token storage in localStorage.
2. `DashboardLayout.tsx`: Header containing project switcher, API Key copy button, daily credit meter, and navigation tabs.
3. `MockStudioView.tsx`:
   - Interactive table listing mock routes.
   - Route creation modal with HTTP Method, Path, Status Code, Latency slider, Chaos slider, and JSON code editor.
4. `CodeConnectModal.tsx`:
   - Modal showing ready-to-use snippets for React (Fetch), React Query, Vue 3, Svelte, Flutter, Swift, and cURL.
5. `LiveInspectorView.tsx`: Real-time request log table showing incoming test calls.
6. `QuotaRequestModal.tsx`: Form to request higher free limits with reason field.
7. `AdminConsoleView.tsx`:
   - Protected route accessible only when `user.role === 'admin'`.
   - Global statistics widgets (Users, Total Requests, Cloud Cost).
   - Pending Quota Requests queue with Approve/Deny buttons.
   - User Table with Ban/Unban buttons and custom credit adjustment.

### OUTPUT DELIVERABLES:
- Modular, clean, production-grade code adhering to clean architecture.
- `vite.config.ts`, `tailwind.config.js`, and `package.json` ready for deployment to S3/CloudFront.
```

---

## 10. Client Verification Runbook: Testing Dashboard & Admin Features
> **Target Audience:** Junior Cloud Developer  
> **Objective:** Verify the web portal locally and test admin capabilities.

### 10.1 Running the Portal Locally
1. Navigate to the frontend directory:
   ```bash
   cd /Users/kalyugwasi/Documents/Pseudoend/portal
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:5173`.

### 10.2 Creating Your First Admin Account
By default, the first user registered in a fresh deployment can be designated as the Admin:
1. Register an account on the web portal: `admin@pseudoend.local` with password `AdminPassword123!`.
2. Run this one-line AWS CLI command to grant admin privileges:
   ```bash
   aws dynamodb update-item \
     --table-name pseudoend-main \
     --key '{"PK": {"S": "USER#admin@pseudoend.local"}, "SK": {"S": "METADATA"}}' \
     --update-expression "SET #r = :role" \
     --expression-attribute-names '{"#r": "role"}' \
     --expression-attribute-values '{":role": {"S": "admin"}}'
   ```
3. Refresh your browser. The **"Admin Console"** tab will now appear in your navigation bar!

### 10.3 Deploying Portal to S3 & CloudFront
To push your compiled web app to live production:
```bash
npm run build
aws s3 sync dist/ s3://<your-pseudoend-portal-bucket-name> --delete
aws cloudfront create-invalidation --distribution-id <your-cf-dist-id> --paths "/*"
```
Your live URL will be active worldwide at zero hosting cost!

