import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { SecurityContextHolder } from './SecurityContextHolder';
import { SecurityConfiguration } from './SecurityConfiguration';
import { AuthenticationEntryPoint } from '../handlers/AuthenticationEntryPoint';
import { UserDetails } from '../types';

/**
 * Dynamic key resolver function for resolving public keys (e.g. JWKS, multi-tenant SSO).
 * Receives the decoded JWT header (with `kid`, `alg`) and returns the corresponding public key or secret.
 */
export type KeyResolver = (header: jwt.JwtHeader) => Promise<string | Buffer> | string | Buffer;

export interface JwtAuthenticationFilterOptions {
  /**
   * Symmetric secret key (HS256) OR Asymmetric public key in PEM format (RS256, ES256, etc.).
   */
  secretOrPublicKey?: string | Buffer;

  /**
   * Dynamic key resolver function (ideal for JWKS endpoints like Auth0, Okta, Keycloak).
   */
  keyResolver?: KeyResolver;

  /**
   * Allowed cryptographic algorithms (e.g. ['RS256'], ['HS256']).
   */
  algorithms?: jwt.Algorithm[];

  /**
   * Expected token issuer ('iss' claim).
   */
  issuer?: string | string[];

  /**
   * Expected token audience ('aud' claim).
   */
  audience?: string | RegExp | Array<string | RegExp>;

  /**
   * Custom entry point to invoke on authentication failure.
   */
  entryPoint?: AuthenticationEntryPoint;
}

export class JwtAuthenticationFilter {
  private options: JwtAuthenticationFilterOptions;

  /**
   * Creates a new JwtAuthenticationFilter.
   * Supports:
   * - Symmetric secrets: new JwtAuthenticationFilter("secret-key")
   * - Asymmetric public keys: new JwtAuthenticationFilter(publicKeyPem)
   * - Full options (JWKS, algorithms, issuer, audience): new JwtAuthenticationFilter({ ... })
   */
  constructor(
    secretOrOptions: string | Buffer | JwtAuthenticationFilterOptions,
    entryPoint?: AuthenticationEntryPoint
  ) {
    if (typeof secretOrOptions === 'string' || Buffer.isBuffer(secretOrOptions)) {
      this.options = {
        secretOrPublicKey: secretOrOptions,
        entryPoint
      };
    } else {
      this.options = { ...secretOrOptions };
      if (entryPoint && !this.options.entryPoint) {
        this.options.entryPoint = entryPoint;
      }
    }
  }

  /**
   * Returns the Express middleware function to intercept requests.
   */
  public doFilter() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // 1. Look for the Authorization header
      const authHeader = req.headers.authorization;

      // 2. If no token is provided, proceed as Anonymous (Unauthenticated).
      // Downstream path matchers or @PreAuthorize decorators will enforce access.
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      // 3. Extract the token string (remove "Bearer " prefix)
      const token = authHeader.substring(7);

      try {
        let keyToVerify: string | Buffer;

        // 4. Resolve key dynamically (JWKS / multi-tenant) or use static secret/public key
        if (this.options.keyResolver) {
          const decodedComplete = jwt.decode(token, { complete: true });
          if (!decodedComplete || typeof decodedComplete !== 'object' || !decodedComplete.header) {
            throw new Error('Authentication failed: Malformed JWT header');
          }
          keyToVerify = await this.options.keyResolver(decodedComplete.header);
        } else if (this.options.secretOrPublicKey) {
          keyToVerify = this.options.secretOrPublicKey;
        } else {
          throw new Error('JwtAuthenticationFilter configuration error: No secret, public key, or keyResolver provided');
        }

        // 5. Build verification options
        const verifyOptions: jwt.VerifyOptions = {};
        if (this.options.algorithms) {
          verifyOptions.algorithms = this.options.algorithms;
        }
        if (this.options.issuer) {
          verifyOptions.issuer = this.options.issuer as any;
        }
        if (this.options.audience) {
          verifyOptions.audience = this.options.audience as any;
        }

        // 6. Verify signature and claims (RS256, HS256, etc.)
        const decodedPayload = jwt.verify(token, keyToVerify, verifyOptions) as any;

        // 7. Map payload to standard UserDetails interface
        const userDetails: UserDetails = {
          id: decodedPayload.sub || decodedPayload.id,
          username: decodedPayload.username || decodedPayload.email || 'unknown',
          roles: decodedPayload.roles || [],
          ...decodedPayload
        };

        // 8. Save the user into the thread-safe SecurityContextHolder
        SecurityContextHolder.setContext({
          isAuthenticated: true,
          user: userDetails,
          token: token
        });

        // 9. Proceed to next filter
        next();

      } catch (error: any) {
        // If a token was provided but is invalid, expired, or untrusted, invoke AuthenticationEntryPoint
        const entryPoint = this.options.entryPoint || SecurityConfiguration.getAuthenticationEntryPoint();

        if (error instanceof jwt.TokenExpiredError) {
          await entryPoint.commence(req, res, new Error('Authentication failed: Token has expired'));
          return;
        }

        await entryPoint.commence(
          req,
          res,
          new Error(error?.message || 'Authentication failed: Invalid token signature')
        );
        return;
      }
    };
  }
}
