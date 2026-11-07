# Method Security (@PreAuthorize)

The `@PreAuthorize` decorator allows you to enforce role-based access control or custom ownership predicates directly on your controller methods.

## Auto-Bound `this` Context

In standard Express, passing a class method as a route handler causes Express to lose the class `this` context:

```typescript
// Standard Express loses `this`:
app.get('/users', controller.getUsers); // ❌ `this` is undefined inside getUsers!
```

`@PreAuthorize` automatically binds `this` to the controller instance, allowing clean route registration:

```typescript
// With @PreAuthorize:
app.get('/users', controller.getUsers); // ✅ `this` is preserved automatically!
```

---

## 1. Single & Multiple Role Checks

```typescript
import { Request, Response } from 'express';
import { PreAuthorize, SecurityContextHolder } from 'express-spring-security';

export class AdminController {
  // Requires 'ADMIN' role
  @PreAuthorize('ADMIN')
  public getSystemMetrics(req: Request, res: Response) {
    res.json({ cpu: '12%', memory: '48%' });
  }

  // Requires either 'ADMIN' or 'SUPER_ADMIN'
  @PreAuthorize(['ADMIN', 'SUPER_ADMIN'])
  public purgeDatabase(req: Request, res: Response) {
    res.json({ status: 'Purged' });
  }
}
```

---

## 2. Dynamic Expression Predicates (SpEL Alternative)

For resource ownership checks (e.g. *"Only an ADMIN or the author can edit a post"*), pass a predicate function `(auth, req) => boolean | Promise<boolean>`:

```typescript
export class ArticleController {
  @PreAuthorize((auth, req) => {
    const isOwner = String(auth.user?.id) === String(req.body.authorId);
    const isAdmin = auth.user?.roles.includes('ADMIN');
    return isOwner || isAdmin;
  })
  public updateArticle(req: Request, res: Response) {
    res.json({ message: 'Article updated' });
  }
}
```

---

## 3. Decorator Compatibility (Stage 2 & Stage 3)

`@PreAuthorize` is universally compatible with both:
1. **Stage 2 Legacy Decorators** (`experimentalDecorators: true` in `tsconfig.json`)
2. **Stage 3 Modern TC39 Decorators** (TypeScript 5.0+ standard decorators)
