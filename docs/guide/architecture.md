---
title: Request Lifecycle Architecture
description: Complete visual flowchart and in-depth breakdown of the Express Spring Security request pipeline.
aside: false
pageClass: wide-page
---

# 🔄 Request Lifecycle Architecture

Express Spring Security brings the battle-tested, deterministic security model of **Spring Security 6** directly to Express 5.x and TypeScript applications.

The interactive diagram below visualizes the journey of an HTTP request from arrival at the Express network boundary, through ambient context initialization, pre-authentication middleware, cryptographic JWT verification, declarative Ant-path authorization, method-level security decorators, domain execution, and response exit:

<RequestLifecycleDiagram />

---

## Complete Stage-by-Stage Breakdown

### 1. `SecurityContextHolder.initialize()`
* **Component:** `SecurityContextHolder` powered by Node.js native `AsyncLocalStorage`.
* **Execution Moment:** The very first middleware executed on the incoming request.
* **Mechanism:** It creates an isolated, ambient request scope bubble. Any downstream service, database repository, audit logger, or helper function can retrieve the current user and authentication tokens via `SecurityContextHolder.getContext()` without needing to parameter-drill `req` across dozens of functions.

### 2. Pre-Filters Pipeline
* **Components:** `.cors()`, `.addPreFilter(...)`
* **Common Use Cases:** CORS headers, body parsers (`express.json()`, `express.urlencoded()`), security headers (Helmet), and rate limiters.
* **Guarantee:** Guarantees that essential pre-flight and pre-processing tasks finish cleanly before authentication filters execute.

### 3. `JwtAuthenticationFilter`
* **Components:** `JwtAuthenticationFilter`, `TokenSignerKeyResolver`
* **Supported Algorithms:**
  * **Symmetric HMAC:** `HS256`, `HS384`, `HS512` using a shared secret.
  * **Asymmetric Public/Private Keys:** `RS256`, `ES256` using PEM-encoded public keys.
  * **Dynamic JWKS Resolvers:** Dynamic key rotation from identity providers such as **Auth0**, **Okta**, **Keycloak**, and **AWS Cognito**.
* **Behavior:** Extracts the `Bearer` token from the `Authorization` header, verifies signature integrity, checks expiration (`exp`), and populates `SecurityContextHolder` with an authenticated `UserDetails` principal.

### 4. `AuthorizeHttpRequestsConfigurer` (URL Rules Engine)
* **Component:** `AntPathMatcher`
* **Rule Ordering:** **First-match-wins** semantics matching Spring Security 6.
* **Rule Possibilities:**
  * `.permitAll()`: Bypasses security checks and routes immediately to the controller (e.g. `/api/public/**`, `/health`).
  * `.hasRole('ROLE')` / `.hasAnyRole('A', 'B')`: Enforces authority checks against the authenticated principal.
  * `.authenticated()`: Requires any valid authenticated session.
  * `.denyAll()`: Completely seals the path.
* **Failure Branching:**
  * Missing or unverified credentials immediately trigger the **`AuthenticationEntryPoint`** (HTTP 401).
  * Valid token but insufficient authority immediately triggers the **`AccessDeniedHandler`** (HTTP 403).

### 5. Pluggable Exception Handlers (401 vs 403)
* **`AuthenticationEntryPoint` (HTTP 401 Unauthorized):**
  Triggered when an unauthenticated client attempts to access a protected URL or method. Defaults to JSON:
  ```json
  { "error": "Unauthorized", "message": "Authentication required", "status": 401 }
  ```
* **`AccessDeniedHandler` (HTTP 403 Forbidden):**
  Triggered when an authenticated principal has valid identity but lacks required roles or fails a business predicate. Defaults to JSON:
  ```json
  { "error": "Forbidden", "message": "Access is denied", "status": 403 }
  ```

### 6. `@PreAuthorize` Method Security
* **Decorator Compatibility:** Works out-of-the-box with **both** TypeScript Stage 2 (legacy `experimentalDecorators: true`) and modern TypeScript 5.0+ Stage 3 (TC39 standard decorators).
* **Automatic `this` Context:** Automatically binds and preserves the controller instance `this` context, avoiding undefined method errors.
* **Dynamic Predicates:** Supports SpEL-style ownership logic:
  ```typescript
  @PreAuthorize((auth, req) => auth.hasRole('ADMIN') || auth.username === req.params.username)
  async updateProfile(req: Request, res: Response) { ... }
  ```

### 7. Controller / Route Handler & Domain Services
* Express route handlers execute your business domain logic cleanly.
* Inside any service, repository, or ORM hook (Prisma, TypeORM, Mongoose):
  ```typescript
  const currentUser = SecurityContextHolder.getContext().getAuthentication()?.getPrincipal();
  ```
  No `req` parameter needs to be passed down.

### 8. HTTP Response & Ambient Cleanup
* The HTTP response is delivered to the client.
* Once the request finishes, `AsyncLocalStorage` cleanly destroys the ambient context, preventing memory leaks and cross-request context leakage.

---

## Architecture Comparison

| Capability | Express Spring Security | Vanilla Express | Passport.js | NestJS Guards |
| :--- | :---: | :---: | :---: | :---: |
| **Ambient Context (`ThreadLocal`)** | ✅ Built-in (`AsyncLocalStorage`) | ❌ Parameter drilling `req.user` | ❌ Parameter drilling `req.user` | ⚠️ Limited / Complex |
| **First-Match-Wins URL Rules** | ✅ Fluent Spring-style API | ❌ Manual per-route ordering | ❌ Manual per-route middleware | ❌ Decorator-bound only |
| **Ant Path Matchers (`/**`, `/*`)** | ✅ Built-in | ❌ Regex / Path-to-regexp | ❌ Manual | ❌ Manual |
| **Stage 2 & Stage 3 `@PreAuthorize`**| ✅ Universal Compatibility | ❌ None | ❌ None | ⚠️ Nest-only framework DI |
| **Strict 401 vs 403 Separation** | ✅ Built-in EntryPoint & DeniedHandler | ❌ Ad-hoc `res.status(...)` | ⚠️ Mixed callback errors | ⚠️ HttpException filters |
| **Framework Lock-in** | 🟢 **Zero Lock-in** (Vanilla Express) | 🟢 Zero | 🟢 Low | 🔴 **High Lock-in** (Monolith) |

---

## Next Steps

* [SecurityFilterChain Pipeline Guide](/guide/security-filter-chain) — Configure your first complete security filter chain.
* [Ambient Context Guide](/guide/ambient-context) — Master `SecurityContextHolder` across your domain services.
* [Method Security Guide](/guide/method-security) — Protect class methods and routes with `@PreAuthorize`.
