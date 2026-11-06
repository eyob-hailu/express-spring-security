// src/decorators/PreAuthorize.ts
import { Request, Response, NextFunction } from 'express';
import { SecurityContextHolder } from '../core/SecurityContextHolder';

/**
 * Enforces role-based access control on an Express controller method.
 * 
 * @param allowedRoles A single role string or an array of allowed roles.
 */
export function PreAuthorize(allowedRoles: string | string[]) {

  // This is the actual decorator function that TypeScript applies to the method
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    // 1. Save a reference to the original controller method
    const originalMethod = descriptor.value;

    // 2. Replace the original method with our security wrapper
    descriptor.value = function (req: Request, res: Response, next: NextFunction) {

      try {
        // 3. Fetch the user from our globally scoped Context Holder
        const context = SecurityContextHolder.getContext();

        // 4. Check if they are logged in at all
        if (!context.isAuthenticated || !context.user) {
          return res.status(401).json({ error: 'Unauthorized: Please log in to access this resource.' });
        }

        // 5. Normalize allowedRoles into an array
        const requiredRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        const userRoles = context.user.roles || [];

        // 6. Check if the user has AT LEAST ONE of the required roles
        const hasAccess = requiredRoles.some(role => userRoles.includes(role));

        if (!hasAccess) {
          return res.status(403).json({ error: 'Forbidden: You do not have the required permissions.' });
        }

        // 7. If they pass the checks, execute the original controller method
        return originalMethod.apply(this, [req, res, next]);

      } catch (error) {
        // Catch errors if the context wasn't initialized properly
        console.error(`[PreAuthorize Error on ${propertyKey}]:`, error);
        return res.status(500).json({ error: 'Internal Server Error during authorization.' });
      }
    };

    return descriptor;
  };
}