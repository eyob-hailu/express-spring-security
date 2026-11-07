# SecurityContextHolder (Ambient Context)

In traditional Express applications, the authenticated user is attached to `req.user`. To read the user in a deep service layer or repository, you have to pass `req` through every function argument:

```typescript
// ❌ The Old Way: Parameter drilling
async function createOrder(req: Request, items: string[]) {
  const userId = req.user.id;
  await orderRepository.save(userId, items);
}
```

## The Spring Security Way

`SecurityContextHolder` utilizes Node's native `AsyncLocalStorage` (the JavaScript equivalent of Java's `ThreadLocal`). It provides an ambient context bubble for the entire lifecycle of an HTTP request:

```typescript
// ✅ The Express Spring Security Way: Clean domain layer
import { SecurityContextHolder } from 'express-spring-security';

export class OrderService {
  public async createOrder(items: string[]) {
    // Access the current user from anywhere in the async call stack!
    const auth = SecurityContextHolder.getContext();
    const currentUser = auth.user;

    console.log(`Order created by ${currentUser?.username} (ID: ${currentUser?.id})`);
    return db.order.create({ data: { userId: currentUser?.id, items } });
  }
}
```

## API Methods

* `SecurityContextHolder.getContext()`: Returns the current `Authentication` object (`{ isAuthenticated: boolean, user: UserDetails | null, token?: string }`).
* `SecurityContextHolder.setContext(auth)`: Updates the current request's context (used by authentication filters).
* `SecurityContextHolder.clearContext()`: Resets the context to unauthenticated (useful for logout routes or error boundaries).

## Is `AsyncLocalStorage` Safe for Production?

Yes. `AsyncLocalStorage` has been a stable, core Node.js API since v12.17.0 and is heavily optimized in modern V8 engines (Node 18+). It provides thread-safe context propagation across asynchronous boundaries without memory leaks, and is the same mechanism powering OpenTelemetry, Datadog APM, and Fastify request tracking.
