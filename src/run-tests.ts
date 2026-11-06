// src/run-tests.ts
import { EventEmitter } from 'events';
import { generateKeyPairSync } from 'crypto';
import * as jwt from 'jsonwebtoken';
import express, { Request, Response } from 'express';

import {
  app,
  SECRET_KEY
} from './test';

import {
  PasswordEncoder,
  InMemoryUserDetailsManager,
  AuthenticationManager,
  JwtAuthenticationFilter,
  SecurityFilterChain,
  SecurityContextHolder,
  hasRole,
  hasAnyRole,
  authenticated,
  authorize
} from './index';

// Custom implementation of PasswordEncoder for testing
class TestPasswordEncoder implements PasswordEncoder {
  public async encode(rawPassword: string): Promise<string> {
    return `hashed_${rawPassword}`;
  }
  public async matches(rawPassword: string, encodedPassword: string): Promise<boolean> {
    return encodedPassword === `hashed_${rawPassword}`;
  }
}

// ==========================================
// Test Tokens & RSA Keys
// ==========================================
const userToken = jwt.sign(
  { id: 1, username: 'eyob', roles: ['USER'] },
  SECRET_KEY,
  { expiresIn: '1h' }
);

const otherUserToken = jwt.sign(
  { id: 99, username: 'other', roles: ['USER'] },
  SECRET_KEY,
  { expiresIn: '1h' }
);

const adminToken = jwt.sign(
  { id: 2, username: 'boss', roles: ['ADMIN'] },
  SECRET_KEY,
  { expiresIn: '1h' }
);

const expiredToken = jwt.sign(
  { id: 3, username: 'expired', roles: ['USER'] },
  SECRET_KEY,
  { expiresIn: '-10s' }
);

// Generate RSA Keypair for Asymmetric Testing (RS256)
const { publicKey: rsaPublicKeyPem, privateKey: rsaPrivateKeyPem } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const rsaValidToken = jwt.sign(
  { id: 777, username: 'enterprise_user', roles: ['ADMIN'] },
  rsaPrivateKeyPem,
  { algorithm: 'RS256', expiresIn: '1h', keyid: 'key-2026-v1' }
);

function simulateRequest(
  targetApp: any,
  method: string,
  path: string,
  token?: string
): Promise<{ status: number; body: any }> {
  return new Promise((resolve) => {
    const headers: Record<string, string> = {
      host: 'localhost'
    };
    if (token) {
      headers['authorization'] = `Bearer ${token}`;
    }

    const req: any = new EventEmitter();
    req.method = method;
    req.url = path;
    req.originalUrl = path;
    req.path = path.split('?')[0];
    req.headers = headers;
    req.get = (h: string) => headers[h.toLowerCase()];
    req.header = req.get;

    let statusCode = 200;
    const responseHeaders: Record<string, string> = {};

    const res: any = new EventEmitter();
    res.statusCode = statusCode;
    res.status = (code: number) => {
      statusCode = code;
      res.statusCode = code;
      return res;
    };
    res.setHeader = (name: string, value: string) => {
      responseHeaders[name.toLowerCase()] = value;
      return res;
    };
    res.getHeader = (name: string) => responseHeaders[name.toLowerCase()];

    res.json = (data: any) => {
      resolve({ status: statusCode, body: data });
      return res;
    };

    res.send = (data: any) => {
      let parsed = data;
      try {
        parsed = JSON.parse(data);
      } catch {}
      resolve({ status: statusCode, body: parsed });
      return res;
    };

    res.end = (chunk?: any) => {
      if (chunk) {
        let parsed = chunk;
        try {
          parsed = JSON.parse(chunk.toString());
        } catch {}
        resolve({ status: statusCode, body: parsed });
      } else {
        resolve({ status: statusCode, body: null });
      }
      return res;
    };

    targetApp.handle(req, res);
  });
}

