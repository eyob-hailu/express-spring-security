// src/security-config/decorators/PreAuthorize.ts
import { Request, Response, NextFunction } from 'express';
import { SecurityContextHolder } from '../core/SecurityContextHolder';
import { SecurityConfiguration } from '../core/SecurityConfiguration';
import { Authentication } from '../types';
import { AuthenticationEntryPoint } from '../handlers/AuthenticationEntryPoint';
import { AccessDeniedHandler } from '../handlers/AccessDeniedHandler';

export type PreAuthorizePredicate = (auth: Authentication, req: Request) => boolean | Promise<boolean>;

export interface PreAuthorizeOptions {
  authenticationEntryPoint?: AuthenticationEntryPoint;
  accessDeniedHandler?: AccessDeniedHandler;
}

/**
 * Shared authorization evaluation logic for both Stage 2 and Stage 3 decorators.
 */
async function evaluateAuthorization(
  req: Request,
  res: Response,
  allowed: string | string[] | PreAuthorizePredicate,
  options?: PreAuthorizeOptions
): Promise<boolean> {
  const entryPoint = options?.authenticationEntryPoint || SecurityConfiguration.getAuthenticationEntryPoint();
  const accessDenied = options?.accessDeniedHandler || SecurityConfiguration.getAccessDeniedHandler();

  let context: Authentication;
  try {
    context = SecurityContextHolder.getContext();
  } catch (err: any) {
    await entryPoint.commence(
      req,
      res,
      new Error('Security context is not initialized. Ensure SecurityFilterChain is applied.')
    );
    return false;
  }

  if (!context.isAuthenticated || !context.user) {
    await entryPoint.commence(req, res, new Error('Full authentication is required to access this resource.'));
    return false;
  }

  let hasAccess = false;
  if (typeof allowed === 'function') {
    hasAccess = await allowed(context, req);
  } else {
    const requiredRoles = Array.isArray(allowed) ? allowed : [allowed];
    const userRoles = context.user.roles || [];
    hasAccess = requiredRoles.some(role =>
      userRoles.includes(role) ||
      userRoles.includes(`ROLE_${role}`) ||
      (role.startsWith('ROLE_') && userRoles.includes(role.substring(5)))
    );
  }

  if (!hasAccess) {
    await accessDenied.handle(req, res, new Error('Access is denied: Insufficient permissions.'));
    return false;
  }

  return true;
}

/**
 * Universal @PreAuthorize decorator.
 * Supports:
 * - Stage 2 Legacy Decorators (tsconfig: "experimentalDecorators": true)
 * - Stage 3 Standard TC39 Decorators (TypeScript 5.0+ standard decorators)
 * - Role names ('ADMIN', ['USER', 'ADMIN']) or dynamic expression predicates ((auth, req) => boolean)
 * - Pluggable AuthenticationEntryPoint and AccessDeniedHandler
 */
export function PreAuthorize(
  allowed: string | string[] | PreAuthorizePredicate,
  options?: PreAuthorizeOptions
): any {
  return function (
    targetOrMethod: any,
    propertyKeyOrContext: any,
    descriptor?: PropertyDescriptor
  ): any {
    // ========================================================
    // Detect TC39 Stage 3 Decorator (TS 5.0+ Standard Decorators)
    // In Stage 3, the 2nd argument is a ClassMethodDecoratorContext object with kind: 'method'
    // ========================================================
    const isStage3 =
      propertyKeyOrContext &&
      typeof propertyKeyOrContext === 'object' &&
      propertyKeyOrContext.kind === 'method';

    if (isStage3) {
      const originalMethod = targetOrMethod;
      const context = propertyKeyOrContext;

      // Auto-bind 'this' when an instance is instantiated so Express doesn't lose context
      if (typeof context.addInitializer === 'function') {
        context.addInitializer(function (this: any) {
          if (this && context.name && typeof this[context.name] === 'function') {
            this[context.name] = this[context.name].bind(this);
          }
        });
      }

      // Return replacement method
      return async function (this: any, req: Request, res: Response, next: NextFunction) {
        try {
          const canProceed = await evaluateAuthorization(req, res, allowed, options);
          if (canProceed) {
            return originalMethod.call(this, req, res, next);
          }
        } catch (error) {
          console.error(`[PreAuthorize Stage 3 Error]:`, error);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
      };
    }

    // ========================================================
    // Stage 2 Legacy Decorator (experimentalDecorators: true)
    // Returns a PropertyDescriptor with a getter to auto-bind 'this' for Express route registration
    // ========================================================
    const targetDescriptor = descriptor || Object.getOwnPropertyDescriptor(targetOrMethod, propertyKeyOrContext);
    const originalMethod = targetDescriptor ? targetDescriptor.value : targetOrMethod[propertyKeyOrContext];

    return {
      configurable: true,
      enumerable: targetDescriptor ? targetDescriptor.enumerable : true,
      get() {
        const boundFunction = async (req: Request, res: Response, next: NextFunction) => {
          try {
            const canProceed = await evaluateAuthorization(req, res, allowed, options);
            if (canProceed) {
              return originalMethod.apply(this, [req, res, next]);
            }
          } catch (error) {
            console.error(`[PreAuthorize Stage 2 Error]:`, error);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
        };

        return boundFunction.bind(this);
      }
    };
  };
}