# Quick Start (5 Minutes)

Get up and running with **Express Spring Security** in under 5 minutes.

## 1. Installation

Install the library along with standard JWT and CORS dependencies:

```bash
npm install express-spring-security jsonwebtoken cors
npm install -D @types/jsonwebtoken @types/cors
```

## 2. Complete Runnable Example

Create an `index.ts` file with the following code:

```typescript
import express, { Request, Response } from 'express';
import {
  SecurityFilterChain,
  JwtAuthenticationFilter,
  SecurityContextHolder,
  PreAuthorize
} from 'express-spring-security';

const app = express();
const JWT_SECRET = 'your-256-bit-secret-key-goes-here';

// 1. Controller with Method Security
class UserController {
  public getPublicData(req: Request, res: Response) {
    res.json({ message: 'Public data open to everyone' });
  }

  @PreAuthorize('USER')
  public getUserProfile(req: Request, res: Response) {
    const auth = SecurityContextHolder.getContext();
    res.json({ message: `Hello ${auth.user?.username}!`, user: auth.user });
  }

  @PreAuthorize('ADMIN')
  public getAdminStats(req: Request, res: Response) {
    res.json({ cpu: '12%', memory: '48%' });
  }
}

// 2. Configure Security Pipeline (BEFORE route handlers)
new SecurityFilterChain(app)
  .cors()
  .addPreFilter(express.json())
  .addJwtAuthenticationFilter(new JwtAuthenticationFilter(JWT_SECRET))
  .authorizeHttpRequests(auth => auth
    // Public paths
    .requestMatchers('/api/public/**', '/api/auth/**').permitAll()
    // Role-based paths
    .requestMatchers('/api/admin/**').hasRole('ADMIN')
    .requestMatchers('/api/user/**').hasAnyRole('USER', 'ADMIN')
    // Catch-all: require authentication for any unmatched endpoint
    .anyRequest().authenticated()
  )
  .apply();

// 3. Register Routes
const controller = new UserController();
app.get('/api/public/info', controller.getPublicData);
app.get('/api/user/profile', controller.getUserProfile);
app.get('/api/admin/metrics', controller.getAdminStats);

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
```

## 3. TypeScript Configuration

Ensure your `tsconfig.json` contains:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "strict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true
  }
}
```

> **Note:** If you are using modern TypeScript 5.0+ TC39 standard decorators without `experimentalDecorators`, `@PreAuthorize` will automatically detect the Stage 3 context and work without requiring `experimentalDecorators`.
