import { Request, Response } from 'express';

export interface AuthenticationEntryPoint {
  /**
   * Commences an authentication scheme.
   * Invoked when an unauthenticated user attempts to access a protected resource
   * or when authentication fails (e.g. invalid or expired JWT token).
   */
  commence(req: Request, res: Response, authException?: Error): void | Promise<void>;
}

export class DefaultAuthenticationEntryPoint implements AuthenticationEntryPoint {
  public commence(req: Request, res: Response, authException?: Error): void {
    res.status(401).json({
      error: 'Unauthorized',
      message: authException?.message || 'Full authentication is required to access this resource.'
    });
  }
}
