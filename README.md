# 🍃 Express Spring Security

> **Enterprise-grade Spring Security architecture for Express & TypeScript applications — without the NestJS monolith.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.x-green.svg)](https://expressjs.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)]()

---

## 💡 Why Express Spring Security?

In the Node.js / TypeScript ecosystem, developers needing structured, enterprise-ready authentication and Role-Based Access Control (RBAC) face a tough choice:

1. **Adopt NestJS:** Forces your entire codebase into an opinionated, heavy framework (Angular-style modules, providers, controllers, and RxJS).
2. **Use Passport.js:** Dated, callback-heavy, lacking declarative security pipelines and ambient context.
3. **Ad-Hoc Custom Middleware:** Mutates `req.user` and requires drilling `req` down into every repository, domain service, and logger.

**`express-spring-security` bridges this gap.** It brings the beloved, battle-tested design patterns of **Spring Security 6** directly to Express with pure TypeScript:

* 🔒 **Fluent Security Filter Chain:** Declarative URL authorization (`requestMatchers`, Ant-style paths, first-match-wins).
* 🧵 **ThreadLocal-style Context (`SecurityContextHolder`):** Ambient request context powered by Node's native `AsyncLocalStorage`. Access the authenticated user anywhere in your service layer without parameter-drilling `req`.
* 🛡️ **Universal `@PreAuthorize`:** Works on both **Stage 2** (`experimentalDecorators: true`) and **Stage 3** (TypeScript 5.0+ standard TC39 decorators), with automatic `this` binding and dynamic SpEL-style expression predicates.
* ⚡ **Dual Paradigm:** Use decorators on classes OR functional middleware (`hasRole`, `hasAnyRole`, `authenticated`, `authorize`) on plain Express routes.
* 🚦 **Pluggable Exception Handling:** Full separation between 401 (`AuthenticationEntryPoint`) and 403 (`AccessDeniedHandler`).
* 🔑 **Authentication Engine:** Built-in OWASP-compliant `ScryptPasswordEncoder` (zero external dependencies), `InMemoryUserDetailsManager`, and `AuthenticationManager`.

---

## 📦 Installation

```bash
npm install express-spring-security jsonwebtoken cors
npm install -D @types/jsonwebtoken @types/cors
```

---

## 🚀 Quick Start (5 Minutes)

### 1. Configure the `SecurityFilterChain`

```typescript
import express from 'express';
import {
  SecurityFilterChain,
  JwtAuthenticationFilter,
  SecurityContextHolder
} from 'express-spring-security';

const app = express();
const JWT_SECRET = 'your-256-bit-secret';

// Configure the pipeline (apply BEFORE routes)
new SecurityFilterChain(app)
  .cors()
  .addPreFilter(express.json())
  .addJwtAuthenticationFilter(new JwtAuthenticationFilter(JWT_SECRET))
  .authorizeHttpRequests(auth => auth
    // Public paths
    .requestMatchers('/api/public/**', '/api/auth/**').permitAll()

    // Role-based path rules (first-match-wins)
    .requestMatchers('/api/admin/**').hasRole('ADMIN')
    .requestMatchers('/api/user/**').hasAnyRole('USER', 'ADMIN')

    // HTTP method-specific rules
    .requestMatchers('POST', '/api/articles/**').hasRole('AUTHOR')

    // Zero-trust catch-all: all other endpoints require authentication
    .anyRequest().authenticated()
  )
  .apply();
```

---

## 🧩 Core Architecture & Features

### 1. Ambient Security Context (`SecurityContextHolder`)

Just like Java's `ThreadLocal`, `SecurityContextHolder` uses Node's native `AsyncLocalStorage`. Any function within the request lifecycle can retrieve the current user without passing `req` down through service layers:

```typescript
import { SecurityContextHolder } from 'express-spring-security';

export class OrderService {
  public async createOrder(items: string[]) {
    // Access user anywhere in the call stack!
    const auth = SecurityContextHolder.getContext();
    const currentUser = auth.user;

    console.log(`Order created by ${currentUser?.username} (ID: ${currentUser?.id})`);
  }
}
```

---

### 2. Method Security (`@PreAuthorize`)

Decorate your controller methods with role checks or dynamic ownership predicates. Auto-binds `this` so you can pass controller methods directly into Express router:

```typescript
import { Request, Response } from 'express';
import { PreAuthorize, SecurityContextHolder } from 'express-spring-security';

export class UserController {

  // Public endpoint
  public getPublicInfo(req: Request, res: Response) {
    res.json({ message: "Hello world" });
  }

  // Requires 'ADMIN' role
  @PreAuthorize('ADMIN')
  public deleteUser(req: Request, res: Response) {
    res.json({ message: "User deleted" });
  }

  // Dynamic Ownership Predicate (SpEL Alternative)
  // Only an ADMIN or the user themselves can update their profile:
  @PreAuthorize((auth, req) => {
    return auth.user?.roles.includes('ADMIN') || String(auth.user?.id) === String(req.params.id);
  })
  public updateProfile(req: Request, res: Response) {
    res.json({ message: `Updated profile ${req.params.id}` });
  }
}

// Routes registration
const controller = new UserController();
app.get('/api/public', controller.getPublicInfo.bind(controller));
app.delete('/api/users/:id', controller.deleteUser);
app.put('/api/users/:id', controller.updateProfile);
```

> **Decorator Compatibility:** Works out of the box with both legacy decorators (`"experimentalDecorators": true`) and modern TypeScript 5.0+ TC39 standard decorators!

---

### 3. Functional Route Helpers (No Classes Required)

If your Express codebase is purely functional, you don't need classes or decorators:

```typescript
import { hasRole, hasAnyRole, authenticated, authorize } from 'express-spring-security';

// Require specific role
app.get('/api/admin/metrics', hasRole('ADMIN'), (req, res) => {
  res.json({ cpu: "12%" });
});

// Require any of multiple roles
app.get('/api/dashboard', hasAnyRole('USER', 'ADMIN'), (req, res) => {
  res.json({ view: "Dashboard" });
});

// Require simple authentication
app.get('/api/profile', authenticated(), (req, res) => {
  res.json({ profile: "Data" });
});

// Custom expression predicate
app.delete('/api/post/:id', authorize((auth, req) => auth.user?.id === req.body.authorId), (req, res) => {
  res.json({ status: "deleted" });
});
```

---

### 4. Pluggable Exception Handling

Customize HTTP 401 and HTTP 403 responses to match your company's error response standards or RFC 7807 Problem Details:

```typescript
import {
  SecurityFilterChain,
  AuthenticationEntryPoint,
  AccessDeniedHandler
} from 'express-spring-security';

class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
  public commence(req: Request, res: Response, authException?: Error) {
    res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      error: "Unauthorized",
      path: req.originalUrl,
      message: authException?.message || "Authentication credentials required"
    });
  }
}

class CustomAccessDeniedHandler implements AccessDeniedHandler {
  public handle(req: Request, res: Response, accessDeniedException?: Error) {
    res.status(403).json({
      timestamp: new Date().toISOString(),
      status: 403,
      error: "Forbidden",
      path: req.originalUrl,
      message: accessDeniedException?.message || "Access denied"
    });
  }
}

new SecurityFilterChain(app)
  .exceptionHandling(ex => ex
    .authenticationEntryPoint(new CustomAuthenticationEntryPoint())
    .accessDeniedHandler(new CustomAccessDeniedHandler())
  )
  .apply();
```

---

### 5. Authentication Engine (PasswordEncoder & UserDetailsService)

Decouple password hashing and user retrieval using Spring's classic interfaces. You are never locked into any specific hashing algorithm—implement `PasswordEncoder` with `bcrypt`, `argon2`, or custom hashing in just 5 lines:

```typescript
import bcrypt from 'bcrypt';
import {
  PasswordEncoder,
  AuthenticationManager,
  InMemoryUserDetailsManager
} from 'express-spring-security';

// 1. Implement PasswordEncoder using your library of choice (e.g. bcrypt, argon2)
class BCryptPasswordEncoder implements PasswordEncoder {
  public async encode(rawPassword: string): Promise<string> {
    return bcrypt.hash(rawPassword, 10);
  }
  public async matches(rawPassword: string, encodedPassword: string): Promise<boolean> {
    return bcrypt.compare(rawPassword, encodedPassword);
  }
}

const passwordEncoder = new BCryptPasswordEncoder();
const hashedPassword = await passwordEncoder.encode("super-secure-password");

// 2. User store (use built-in InMemory for testing, or implement UserDetailsService for your DB)
const userDetailsService = new InMemoryUserDetailsManager([
  {
    id: 1,
    username: "john_doe",
    password: hashedPassword,
    roles: ["USER", "ADMIN"]
  }
]);

// 3. Authenticate and mint signed JWTs
const authManager = new AuthenticationManager(userDetailsService, passwordEncoder, JWT_SECRET, '2h');

// In your login controller:
app.post('/api/login', async (req, res) => {
  try {
    const token = await authManager.authenticate(req.body.username, req.body.password);
    res.json({ token });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});
```

---

### 6. Enterprise Asymmetric Verification (RS256 & JWKS)

`JwtAuthenticationFilter` supports symmetric HMAC secrets, RSA/ECDSA public keys in PEM format, and dynamic JWKS key resolution (for Auth0, Okta, Keycloak, or key rotation):

```typescript
import { JwtAuthenticationFilter, SecurityFilterChain } from 'express-spring-security';
import fs from 'fs';

// --- Option A: Asymmetric RS256 with Public Key PEM ---
new SecurityFilterChain(app)
  .addJwtAuthenticationFilter(new JwtAuthenticationFilter({
    secretOrPublicKey: fs.readFileSync('./public-key.pem'),
    algorithms: ['RS256'],
    issuer: 'https://auth.mycompany.com/',
    audience: 'https://api.mycompany.com'
  }))
  .apply();

// --- Option B: Dynamic JWKS Key Resolver (Auth0 / Okta / Keycloak) ---
new SecurityFilterChain(app)
  .addJwtAuthenticationFilter(new JwtAuthenticationFilter({
    keyResolver: async (header) => {
      // header.kid identifies the active signing key
      const key = await jwksClient.getSigningKey(header.kid);
      return key.getPublicKey();
    },
    algorithms: ['RS256']
  }))
  .apply();

// --- Option C: Classic Symmetric Secret ---
new SecurityFilterChain(app)
  .addJwtAuthenticationFilter(new JwtAuthenticationFilter('my-secret-key'))
  .apply();
```

---

## 📊 Comparison Matrix

| Feature | Express + Passport.js | NestJS Guards | **`express-spring-security`** |
| :--- | :---: | :---: | :---: |
| **Framework Lock-in** | Low (Express) | High (Requires full Nest framework) | **None (Pure Express + TS)** |
| **Ambient Context** | ❌ (Drill `req.user`) | ❌ (Drill `req.user`) | **✅ (`AsyncLocalStorage`)** |
| **URL Path Matchers** | Manual routing | Controller decorators only | **✅ Fluent (`requestMatchers`)** |
| **Ant Path Matching (`**`)** | ❌ (Regex only) | ❌ None | **✅ Native AntPathMatcher** |
| **Method Security** | ❌ None | `@UseGuards()` | **✅ `@PreAuthorize` (Stage 2 & 3)** |
| **Dynamic Ownership** | Manual `if/else` | Custom Guard classes | **✅ Expression predicates** |
| **Custom 401 / 403** | Ad-hoc middleware | Exception filters | **✅ EntryPoint & AccessDeniedHandler** |
| **Asymmetric Keys (RS256 / JWKS)** | Manual setup | Requires passport-jwt strategy | **✅ Built-in (`JwtAuthenticationFilterOptions`)** |
| **Built-in Password Hashing** | ❌ Need bcrypt/argon2 | ❌ Need external packages | **✅ Native ScryptPasswordEncoder** |

---

## 🧪 Testing

The library comes with a 100% in-memory integration test suite verifying URL pattern matchers, decorators, dynamic predicates, and exception handlers:

```bash
npm test
```

---

## 📄 License

ISC © Eyob
