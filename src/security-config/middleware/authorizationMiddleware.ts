// src/security-config/middleware/authorizationMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { SecurityContextHolder } from '../core/SecurityContextHolder';
import { SecurityConfiguration } from '../core/SecurityConfiguration';
import { Authentication } from '../types';

export type FunctionalPredicate = (auth: Authentication, req: Request) => boolean | Promise<boolean>;

/**
 * Functional Express middleware that requires the current user to be authenticated.
 */
export function authenticated(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let context: Authentication;
    try {
      context = SecurityContextHolder.getContext();
    } catch {
      context = { isAuthenticated: false, user: null };
    }

    if (!context.isAuthenticated || !context.user) {
      await SecurityConfiguration.getAuthenticationEntryPoint().commence(
        req,
        res,
        new Error('Full authentication is required to access this resource.')
      );
      return;
    }

    next();
  };
}

/**
 * Functional Express middleware that requires the current user to possess a specific role.
 * Example: app.get('/api/admin', hasRole('ADMIN'), handler)
 */
export function hasRole(role: string): RequestHandler {
  return hasAnyRole(role);
}

/**
 * Functional Express middleware that requires the current user to possess at least one of the given roles.
 * Example: app.get('/api/dashboard', hasAnyRole('USER', 'ADMIN'), handler)
 */
export function hasAnyRole(...roles: string[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let context: Authentication;
    try {
      context = SecurityContextHolder.getContext();
    } catch {
      context = { isAuthenticated: false, user: null };
    }

    if (!context.isAuthenticated || !context.user) {
      await SecurityConfiguration.getAuthenticationEntryPoint().commence(
        req,
        res,
        new Error('Full authentication is required to access this resource.')
      );
      return;
    }

    const userRoles = context.user.roles || [];
    const hasPermission = roles.some(role =>
      userRoles.includes(role) ||
      userRoles.includes(`ROLE_${role}`) ||
      (role.startsWith('ROLE_') && userRoles.includes(role.substring(5)))
    );

    if (!hasPermission) {
      await SecurityConfiguration.getAccessDeniedHandler().handle(
        req,
        res,
        new Error(`Access is denied: Requires role ${roles.join(' or ')}.`)
      );
      return;
    }

    next();
  };
}

/**
 * Functional Express middleware that evaluates a custom permission predicate.
 * Example: app.get('/api/resource/:id', authorize((auth, req) => auth.user?.id === req.params.id), handler)
 */
export function authorize(predicate: FunctionalPredicate): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let context: Authentication;
    try {
      context = SecurityContextHolder.getContext();
    } catch {
      context = { isAuthenticated: false, user: null };
    }

    if (!context.isAuthenticated || !context.user) {
      await SecurityConfiguration.getAuthenticationEntryPoint().commence(
        req,
        res,
        new Error('Full authentication is required to access this resource.')
      );
      return;
    }

    const isAllowed = await predicate(context, req);
    if (!isAllowed) {
      await SecurityConfiguration.getAccessDeniedHandler().handle(
        req,
        res,
        new Error('Access is denied: Authorization expression evaluated to false.')
      );
      return;
    }

    next();
  };
}