async function run() {
  console.log('\n🧪 Running express-spring-security Test Suite...\n');
  let passedCount = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, extra?: any) {
    totalTests++;
    if (condition) {
      passedCount++;
      console.log(`✅ PASS: ${testName}`);
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (extra) console.error('   Details:', extra);
    }
  }

  // ==========================================
  // Unit Tests: PasswordEncoder Interface & Custom Implementation
  // ==========================================
  const encoder: PasswordEncoder = new TestPasswordEncoder();
  const rawPw = 'SuperSecret123!';
  const hash = await encoder.encode(rawPw);
  const isValid = await encoder.matches(rawPw, hash);
  const isInvalid = await encoder.matches('WrongPassword', hash);
  assert(isValid && !isInvalid, '1. [PasswordEncoder Interface] Custom implementation encodes and matches correctly');

  // ==========================================
  // Unit Tests: InMemoryUserDetailsManager & AuthenticationManager
  // ==========================================
  const userManager = new InMemoryUserDetailsManager([
    { id: 10, username: 'alice', password: hash, roles: ['USER'] }
  ]);
  const loadedUser = await userManager.loadUserByUsername('alice');
  assert(loadedUser?.username === 'alice', '2. [InMemoryUserDetailsManager] Load user by username');

  const authManager = new AuthenticationManager(userManager, encoder, SECRET_KEY, '1h');
  const mintedToken = await authManager.authenticate('alice', rawPw);
  const decodedMinted: any = jwt.verify(mintedToken, SECRET_KEY);
  assert(decodedMinted.username === 'alice' && decodedMinted.roles.includes('USER'), '3. [AuthenticationManager] Authenticate credentials & issue JWT');

  let failedAuth = false;
  try {
    await authManager.authenticate('alice', 'WrongPw');
  } catch {
    failedAuth = true;
  }
  assert(failedAuth, '4. [AuthenticationManager] Reject invalid password');

  // ==========================================
  // Integration Tests: Functional Middleware
  // ==========================================
  const fnApp = express();
  fnApp.use(SecurityContextHolder.initialize());
  fnApp.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded: any = jwt.verify(authHeader.substring(7), SECRET_KEY);
      SecurityContextHolder.setContext({
        isAuthenticated: true,
        user: { id: decoded.id, username: decoded.username, roles: decoded.roles },
        token: authHeader.substring(7)
      });
    }
    next();
  });
  fnApp.get('/fn/admin', hasRole('ADMIN'), (req, res) => res.json({ ok: true }));
  fnApp.get('/fn/user', hasAnyRole('USER', 'ADMIN'), (req, res) => res.json({ ok: true }));
  fnApp.get('/fn/auth', authenticated(), (req, res) => res.json({ ok: true }));
  fnApp.get('/fn/owner/:id', authorize((auth, req) => auth.user?.id === Number(req.params.id)), (req, res) => res.json({ ok: true }));

  const resFn1 = await simulateRequest(fnApp, 'GET', '/fn/admin', userToken);
  assert(resFn1.status === 403, '5. [Functional Middleware] hasRole("ADMIN") blocks USER with 403');

  const resFn2 = await simulateRequest(fnApp, 'GET', '/fn/admin', adminToken);
  assert(resFn2.status === 200, '6. [Functional Middleware] hasRole("ADMIN") allows ADMIN with 200');

  const resFn3 = await simulateRequest(fnApp, 'GET', '/fn/auth');
  assert(resFn3.status === 401, '7. [Functional Middleware] authenticated() blocks unauthenticated with 401');

  const resFn4 = await simulateRequest(fnApp, 'GET', '/fn/owner/1', userToken);
  assert(resFn4.status === 200, '8. [Functional Middleware] authorize() custom predicate matches ID');

  const resFn5 = await simulateRequest(fnApp, 'GET', '/fn/owner/99', userToken);
  assert(resFn5.status === 403, '9. [Functional Middleware] authorize() custom predicate denies mismatched ID');

  // ==========================================
  // Integration Tests: Asymmetric RS256 Verification & JWKS KeyResolver
  // ==========================================
  const rsaApp = express();
  new SecurityFilterChain(rsaApp)
    .addJwtAuthenticationFilter(new JwtAuthenticationFilter({
      secretOrPublicKey: rsaPublicKeyPem,
      algorithms: ['RS256']
    }))
    .authorizeHttpRequests(auth => auth
      .requestMatchers('/enterprise/admin/**').hasRole('ADMIN')
      .anyRequest().authenticated()
    )
    .apply();

  rsaApp.get('/enterprise/admin/resource', (req, res) => {
    const user = SecurityContextHolder.getContext().user;
    res.json({ message: `Access granted to RS256 enterprise user: ${user?.username}` });
  });

  const resRsa1 = await simulateRequest(rsaApp, 'GET', '/enterprise/admin/resource', rsaValidToken);
  assert(resRsa1.status === 200, '10. [Asymmetric RS256] Verify token signed with RSA private key against public PEM');

  // Tampered token test with RS256
  const tamperedToken = rsaValidToken.slice(0, -6) + 'abcdef';
  const resRsa2 = await simulateRequest(rsaApp, 'GET', '/enterprise/admin/resource', tamperedToken);
  assert(resRsa2.status === 401, '11. [Asymmetric RS256] Reject tampered signature with 401');

  // Dynamic KeyResolver (JWKS simulation)
  const jwksApp = express();
  const jwksKeyStore: Record<string, string> = {
    'key-2026-v1': rsaPublicKeyPem
  };

  new SecurityFilterChain(jwksApp)
    .addJwtAuthenticationFilter(new JwtAuthenticationFilter({
      keyResolver: async (header) => {
        const kid = header.kid;
        if (!kid || !jwksKeyStore[kid]) {
          throw new Error(`Unknown key ID: ${kid}`);
        }
        return jwksKeyStore[kid];
      },
      algorithms: ['RS256']
    }))
    .authorizeHttpRequests(auth => auth
      .anyRequest().authenticated()
    )
    .apply();

  jwksApp.get('/jwks/protected', (req, res) => {
    res.json({ ok: true, user: SecurityContextHolder.getContext().user?.username });
  });

  const resJwks1 = await simulateRequest(jwksApp, 'GET', '/jwks/protected', rsaValidToken);
  assert(resJwks1.status === 200, '12. [JWKS KeyResolver] Dynamically resolve signing key by header.kid');

  // Unknown kid test
  const unknownKidToken = jwt.sign({ id: 888 }, rsaPrivateKeyPem, { algorithm: 'RS256', keyid: 'non-existent-kid' });
  const resJwks2 = await simulateRequest(jwksApp, 'GET', '/jwks/protected', unknownKidToken);
  assert(resJwks2.status === 401, '13. [JWKS KeyResolver] Reject unknown key ID with 401');

  // ==========================================
  // Integration Tests: SecurityFilterChain (URL Matchers & Decorators)
  // ==========================================
  const testCases = [
    {
      name: '14. [requestMatchers permitAll] Anonymous access to /api/public/info -> 200 OK',
      method: 'GET',
      path: '/api/public/info',
      token: undefined,
      expectedStatus: 200
    },
    {
      name: '15. [requestMatchers permitAll] Anonymous access to /api/auth/status -> 200 OK',
      method: 'GET',
      path: '/api/auth/status',
      token: undefined,
      expectedStatus: 200
    },
    {
      name: '16. [requestMatchers hasRole ADMIN] Anonymous access to /api/admin/system-stats -> 401 Unauthorized',
      method: 'GET',
      path: '/api/admin/system-stats',
      token: undefined,
      expectedStatus: 401
    },
    {
      name: '17. [requestMatchers hasRole ADMIN] User access to /api/admin/system-stats -> 403 Forbidden',
      method: 'GET',
      path: '/api/admin/system-stats',
      token: userToken,
      expectedStatus: 403
    },
    {
      name: '18. [requestMatchers hasRole ADMIN] Admin access to /api/admin/system-stats -> 200 OK',
      method: 'GET',
      path: '/api/admin/system-stats',
      token: adminToken,
      expectedStatus: 200
    },
    {
      name: '19. [Method Security] User access to @PreAuthorize("USER") /api/user -> 200 OK',
      method: 'GET',
      path: '/api/user',
      token: userToken,
      expectedStatus: 200
    },
    {
      name: '20. [Method Security] User access to @PreAuthorize("ADMIN") /api/admin -> 403 Forbidden',
      method: 'GET',
      path: '/api/admin',
      token: userToken,
      expectedStatus: 403
    },
    {
      name: '21. [Method Security] Admin access to @PreAuthorize("ADMIN") /api/admin -> 200 OK',
      method: 'GET',
      path: '/api/admin',
      token: adminToken,
      expectedStatus: 200
    },
    {
      name: '22. [Dynamic Predicate] User (id: 1) access to /api/profile/1 -> 200 OK',
      method: 'GET',
      path: '/api/profile/1',
      token: userToken,
      expectedStatus: 200
    },
    {
      name: '23. [Dynamic Predicate] User (id: 99) access to /api/profile/1 -> 403 Forbidden',
      method: 'GET',
      path: '/api/profile/1',
      token: otherUserToken,
      expectedStatus: 403
    },
    {
      name: '24. [Dynamic Predicate] Admin access to /api/profile/1 -> 200 OK (admin override)',
      method: 'GET',
      path: '/api/profile/1',
      token: adminToken,
      expectedStatus: 200
    },
    {
      name: '25. [JWT Filter EntryPoint] Expired token access -> 401 Unauthorized via CustomEntryPoint',
      method: 'GET',
      path: '/api/user',
      token: expiredToken,
      expectedStatus: 401
    },
    {
      name: '26. [anyRequest().authenticated()] Authenticated access to catchall -> 200 OK',
      method: 'GET',
      path: '/api/catchall-protected',
      token: userToken,
      expectedStatus: 200
    },
    {
      name: '27. [anyRequest().authenticated()] Anonymous access to catchall -> 401 Unauthorized',
      method: 'GET',
      path: '/api/catchall-protected',
      token: undefined,
      expectedStatus: 401
    }
  ];

  for (const tc of testCases) {
    const res = await simulateRequest(app, tc.method, tc.path, tc.token);
    assert(res.status === tc.expectedStatus, tc.name, { expected: tc.expectedStatus, actual: res.status, body: res.body });
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passedCount}/${totalTests} tests passed.`);
  console.log(`========================================\n`);

  if (passedCount !== totalTests) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
