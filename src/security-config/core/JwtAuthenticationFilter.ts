import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { SecurityContextHolder } from './SecurityContextHolder';
import { UserDetails } from '../types';

export class JwtAuthenticationFilter {
  private readonly secretKey: string;

  /**
   * @param secretKey The key used to verify the JWT signature.
   */
  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  /**
   * Returns the Express middleware function to intercept requests.
   */
  public doFilter() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // 1. Look for the Authorization header
      const authHeader = req.headers.authorization;

      // 2. If no token is provided, proceed as Anonymous (Unauthenticated).
      // The @PreAuthorize decorator or route guards will block them later if needed.
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      // 3. Extract the token string (remove "Bearer " prefix)
      const token = authHeader.substring(7);

      try {
        // 4. Verify the cryptographic signature and expiration date
        const decodedPayload = jwt.verify(token, this.secretKey) as any;

        // 5. Map the decoded payload to our standard UserDetails interface
        // We use common JWT claims (sub, id, roles) but fall back gracefully
        const userDetails: UserDetails = {
          id: decodedPayload.sub || decodedPayload.id,
          username: decodedPayload.username || decodedPayload.email || 'unknown',
          roles: decodedPayload.roles || [],
          ...decodedPayload // Include any custom claims from the token
        };

        // 6. Save the user into the thread-safe SecurityContextHolder
        SecurityContextHolder.setContext({
          isAuthenticated: true,
          user: userDetails,
          token: token
        });

        // 7. Proceed to the next filter in the chain
        next();

      } catch (error) {
        // If a token IS provided but it's invalid/expired, we halt the request immediately.
        if (error instanceof jwt.TokenExpiredError) {
          res.status(401).json({ error: 'Authentication failed: Token has expired' });
          return;
        }

        res.status(401).json({ error: 'Authentication failed: Invalid token signature' });
        return;
      }
    };
  }
}