---
pageClass: wide-page
---

# What is Express Spring Security?

**Express Spring Security** brings the beloved, battle-tested design patterns of **Spring Security 6** directly to Express & TypeScript applications — without requiring the NestJS monolith.

## The Core Problem in Node.js Security

When building authentication and Role-Based Access Control (RBAC) in Express, developers typically encounter three problems:

1. **Parameter Drilling `req.user`:**
   Custom middleware attaches user data to `req.user`. But domain services, database repositories, and loggers don't have access to `req`. You are forced to pass `req.user` through every single function call across your codebase.
2. **Passport.js is Outdated:**
   Passport was built for the 2011 callback era and session cookies. It lacks declarative URL matching, first-match-wins rule pipelines, and modern ambient context.
3. **NestJS is Monolithic:**
   NestJS provides guards and decorators, but requires committing your entire engineering team to an opinionated Angular-style architecture (modules, providers, dependency injection, and RxJS).

## How Express Spring Security Solves This

Express Spring Security bridges this gap with pure TypeScript:

* **`SecurityContextHolder`:** Uses Node's native `AsyncLocalStorage` to store the authenticated user in ambient request context. Access the user anywhere in your service layer via `SecurityContextHolder.getContext()` without passing `req`.
* **Fluent `SecurityFilterChain`:** Declarative URL rules using `requestMatchers('/api/admin/**').hasRole('ADMIN')` with first-match-wins semantics matching Spring Security 6.
* **Universal `@PreAuthorize`:** Works on both legacy Stage 2 decorators (`experimentalDecorators: true`) and modern TypeScript 5.0+ Stage 3 TC39 standard decorators, with automatic `this` binding and dynamic SpEL-style expression predicates.
* **Unopinionated Authentication:** A pluggable `PasswordEncoder` contract (`encode` & `matches`) giving you 100% freedom to use bcrypt, argon2, or your preferred hashing library with zero forced dependencies.
* **Pluggable Exception Handling:** Full separation of concerns between 401 Unauthorized (`AuthenticationEntryPoint`) and 403 Forbidden (`AccessDeniedHandler`).

---

## 🔄 Request Lifecycle Architecture

The following diagram illustrates how every request flows through the `SecurityFilterChain`, ambient `SecurityContextHolder`, method security, and exception handlers:

<RequestLifecycleDiagram />

To learn more about each stage, see complete configuration examples, or view the full breakdown, check out the [Request Lifecycle Architecture](/guide/architecture) and the [SecurityFilterChain Pipeline Guide](/guide/security-filter-chain).
