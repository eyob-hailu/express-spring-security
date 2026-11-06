import { Request, Response } from 'express';

export interface AccessDeniedHandler {
  /**
   * Handles an access denied failure.
   * Invoked when an authenticated user attempts to access a resource
   * but does not possess the required roles/permissions.
   */
  handle(req: Request, res: Response, accessDeniedException?: Error): void | Promise<void>;
}

export class DefaultAccessDeniedHandler implements AccessDeniedHandler {
  public handle(req: Request, res: Response, accessDeniedException?: Error): void {
    res.status(403).json({
      error: 'Forbidden',
      message: accessDeniedException?.message || 'Access is denied: Insufficient permissions.'
    });
  }
}

