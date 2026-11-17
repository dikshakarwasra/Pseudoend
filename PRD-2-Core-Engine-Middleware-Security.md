# pseudoend â€” Product Requirements Document (PRD 2 of 4)
## Document 2: Core Ephemeral Mocking Engine, Middleware Pipeline & Security Subsystem

---

### Table of Contents
1. **[Client Onboarding Guide: HTTP, CORS & Lambda Request Anatomy](#1-client-onboarding-guide-http-cors--lambda-request-anatomy)**
2. **[Engine Functional Overview & Design Goals](#2-engine-functional-overview--design-goals)**
3. **[Universal Dynamic Mocking Engine](#3-universal-dynamic-mocking-engine)**
   - Dynamic Route Resolution
   - Static Payloads & Faker-Powered Dynamic Templating
   - Request Echo Engine & Stateful In-Memory CRUD
   - Universal Language & Protocol Compatibility
4. **[Middleware Pipeline Architecture](#4-middleware-pipeline-architecture)**
   - Security & API Key Authentication
   - CORS Negotiation Engine
   - Configurable Network Latency Simulator
   - Chaos & Fault-Injection Engine (Failure Simulation)
5. **[Multi-Tier Rate Limiting & Anti-Abuse Subsystem](#5-multi-tier-rate-limiting--anti-abuse-subsystem)**
   - Atomic Token Bucket Implementation
   - Tier Quota Matrix
   - IP-Level Blacklisting & Guardrails
6. **[Account Lifecycle & Security Specifications](#6-account-lifecycle--security-specifications)**
7. **[AI Model Code-Generation Prompt: Phase 2 Engine & Security](#7-ai-model-code-generation-prompt-phase-2-engine--security)**
8. **[Client Verification Runbook: cURL & Fault Injection Testing](#8-client-verification-runbook-curl--fault-injection-testing)**

---

## 1. Client Onboarding Guide: HTTP, CORS & Lambda Request Anatomy
> **Target Audience:** Junior Cloud Developer (~1 month AWS experience)  
> **Objective:** Understand how incoming frontend requests travel through API Gateway into AWS Lambda, how CORS works, and why mock engines must be language-agnostic.

### 1.1 The Lifecycle of a Request in Serverless
When a frontend application (e.g., a React app running on `localhost:3000` or a mobile app) makes a network call:
```
[Frontend Client] 
       â”‚  (1) HTTP Request: GET /mock/proj_123/users
       â–¼
[AWS API Gateway] 
       â”‚  (2) Packages request into a structured JSON "Event"
       â–¼
[AWS Lambda (Node.js/TS)]
       â”‚  (3) Unpacks Event -> Runs Middleware -> Formats Mock Response
       â–¼
[AWS API Gateway]
       â”‚  (4) Converts response JSON back into an HTTP response wire format
       â–¼
[Frontend Client]
          (5) Receives HTTP 200 OK with mock data
```

### 1.2 Demystifying CORS (Cross-Origin Resource Sharing)
If your frontend runs on `http://localhost:5173` and calls `https://api.pseudoend.dev`, your web browser will automatically send an invisible `OPTIONS` request (called a **Pre-flight Request**) asking: *"Is localhost allowed to send requests to this server?"*  
If the backend does not respond with exact CORS headers (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods`, etc.), the browser will deliberately block the request and show a red error in your console. `pseudoend` handles this automatically at the API Gateway and Lambda level.

### 1.3 What an AWS Lambda Event Looks Like
Your Lambda handler function receives an `event` object containing:
- `event.rawPath`: The URL path requested (e.g., `/mock/proj_abc/products/42`).
- `event.requestContext.http.method`: `GET`, `POST`, `PUT`, `DELETE`, etc.
- `event.headers`: Incoming headers (e.g., `x-pseudoend-key`, `authorization`).
- `event.queryStringParameters`: URL query strings (e.g., `?page=2&limit=10`).
- `event.body`: The JSON string sent by `POST` or `PUT` calls.

---

## 2. Engine Functional Overview & Design Goals

The `pseudoend` Core Engine is the heart of the system. It enables frontend developers to simulate complete, real-world REST backends before any real database or business logic is coded.

### Core Objectives:
1. **Zero-Code Endpoint Creation:** Create endpoints via simple JSON templates or dynamic wildcard matchers.
2. **Realistic Frontend Testing:** Accurately simulate network lag, loading states, and random 500/404 server errors so frontend developers can test their loading spinners, skeletons, and error toasts.
3. **Cloud Credit Conservation:** Ensure that an infinite loop or malicious actor cannot exhaust the owner's AWS Free Tier through aggressive atomic rate limiting.

---

## 3. Universal Dynamic Mocking Engine

### 3.1 Dynamic Route Resolution
The Mock Engine Lambda receives all requests matching:
```
ANY /mock/{projectId}/{proxy+}
```
The router resolves the route according to the following precedence hierarchy:
1. **Exact Match:** Method + Path match (e.g., `GET /users/active`).
2. **Parameterized Match:** Dynamic URL parameters (e.g., `GET /users/:id` matching `/users/123`).
3. **Wildcard Fallback:** Catch-all handlers (e.g., `ANY /users/*`).
4. **Echo Fallback (if enabled on Project):** If no route is defined, echo the request back as an HTTP 200.
5. **Default 404:** Returns a clean structured JSON 404 error with instructions on how to create the route.

### 3.2 Static Payloads & Faker-Powered Dynamic Templating
`pseudoend` supports both static JSON responses and dynamic template tags evaluated at runtime.

#### Supported Dynamic Tags:
| Template Tag | Generated Value Example |
| :--- | :--- |
| `{{uuid}}` | `4f3a8b2c-9d1e-4f7a-8b3c-1d2e3f4a5b6c` |
| `{{timestamp}}` | `1700000000` (Unix Epoch) |
| `{{isoDate}}` | `2026-11-16T12:00:00.000Z` |
| `{{faker.name.fullName}}` | `Sarah Jenkins` |
| `{{faker.internet.email}}` | `sarah.jenkins@example.com` |
| `{{faker.image.avatar}}` | `https://avatars.githubusercontent.com/u/12345` |
| `{{faker.number.int(10, 500)}}` | `342` |
| `{{request.params.id}}` | Injects the URL path parameter `:id` directly into the response |
| `{{request.query.page}}` | Injects the URL query parameter `?page=` into the response |

#### Example Route Definition Stored in DynamoDB:
```json
{
  "PK": "PROJ#proj_987",
  "SK": "ROUTE#GET#users/:id",
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "x-powered-by": "pseudoend-engine"
  },
  "latencyMs": 250,
  "failureRatePercent": 0,
  "responseTemplate": {
    "status": "success",
    "data": {
      "id": "{{request.params.id}}",
      "name": "{{faker.name.fullName}}",
      "email": "{{faker.internet.email}}",
      "avatar": "{{faker.image.avatar}}",
      "createdAt": "{{isoDate}}"
    }
  }
}
```

### 3.3 Request Echo Engine & Stateful In-Memory CRUD
For rapid testing where the developer hasn't configured schemas yet:
- **Echo Mode:** When a request hits `/mock/{projectId}/echo`, `pseudoend` returns an HTTP 200 containing:
  ```json
  {
    "receivedMethod": "POST",
    "receivedHeaders": { ... },
    "receivedQueryParams": { "filter": "active" },
    "receivedBody": { "username": "alice", "score": 99 },
    "echoTimestamp": "2026-11-16T12:38:43Z"
  }
  ```
- **Stateful CRUD Simulation:** For any entity route created with `stateful: true`, `pseudoend` stores POST/PUT items in a temporary DynamoDB collection for that project (`TTL: 24 hours`). A subsequent `GET /mock/{projectId}/items` will return the newly posted item, giving frontends a 100% realistic interactive backend experience.

### 3.4 Universal Language & Protocol Compatibility
Because `pseudoend` operates strictly over standard HTTP/1.1 and HTTP/2 wire protocols with standard JSON serialization, it is guaranteed compatible with every programming language:
- **Web:** JavaScript (Fetch, Axios), TypeScript, React Query, Svelte, Vue, Angular.
- **Mobile:** Swift (URLSession, Alamofire), Kotlin/Java (Retrofit, OkHttp), Flutter (http, Dio).
- **Backend/Scripting:** Python (requests, httpx), Go, Rust, Ruby, PHP, cURL.

---

## 4. Middleware Pipeline Architecture

The Mock Engine processes all incoming requests through an ordered, pipeline pattern:

```
[Incoming Request]
       â”‚
       â–¼
[1. Request Parser & Normalizer] â”€â”€â–º Extracts path, method, headers, query, body
       â”‚
       â–¼
[2. CORS Preflight Interceptor] â”€â”€â”€â–º If method == OPTIONS, returns HTTP 204 immediately
       â”‚
       â–¼
[3. Auth & API Key Validator] â”€â”€â”€â”€â”€â–º Verifies 'x-pseudoend-key' against DynamoDB
       â”‚                             (Halts with 401 if missing/invalid)
       â–¼
[4. Tier & Rate-Limit Guard] â”€â”€â”€â”€â”€â”€â–º Atomic token deduction in DynamoDB
       â”‚                             (Halts with 429 if quota exhausted)
       â–¼
[5. Chaos / Fault Injector] â”€â”€â”€â”€â”€â”€â”€â–º Evaluates failureRatePercent (Simulates 500, 503, 404)
       â”‚
       â–¼
[6. Route Resolver & Template Exec]â–º Evaluates dynamic tags, substitutes params
       â”‚
       â–¼
[7. Latency Simulator] â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º Delays response by latencyMs (e.g. 500ms)
       â”‚
       â–¼
[Outgoing Response]
```

### 4.1 Chaos & Fault-Injection Engine
Frontends fail in production because developers only test the "happy path" (HTTP 200). `pseudoend` allows developers to set:
- `failureRatePercent: 20` (20% of all requests will randomly return a configurable HTTP 500 or 503 error).
- `latencyMs: 1200` (Every request takes 1.2 seconds, allowing frontend developers to ensure loading spinners don't flicker or lock the UI).

---

## 5. Multi-Tier Rate Limiting & Anti-Abuse Subsystem

To guarantee that your AWS account does not incur unexpected costs, `pseudoend` enforces a **two-tier rate limiter**:
1. **Edge-Level Throttling:** API Gateway v2 Default Route limits (50 burst, 20 sustained req/sec).
2. **Application-Level Token Bucket:** Managed inside DynamoDB using atomic updates.

### 5.1 Atomic Token Bucket Implementation
Instead of running a costly Redis cluster (\$15/mo+), `pseudoend` uses native DynamoDB atomic updates on a per-minute and per-day basis:

```typescript
// Key: BUCKET#<apiKey>#<YYYY-MM-DD>
const result = await dynamoDB.send(new UpdateItemCommand({
  TableName: "pseudoend-main",
  Key: {
    PK: { S: `BUCKET#${apiKey}#${currentDay}` },
    SK: { S: "COUNTER" }
  },
  UpdateExpression: "ADD requestCount :inc SET #ttl = if_not_exists(#ttl, :expiry)",
  ExpressionAttributeNames: { "#ttl": "TTL" },
  ExpressionAttributeValues: {
    ":inc": { N: "1" },
    ":expiry": { N: (Math.floor(Date.now() / 1000) + 86400 * 2).toString() }
  },
  ReturnValues: "UPDATED_NEW"
}));

const totalRequestsToday = Number(result.Attributes.requestCount.N);
if (totalRequestsToday > tierDailyLimit) {
  return { statusCode: 429, body: JSON.stringify({ error: "Daily credit quota exhausted. Request an upgrade via dashboard." }) };
}
```

### 5.2 Tier Quota Matrix
| Tier Name | How Obtained | Daily Request Limit | Burst Limit | Max Routes per Project | Dynamic Templating? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free Tier** | Automatic upon signup | 1,000 requests/day | 10 req/sec | 15 routes | Yes (Basic) |
| **Developer Tier** | Request approval by Admin | 10,000 requests/day | 30 req/sec | 50 routes | Yes (Advanced Faker) |
| **Pro Tier** | Request approval by Admin | 50,000 requests/day | 50 req/sec | 200 routes | Yes (Stateful CRUD + Echo) |

> **Critical Rule:** There are **NO PAID UPGRADES** or automated credit-card billing mechanisms. Higher tiers are unlocked strictly through an in-app "Request Upgrade" form reviewed by the administrator, ensuring absolute control over cloud spending.

---

## 6. Account Lifecycle & Security Specifications

1. **Authentication:**
   - Password hashing using `bcryptjs` (salt rounds: 12) or `scrypt`.
   - JWT tokens signed with an ephemeral secret stored in AWS SSM Parameter Store (Free Tier) or Lambda Environment variable.
   - Tokens expire after 24 hours.
2. **API Keys:**
   - Prefixed with `sk_live_` or `sk_test_` followed by 32 cryptographically secure random hexadecimal characters.
   - Stored hashed in DynamoDB to prevent leakage if DB read logs are audited.
3. **Account Deletion (Self-Service GDPR Compliance):**
   - User clicks "Delete Account" -> Lambda performs cascading deletion:
     - All user routes, projects, API keys, and rate limit counters are deleted from DynamoDB.

---

## 7. AI Model Code-Generation Prompt: Phase 2 Engine & Security

```markdown
### SYSTEM ROLE: Senior Principal Node.js / TypeScript Serverless Engineer

### MISSION:
Generate the complete production implementation of the `pseudoend-mock-engine-fn` and `pseudoend-management-fn` AWS Lambda handlers in TypeScript.

### TECHNICAL REQUIREMENTS:
1. Runtime: Node.js 20.x, TypeScript 5.x, AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`).
2. Directory Structure:
   - `src/handlers/mockEngine.ts`
   - `src/handlers/management.ts`
   - `src/middleware/auth.ts`
   - `src/middleware/cors.ts`
   - `src/middleware/rateLimiter.ts`
   - `src/middleware/chaos.ts`
   - `src/engine/templateParser.ts`
   - `src/engine/routeMatcher.ts`
   - `src/types/index.ts`
3. Engine Features:
   - Route resolution matching exact paths and parameters (`:id`).
   - Tag replacement supporting `{{uuid}}`, `{{timestamp}}`, `{{isoDate}}`, and `@faker-js/faker` string mocks.
   - Latency simulation using `new Promise(resolve => setTimeout(resolve, latencyMs))`.
   - Chaos engine returning HTTP 500 when `Math.random() * 100 < failureRatePercent`.
4. Security & Rate Limiting:
   - Atomic DynamoDB counter updating `BUCKET#<apiKey>#<date>` with native TTL.
   - Rejection with HTTP 429 when quota is exceeded.
   - Rejection with HTTP 401 when API key is missing, invalid, or belongs to a banned user.

### OUTPUT DELIVERABLES:
- Fully type-safe, error-handled TypeScript code with zero placeholder comments.
- Complete `package.json` with exact dependency versions (`esbuild`, `@aws-sdk/client-dynamodb`, `@faker-js/faker`, `jsonwebtoken`, `bcryptjs`, `zod`).
```

---

## 8. Client Verification Runbook: cURL & Fault Injection Testing
> **Target Audience:** Junior Cloud Developer  
> **Objective:** Verify your deployed mock engine handles routing, latency, and rate limiting as expected.

### 8.1 Testing the Mock Engine with cURL
Replace `<API_URL>` with your API Gateway endpoint and `<PROJECT_ID>` with your project ID:

```bash
# 1. Test standard GET request with API Key
curl -X GET "https://<API_URL>/mock/proj_123/users/42" \
     -H "x-pseudoend-key: sk_test_samplekey123" \
     -H "Content-Type: application/json"

# Expected Output:
# {"status":"success","data":{"id":"42","name":"Jane Doe","email":"jane@example.com"}}

# 2. Test Echo Endpoint (Reflecting your request)
curl -X POST "https://<API_URL>/mock/proj_123/echo?demo=true" \
     -H "x-pseudoend-key: sk_test_samplekey123" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello pseudoend!", "clientVersion": "1.0.0"}'

# Expected Output:
# Returns the exact body and query params back to you

# 3. Test Rate Limiter by firing a rapid loop
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X GET "https://<API_URL>/mock/proj_123/users" \
       -H "x-pseudoend-key: sk_test_samplekey123"
done
# Notice HTTP 200 responses followed by HTTP 429 when rate limit thresholds engage!
```

### 8.2 What To Do If You Encounter Errors
- **Got 401 Unauthorized:** Ensure the header `x-pseudoend-key` is supplied and spelled with lowercase `x-`.
- **Got 403 Forbidden:** The API Gateway route may not be mapped. Verify `$default` stage is linked to the Lambda.
- **Got 502 Bad Gateway:** The Lambda function crashed. Check the logs:
  ```bash
  aws logs tail /aws/lambda/pseudoend-mock-engine-fn --follow
  ```

