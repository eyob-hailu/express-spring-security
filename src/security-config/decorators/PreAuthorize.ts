// src/security-config/decorators/PreAuthorize.ts
import { Request, Response, NextFunction } from 'express';
import { SecurityContextHolder } from '../core/SecurityContextHolder';

export function PreAuthorize(allowedRoles: string | string[]) {
  
  // Look at the return type here: We explicitly promise to return a valid PropertyDescriptor
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;

    return {
      configurable: true,
      enumerable: descriptor.enumerable,
      get() {
        const boundFunction = (req: Request, res: Response, next: NextFunction) => {
          try {
            const context = SecurityContextHolder.getContext();

            if (!context.isAuthenticated || !context.user) {
              return res.status(401).json({ error: 'Unauthorized: Please log in.' });
            }

            const requiredRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
            const userRoles = context.user.roles || [];
            const hasAccess = requiredRoles.some(role => userRoles.includes(role));

            if (!hasAccess) {
              return res.status(403).json({ error: 'Forbidden: Insufficient permissions.' });
            }

            return originalMethod.apply(this, [req, res, next]);
            
          } catch (error) {
            console.error(`[PreAuthorize Error]:`, error);
            return res.status(500).json({ error: 'Internal Server Error.' });
          }
        };

        return boundFunction.bind(this);
      }
    };
  };
}