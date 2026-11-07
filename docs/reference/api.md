# API Reference

Complete reference of all exported classes, interfaces, decorators, and functions from `express-spring-security`.

## Core Engine

### `SecurityFilterChain`
Main builder class for orchestrating the Express security pipeline.
* `.cors(options?: cors.CorsOptions): this`
* `.addPreFilter(filter: RequestHandler): this`
* `.addJwtAuthenticationFilter(filter: JwtAuthenticationFilter): this`
* `.authorizeHttpRequests(configurer: (auth: AuthorizeHttpRequestsConfigurer) => void): this`
* `.exceptionHandling(configurer: (ex: ExceptionHandlingConfigurer) => void): this`
* `.authenticationEntryPoint(entryPoint: AuthenticationEntryPoint): this`
* `.accessDeniedHandler(handler: AccessDeniedHandler): this`
* `.apply(): void`

### `SecurityContextHolder`
Static manager for ambient request context backed by `AsyncLocalStorage`.
* `SecurityContextHolder.initialize(): RequestHandler`
* `SecurityContextHolder.getContext(): Authentication`
* `SecurityContextHolder.setContext(auth: Authentication): void`
* `SecurityContextHolder.clearContext(): void`

### `JwtAuthenticationFilter`
Express middleware that intercepts requests, extracts Bearer JWT tokens, verifies signatures, and sets context.
* Constructor: `new JwtAuthenticationFilter(secretOrOptions, entryPoint?)`
* Options: `JwtAuthenticationFilterOptions`
  * `secretOrPublicKey`: string | Buffer
  * `keyResolver`: `(header: JwtHeader) => Promise<string | Buffer>`
  * `algorithms`: `Algorithm[]`
  * `issuer`: string | string[]
  * `audience`: string | RegExp | Array<string | RegExp>
  * `entryPoint`: `AuthenticationEntryPoint`

---

## Method Security

### `@PreAuthorize(allowed, options?)`
Universal decorator supporting Stage 2 and Stage 3 decorators with automatic `this` binding.
* `allowed`: `string | string[] | PreAuthorizePredicate`
* `PreAuthorizePredicate`: `(auth: Authentication, req: Request) => boolean | Promise<boolean>`

---

## Functional Route Middleware

* `authenticated(): RequestHandler` — Requires an authenticated user.
* `hasRole(role: string): RequestHandler` — Requires a specific role.
* `hasAnyRole(...roles: string[]): RequestHandler` — Requires at least one of the roles.
* `authorize(predicate: FunctionalPredicate): RequestHandler` — Custom predicate.

---

## Authentication Engine

### `PasswordEncoder`
Pluggable hashing contract.
* `encode(rawPassword: string): Promise<string>`
* `matches(rawPassword: string, encodedPassword: string): Promise<boolean>`

### `UserDetailsService`
Interface for locating users.
* `loadUserByUsername(username: string): Promise<UserDetails | null>`

### `InMemoryUserDetailsManager`
In-memory implementation of `UserDetailsService` for prototyping.
* `createUser(user: SecurityUser): void`
* `updateUser(user: SecurityUser): void`
* `deleteUser(username: string): void`
* `userExists(username: string): boolean`

### `AuthenticationManager`
Authenticates credentials and mints signed JWT tokens.
* Constructor: `(userDetailsService, passwordEncoder, jwtSecret, expiresIn?)`
* `authenticate(username: string, rawPassword: string): Promise<string>`
