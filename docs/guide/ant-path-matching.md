# Ant Path Matching

`AntPathMatcher` mirrors Spring Framework's path-matching engine (`org.springframework.util.AntPathMatcher`).

## Supported Wildcard Syntax

| Wildcard | Description | Example | Matches | Does NOT Match |
| :--- | :--- | :--- | :--- | :--- |
| `?` | Matches exactly one character within a segment | `/users/user?` | `/users/user1`, `/users/userA` | `/users/user12` |
| `*` | Matches zero or more characters within a single segment | `/api/*/profile` | `/api/john/profile`, `/api/jane/profile` | `/api/john/settings/profile` |
| `**` | Matches zero or more path segments across slashes | `/api/public/**` | `/api/public/info`, `/api/public/v1/auth/login` | `/api/admin/info` |

## Role Prefix Transparency

Spring Security conventions are honored automatically. Checking `hasRole('ADMIN')` automatically matches either `'ADMIN'` or `'ROLE_ADMIN'`.

If your JWT contains `roles: ["ROLE_ADMIN"]` or `roles: ["ADMIN"]`, both of the following rules will match seamlessly:

```typescript
.requestMatchers('/api/admin/**').hasRole('ADMIN')
.requestMatchers('/api/admin/**').hasRole('ROLE_ADMIN')
```

## HTTP Method Filtering

You can restrict rules to specific HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`):

```typescript
// Open GET requests to the public, but require ADMIN for POST/DELETE
.requestMatchers('GET', '/api/articles/**').permitAll()
.requestMatchers('POST', '/api/articles/**').hasRole('AUTHOR')
.requestMatchers('DELETE', '/api/articles/**').hasRole('ADMIN')
```
