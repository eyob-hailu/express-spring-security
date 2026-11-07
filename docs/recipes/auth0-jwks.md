# Recipe: Enterprise JWKS (Auth0 / Okta / Keycloak)

This recipe demonstrates how to verify JWTs issued by cloud Identity Providers (IDPs) using dynamic JSON Web Key Sets (JWKS) with automatic key rotation.

## 1. Install JWKS Client

```bash
npm install jwks-rsa
npm install -D @types/jwks-rsa
```

## 2. Configure `JwtAuthenticationFilter` with `keyResolver`

```typescript
import jwksClient from 'jwks-rsa';
import { SecurityFilterChain, JwtAuthenticationFilter } from 'express-spring-security';

const client = jwksClient({
  jwksUri: 'https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json',
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

new SecurityFilterChain(app)
  .addJwtAuthenticationFilter(new JwtAuthenticationFilter({
    // Dynamically resolve public key using the token header's `kid` (Key ID)
    keyResolver: async (header) => {
      if (!header.kid) {
        throw new Error('JWT header missing key ID (kid)');
      }
      const key = await client.getSigningKey(header.kid);
      return key.getPublicKey();
    },
    algorithms: ['RS256'],
    issuer: 'https://YOUR_DOMAIN.auth0.com/',
    audience: 'https://api.mycompany.com'
  }))
  .authorizeHttpRequests(auth => auth
    .requestMatchers('/api/public/**').permitAll()
    .requestMatchers('/api/admin/**').hasRole('ADMIN')
    .anyRequest().authenticated()
  )
  .apply();
```
