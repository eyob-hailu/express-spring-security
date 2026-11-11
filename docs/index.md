---
layout: home

hero:
  name: "Express Spring Security"
  text: "Enterprise Spring Security 6 for Express & TypeScript"
  tagline: "Enterprise-grade authentication, fluent URL authorization, and declarative method security for modern Node.js."
  image:
    src: /logo.jpg
    alt: Express Spring Security Logo
  actions:
    - theme: brand
      text: Get Started (5 Mins) →
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub ★
      link: https://github.com/eyob-hailu/express-spring-security

features:
  - icon: 🔒
    title: Fluent Security Filter Chain
    details: Declarative URL authorization with Ant-style path matchers, HTTP method filtering, and first-match-wins semantics matching Spring Security 6.
  - icon: 🧵
    title: Ambient Context (SecurityContextHolder)
    details: ThreadLocal-style request context powered by Node native AsyncLocalStorage. Access the authenticated user anywhere without drilling req.
  - icon: 🛡️
    title: Universal @PreAuthorize
    details: Method-level security compatible with both Stage 2 (legacy) and Stage 3 (TC39 TS 5+) decorators with automatic this binding and dynamic predicates.
  - icon: 🚦
    title: Pluggable 401 & 403 Handlers
    details: Clean separation of concerns between AuthenticationEntryPoint (401 Unauthorized) and AccessDeniedHandler (403 Forbidden).
  - icon: 🔑
    title: Pluggable PasswordEncoder
    details: Unopinionated contract (encode & matches). Zero forced hashing dependencies—use bcrypt, argon2, or your preferred library.
  - icon: 🏢
    title: Enterprise Asymmetric JWT & JWKS
    details: Supports symmetric HMAC secrets (HS256), RSA/ECDSA public PEM keys (RS256, ES256), and dynamic JWKS key resolvers for Auth0, Okta, and Keycloak.
---

<div style="text-align: center; margin-top: 48px; margin-bottom: 36px;">
  <p style="font-size: 1.1rem; color: var(--vp-c-text-2);">
    Zero Framework Lock-in • Works with Express 5.x • Pure TypeScript 5.0+
  </p>
</div>
