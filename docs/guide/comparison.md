# Motivation & Alternatives

How does **Express Spring Security** compare to traditional Node.js authentication tools?

## Architectural Comparison

| Dimension | Express + Passport.js | NestJS Guards | **Express Spring Security** |
| :--- | :--- | :--- | :--- |
| **Framework Lock-in** | Low (Express) | **High** (Requires full Nest framework) | **None (Pure Express + TypeScript)** |
| **Ambient Context** | ❌ Parameter drill `req.user` | ❌ Parameter drill `req.user` | **✅ Native `AsyncLocalStorage`** |
| **Declarative URL Rules** | ❌ Manual routing | ❌ Controller decorators only | **✅ Fluent (`requestMatchers`)** |
| **Ant Path Matching (`**`)** | ❌ Regex only | ❌ None | **✅ Native `AntPathMatcher`** |
| **Method Security** | ❌ None | `@UseGuards()` | **✅ `@PreAuthorize` (Stage 2 & Stage 3)** |
| **Dynamic Ownership Predicates** | Manual `if/else` | Custom Guard classes | **✅ Expression predicates `(auth, req)`** |
| **Custom 401 & 403 Separation** | Ad-hoc middleware | Exception filters | **✅ `AuthenticationEntryPoint` & `AccessDeniedHandler`** |
| **Pluggable Password Encoder** | Ad-hoc setup | Manual provider service | **✅ Unopinionated `PasswordEncoder` Contract** |
| **Asymmetric RS256 & JWKS** | Manual passport-jwt strategy | Passport strategy module | **✅ Built-in (`JwtAuthenticationFilterOptions`)** |

---

## 1. Why Not Passport.js?

Passport.js is an iconic library created in 2011. While it remains useful for third-party OAuth redirect flows (e.g. "Log in with Google" buttons), its architecture has fundamental limitations for modern TypeScript APIs:

* **Callback Hell:** Designed for Node's original callback pattern rather than async/await.
* **Mutates `req.user`:** Forces your code into parameter-drilling `req` through domain services, database repositories, and loggers.
* **No Fluent URL Matching:** You must manually attach passport middleware to individual route definitions.

---

## 2. Why Not NestJS Guards?

NestJS is an impressive full-stack framework that brought Angular-style architecture to Node.js. However, adopting NestJS requires:

* **Massive Framework Lock-in:** You must structure your entire backend around Nest modules, controllers, providers, custom dependency injection, and RxJS observables.
* **Steep Learning Curve:** Teams coming from standard Express or Fastify face substantial refactoring overhead.

**Express Spring Security gives you the best part of NestJS (declarative guards and `@PreAuthorize` decorators) with zero framework lock-in.**

---

## 3. Why Not Ad-Hoc Middleware?

Writing custom Express middleware (`(req, res, next) => { ... }`) works for small hobby projects, but breaks down in enterprise codebases:

* **No Ambient Context:** Deep service layers cannot inspect the current user without receiving `req` as an argument.
* **No Path Hierarchy:** Catch-all security rules require fragile manual ordering.
* **Inconsistent Error Formats:** 401 Unauthorized and 403 Forbidden responses end up formatted differently across route files.
