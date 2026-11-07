# Recipe: Testing Protected Endpoints

This recipe shows how to write clean integration tests for your Express controllers with tools like `supertest`, `vitest`, or `jest`.

## 1. Helper: Minting Test Tokens

```typescript
// test/test-utils.ts
import * as jwt from 'jsonwebtoken';

const TEST_SECRET = 'my-super-secret-test-key';

export function createTestToken(payload: { id: number; username: string; roles: string[] }): string {
  return jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });
}
```

## 2. Testing Role-Based Endpoints

```typescript
// test/admin.test.ts
import request from 'supertest';
import { app } from '../src/app';
import { createTestToken } from './test-utils';

describe('Admin Endpoints', () => {
  it('should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/metrics');
    expect(res.status).toBe(401);
  });

  it('should reject non-admin users with 403 Forbidden', async () => {
    const userToken = createTestToken({ id: 1, username: 'john', roles: ['USER'] });
    const res = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow admin users with 200 OK', async () => {
    const adminToken = createTestToken({ id: 2, username: 'boss', roles: ['ADMIN'] });
    const res = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
```
