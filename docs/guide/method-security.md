# Method Security (@PreAuthorize)

The `@PreAuthorize` decorator allows you to enforce role-based access control or custom ownership predicates directly on your controller methods.

## Auto-Bound `this` Context

In standard Express, passing an unbound class method directly into a route handler causes Express to lose the class `this` context at runtime.

### ❌ Without `@PreAuthorize` (Standard Express forces manual `.bind`)

```typescript
class UserController {
  private service = new UserService();

  // Plain method (NO decorator):
  public getUsers(req: Request, res: Response) {
    this.service.findAll(); // Needs `this` to access class properties
  }
}

const controller = new UserController();

// ❌ If you pass the method directly, `this` is undefined inside getUsers and crashes!
app.get('/users', controller.getUsers);

// 😩 Standard Express FORCES you to manually bind every route:
app.get('/users', controller.getUsers.bind(controller));
// or wrap in an arrow function:
app.get('/users', (req, res) => controller.getUsers(req, res));
```

---

### ✅ With `@PreAuthorize` (Automatic Binding)

When you decorate a controller method with `@PreAuthorize`, the decorator **automatically binds `this` to the instance** under the hood. You no longer need manual `.bind()` or arrow wrappers:

```typescript
class UserController {
  private service = new UserService();

  @PreAuthorize('USER') // 👈 Automatically binds `this` to the instance!
  public getUsers(req: Request, res: Response) {
    this.service.findAll(); // ✅ `this` is always preserved!
  }
}

const controller = new UserController();

// 🚀 Clean & natural route registration (no .bind needed!):
app.get('/users', controller.getUsers);
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
