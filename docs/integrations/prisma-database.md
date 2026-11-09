# Database RBAC with Prisma

This guide demonstrates how to connect your SQL database (PostgreSQL, MySQL, SQLite) to **Express Spring Security** using **Prisma ORM**.

## 1. Implement `UserDetailsService`

Create a service that implements the `UserDetailsService` contract:

```typescript
// src/services/PrismaUserDetailsService.ts
import { UserDetailsService, UserDetails } from 'express-spring-security';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PrismaUserDetailsService implements UserDetailsService {
  public async loadUserByUsername(username: string): Promise<UserDetails | null> {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: true // Many-to-many relationship
      }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      password: user.passwordHash,
      roles: user.roles.map(r => r.name) // e.g. ['USER', 'ADMIN']
    };
  }
}
```

## 2. Implement `PasswordEncoder` with `bcrypt`

```typescript
// src/security/BCryptPasswordEncoder.ts
import bcrypt from 'bcrypt';
import { PasswordEncoder } from 'express-spring-security';

export class BCryptPasswordEncoder implements PasswordEncoder {
  public async encode(rawPassword: string): Promise<string> {
    return bcrypt.hash(rawPassword, 10);
  }

  public async matches(rawPassword: string, encodedPassword: string): Promise<boolean> {
    return bcrypt.compare(rawPassword, encodedPassword);
  }
}
```

## 3. Login Controller & Authentication

```typescript
// src/controllers/AuthController.ts
import { Request, Response } from 'express';
import { AuthenticationManager } from 'express-spring-security';
import { PrismaUserDetailsService } from '../services/PrismaUserDetailsService';
import { BCryptPasswordEncoder } from '../security/BCryptPasswordEncoder';

const userDetailsService = new PrismaUserDetailsService();
const passwordEncoder = new BCryptPasswordEncoder();
const authManager = new AuthenticationManager(
  userDetailsService,
  passwordEncoder,
  process.env.JWT_SECRET!,
  '2h' // Token validity
);

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    const token = await authManager.authenticate(username, password);
    res.json({ token });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid username or password' });
  }
}
```
