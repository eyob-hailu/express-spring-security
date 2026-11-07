# SecurityFilterChain Pipeline

The `SecurityFilterChain` is the core orchestrator of your application's security. It guarantees that security middleware executes in strict, secure order before any request reaches your route handlers.

## Execution Order

When you call `.apply()`, the filter chain installs middleware in the following sequence:

```
1. SecurityContextHolder.initialize()  (Creates AsyncLocalStorage scope)
2. Pre-Filters                         (CORS, express.json, Helmet)
3. JwtAuthenticationFilter             (Extracts & validates JWT, populates context)
4. AuthorizeHttpRequestsConfigurer     (Evaluates Ant path matching rules)
5. Route Handlers & Controllers        (Invokes controller methods & @PreAuthorize)
```

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
