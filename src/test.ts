// src/test.ts
import express, { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

import {
  SecurityFilterChain,
  JwtAuthenticationFilter,
  SecurityContextHolder,
  PreAuthorize,
  AuthenticationEntryPoint,
  AccessDeniedHandler
} from './index';

const app = express();
const SECRET_KEY = 'my-super-secret-test-key';

// ========================================================
// 1. Custom Exception Handlers (Spring-style)
// ========================================================
class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
  public commence(req: Request, res: Response, authException?: Error): void {
    res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      path: req.originalUrl || req.url,
      timestamp: new Date().toISOString(),
      message: authException?.message || 'Full authentication required'
    });
  }
}

class CustomAccessDeniedHandler implements AccessDeniedHandler {
  public handle(req: Request, res: Response, accessDeniedException?: Error): void {
    res.status(403).json({
      status: 403,
      error: 'Forbidden',
      path: req.originalUrl || req.url,
      timestamp: new Date().toISOString(),
      message: accessDeniedException?.message || 'Access Denied: Insufficient permissions'
    });
  }
}

// ========================================================
// 2. Controller Demonstrating @PreAuthorize (Stage 2 & Stage 3 Compatible)
// ========================================================
class TestController {
  // Public endpoint
  public getPublicData(req: Request, res: Response) {
    res.json({ message: 'Success: Anyone can see this!' });
  }

  // Method security: requires USER role
  @PreAuthorize('USER')
  public getUserData(req: Request, res: Response) {
    const user = SecurityContextHolder.getContext().user;
    res.json({ message: `Success: Welcome back, ${user?.username}!` });
  }

  // Method security: requires ADMIN role
  @PreAuthorize('ADMIN')
  public getAdminData(req: Request, res: Response) {
    res.json({ message: 'Success: Admin access granted!' });
  }

  // Dynamic Predicate: Only owner or admin can access
  @PreAuthorize((auth, req) => {
    return auth.user?.roles.includes('ADMIN') || String(auth.user?.id) === String(req.params.id);
  })
  public getUserProfile(req: Request, res: Response) {
    res.json({ message: `Success: Access granted to profile ${req.params.id}` });
  }
}

// ========================================================
// 3. SecurityFilterChain Configuration (URL Matchers + Handlers)
// ========================================================
new SecurityFilterChain(app)
  .cors()
  .addPreFilter(express.json())
  .addJwtAuthenticationFilter(new JwtAuthenticationFilter(SECRET_KEY))
  .authorizeHttpRequests(auth => auth
    // Public paths: permitAll
    .requestMatchers('/api/public/**', '/api/auth/**').permitAll()
    // Admin paths: hasRole('ADMIN')
    .requestMatchers('/api/admin/**').hasRole('ADMIN')
    // Role-based matching
    .requestMatchers('/api/user/**').hasAnyRole('USER', 'ADMIN')
    // Method-specific matching
    .requestMatchers('POST', '/api/data').hasRole('ADMIN')
    // Any other request requires authentication
    .anyRequest().authenticated()
  )
  .exceptionHandling(ex => ex
    .authenticationEntryPoint(new CustomAuthenticationEntryPoint())
    .accessDeniedHandler(new CustomAccessDeniedHandler())
  )
  .apply();

// ========================================================
// 4. Register Routes
// ========================================================
const controller = new TestController();

// Controller routes (demonstrating method security)
app.get('/api/public', controller.getPublicData.bind(controller));
app.get('/api/user', controller.getUserData);
app.get('/api/admin', controller.getAdminData);
app.get('/api/profile/:id', controller.getUserProfile);

// Functional routes (protected purely by URL-level requestMatchers in SecurityFilterChain!)
app.get('/api/public/info', (req: Request, res: Response) => {
  res.json({ message: 'Open info page' });
});

app.get('/api/auth/status', (req: Request, res: Response) => {
  res.json({ message: 'Auth service is online' });
});

app.get('/api/admin/system-stats', (req: Request, res: Response) => {
  res.json({ stats: 'CPU: 12%, Memory: 45%' });
});

app.get('/api/user/dashboard', (req: Request, res: Response) => {
  const user = SecurityContextHolder.getContext().user;
  res.json({ dashboard: `Dashboard for ${user?.username}` });
});

app.get('/api/catchall-protected', (req: Request, res: Response) => {
  res.json({ message: 'Catchall matched: You are authenticated!' });
});

// ========================================================
// 5. Start Server or Export App for Testing
// ========================================================
export { app, SECRET_KEY };

if (require.main === module) {
  const server = app.listen(3000, () => {
    const userToken = jwt.sign(
      { id: 1, username: 'eyob', roles: ['USER'] },
      SECRET_KEY,
      { expiresIn: '1h' }
    );
    const adminToken = jwt.sign(
      { id: 2, username: 'boss', roles: ['ADMIN'] },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    console.log('🚀 Spring-Express Security Server running on http://localhost:3000');
    console.log('\n--- SAMPLE TOKENS ---');
    console.log('USER TOKEN:\n' + userToken + '\n');
    console.log('ADMIN TOKEN:\n' + adminToken + '\n');
  });
}
