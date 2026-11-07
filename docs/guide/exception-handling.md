# Exception Handling (401 vs 403)

In enterprise APIs, compliance frameworks (like RFC 7807 Problem Details) require consistent error payloads. Express Spring Security strictly separates:

* **`AuthenticationEntryPoint` (401 Unauthorized):** Invoked when a request is missing credentials or when the JWT token is expired, untrusted, or malformed.
* **`AccessDeniedHandler` (403 Forbidden):** Invoked when the user is authenticated, but does not possess the required roles or permissions.

## Custom Handlers Example

```typescript
import { Request, Response } from 'express';
import {
  SecurityFilterChain,
  AuthenticationEntryPoint,
  AccessDeniedHandler
} from 'express-spring-security';

export class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
  public commence(req: Request, res: Response, authException?: Error): void {
    res.status(401).json({
      type: 'https://example.com/errors/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail: authException?.message || 'Authentication credentials required',
      instance: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  }
}

export class CustomAccessDeniedHandler implements AccessDeniedHandler {
  public handle(req: Request, res: Response, accessDeniedException?: Error): void {
    res.status(403).json({
      type: 'https://example.com/errors/forbidden',
      title: 'Forbidden',
      status: 403,
      detail: accessDeniedException?.message || 'Insufficient permissions',
      instance: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  }
}

// Register in SecurityFilterChain:
new SecurityFilterChain(app)
  .exceptionHandling(ex => ex
    .authenticationEntryPoint(new CustomAuthenticationEntryPoint())
    .accessDeniedHandler(new CustomAccessDeniedHandler())
  )
  .apply();
```
