---
title: SecurityFilterChain Pipeline
pageClass: wide-page
---

# SecurityFilterChain Pipeline

The `SecurityFilterChain` is the core orchestrator of your application's security. It guarantees that security middleware executes in strict, secure order before any request reaches your route handlers.

## Request Lifecycle Architecture

The diagram below illustrates the complete request lifecycle from the moment an incoming HTTP request hits Express, through ambient context initialization, pre-filters, JWT verification, Ant-path URL authorization, method security decorators, domain services, and final HTTP response. You can also inspect the [Full Dedicated Architecture Page](/guide/architecture).

<RequestLifecycleDiagram />

### Detailed Step-by-Step Breakdown

1. **`SecurityContextHolder.initialize()`**:
   Wraps the incoming request inside Node's native `AsyncLocalStorage`. This creates an isolated ambient context bubble for the request lifecycle, enabling any downstream service, logger, or database repository to call `SecurityContextHolder.getContext()` without parameter-drilling `req`.
2. **Pre-Filters Pipeline**:
   Executes pre-authentication middleware such as CORS headers (`.cors()`), request body parsing (`express.json()`), Helmet headers, or rate-limiting.
3. **`JwtAuthenticationFilter`**:
   Extracts the Bearer token from the `Authorization` header, verifies its cryptographic signature (supporting symmetric HS256, asymmetric RS256/ES256 PEM keys, or dynamic JWKS key rotation), and stores the authenticated `UserDetails` into `SecurityContextHolder`.
4. **`AuthorizeHttpRequestsConfigurer`**:
   Matches the requested path against declarative Ant-style patterns (`/api/public/**`, `/api/admin/**`, etc.) using **first-match-wins** semantics.
   - If marked `.permitAll()`, the request proceeds directly to the route handler.
   - If unauthorized (missing or invalid token), it delegates immediately to `AuthenticationEntryPoint` (HTTP 401).
   - If forbidden (insufficient roles), it delegates immediately to `AccessDeniedHandler` (HTTP 403).
5. **`@PreAuthorize` / Method Security**:
   Before executing the controller method, method-level decorators evaluate required roles or custom ownership predicate functions `(auth, req) => boolean`. If denied, it routes to `AccessDeniedHandler` (HTTP 403). If allowed, the controller method executes with its `this` context automatically preserved.
6. **Service & Domain Layer**:
   Your business logic executes cleanly, retrieving the authenticated user via `SecurityContextHolder.getContext()` without parameter-drilling `req`.
7. **HTTP Response**:
   The response is delivered back to the client. When the request terminates, `AsyncLocalStorage` cleanly cleans up the request context.

## Configuration API

```typescript
import express from 'express';
import { SecurityFilterChain, JwtAuthenticationFilter } from 'express-spring-security';

const app = express();

new SecurityFilterChain(app)
  // 1. Enable CORS before authentication
  .cors({ origin: 'https://myfrontend.com' })

  // 2. Pre-filters (parsers, security headers)
  .addPreFilter(express.json())

  // 3. JWT authentication
  .addJwtAuthenticationFilter(new JwtAuthenticationFilter(process.env.JWT_SECRET!))

  // 4. URL path authorization
  .authorizeHttpRequests(auth => auth
    .requestMatchers('/api/public/**', '/health').permitAll()
    .requestMatchers('/api/admin/**').hasRole('ADMIN')
    .requestMatchers('POST', '/api/posts/**').hasAnyRole('EDITOR', 'ADMIN')
    .anyRequest().authenticated()
  )

  // 5. Custom exception handlers (optional)
  .exceptionHandling(ex => ex
    .authenticationEntryPoint(new MyCustom401Handler())
    .accessDeniedHandler(new MyCustom403Handler())
  )

  // 6. Apply to the Express application
  .apply();
```

## First-Match-Wins Semantics

Like Spring Security 6, rules defined inside `.authorizeHttpRequests()` follow **first-match-wins** logic:

```typescript
.authorizeHttpRequests(auth => auth
  // More specific rules MUST be placed first:
  .requestMatchers('/api/admin/public/**').permitAll()
  .requestMatchers('/api/admin/**').hasRole('ADMIN')
  
  // Broad catch-all rules go at the bottom:
  .anyRequest().authenticated()
)
```
If you place `.requestMatchers('/api/admin/**').hasRole('ADMIN')` before `.requestMatchers('/api/admin/public/**').permitAll()`, the public sub-path will be blocked because the broader rule matched first.
