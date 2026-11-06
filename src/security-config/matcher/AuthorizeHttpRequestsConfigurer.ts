import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AntPathMatcher } from './AntPathMatcher';
import { SecurityContextHolder } from '../core/SecurityContextHolder';
import { Authentication } from '../types';
import { AuthenticationEntryPoint } from '../handlers/AuthenticationEntryPoint';
import { AccessDeniedHandler } from '../handlers/AccessDeniedHandler';

export type RequestPredicate = (auth: Authentication, req: Request) => boolean | Promise<boolean>;

export type AccessType = 'PERMIT_ALL' | 'DENY_ALL' | 'AUTHENTICATED' | 'HAS_ROLE' | 'HAS_ANY_ROLE' | 'CUSTOM';

export interface RequestMatcherRule {
  method?: string;
  patterns: string[];
  accessType: AccessType;
  roles?: string[];
  customPredicate?: RequestPredicate;
}

export class RequestMatcherRuleBuilder {
  private configurer: AuthorizeHttpRequestsConfigurer;
  private patterns: string[];
  private method?: string;

  constructor(configurer: AuthorizeHttpRequestsConfigurer, patterns: string[], method?: string) {
    this.configurer = configurer;
    this.patterns = patterns;
    this.method = method;
  }

  public permitAll(): AuthorizeHttpRequestsConfigurer {
    this.configurer.addRule({
      method: this.method,
      patterns: this.patterns,
      accessType: 'PERMIT_ALL'
    });
    return this.configurer;
  }

  public denyAll(): AuthorizeHttpRequestsConfigurer {
    this.configurer.addRule({
      method: this.method,
      patterns: this.patterns,
      accessType: 'DENY_ALL'
    });
    return this.configurer;
  }

  public authenticated(): AuthorizeHttpRequestsConfigurer {
    this.configurer.addRule({
      method: this.method,
      patterns: this.patterns,
      accessType: 'AUTHENTICATED'
    });
    return this.configurer;
  }

  public hasRole(role: string): AuthorizeHttpRequestsConfigurer {
    this.configurer.addRule({
      method: this.method,
      patterns: this.patterns,
      accessType: 'HAS_ROLE',
      roles: [role]
    });
    return this.configurer;
  }

  public hasAnyRole(...roles: string[]): AuthorizeHttpRequestsConfigurer {
    this.configurer.addRule({
      method: this.method,
      patterns: this.patterns,
      accessType: 'HAS_ANY_ROLE',
      roles: roles.flat()
    });
    return this.configurer;
  }

  public access(predicate: RequestPredicate): AuthorizeHttpRequestsConfigurer {
    this.configurer.addRule({
      method: this.method,
      patterns: this.patterns,
      accessType: 'CUSTOM',
      customPredicate: predicate
    });
    return this.configurer;
  }
}

export class AnyRequestRuleBuilder {
  private configurer: AuthorizeHttpRequestsConfigurer;

  constructor(configurer: AuthorizeHttpRequestsConfigurer) {
    this.configurer = configurer;
  }

  public permitAll(): AuthorizeHttpRequestsConfigurer {
    this.configurer.setAnyRequestRule({
      patterns: ['/**'],
      accessType: 'PERMIT_ALL'
    });
    return this.configurer;
  }

  public denyAll(): AuthorizeHttpRequestsConfigurer {
    this.configurer.setAnyRequestRule({
      patterns: ['/**'],
      accessType: 'DENY_ALL'
    });
    return this.configurer;
  }

  public authenticated(): AuthorizeHttpRequestsConfigurer {
    this.configurer.setAnyRequestRule({
      patterns: ['/**'],
      accessType: 'AUTHENTICATED'
    });
    return this.configurer;
  }

  public hasRole(role: string): AuthorizeHttpRequestsConfigurer {
    this.configurer.setAnyRequestRule({
      patterns: ['/**'],
      accessType: 'HAS_ROLE',
      roles: [role]
    });
    return this.configurer;
  }

  public hasAnyRole(...roles: string[]): AuthorizeHttpRequestsConfigurer {
    this.configurer.setAnyRequestRule({
      patterns: ['/**'],
      accessType: 'HAS_ANY_ROLE',
      roles: roles.flat()
    });
    return this.configurer;
  }

  public access(predicate: RequestPredicate): AuthorizeHttpRequestsConfigurer {
    this.configurer.setAnyRequestRule({
      patterns: ['/**'],
      accessType: 'CUSTOM',
      customPredicate: predicate
    });
    return this.configurer;
  }
}

export class AuthorizeHttpRequestsConfigurer {
  private rules: RequestMatcherRule[] = [];
  private anyRequestRule?: RequestMatcherRule;

  public addRule(rule: RequestMatcherRule): void {
    this.rules.push(rule);
  }

  public setAnyRequestRule(rule: RequestMatcherRule): void {
    this.anyRequestRule = rule;
  }

  /**
   * Matches URL patterns. Supports multiple patterns, arrays, and optional HTTP method:
   * .requestMatchers('/api/public/**', '/api/auth/**')
   * .requestMatchers('POST', '/api/users/**')
   * .requestMatchers(['/api/a/**', '/api/b/**'])
   */
  public requestMatchers(
    methodOrPattern: string | string[],
    ...restPatterns: string[]
  ): RequestMatcherRuleBuilder {
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

    if (typeof methodOrPattern === 'string' && httpMethods.includes(methodOrPattern.toUpperCase())) {
      const method = methodOrPattern.toUpperCase();
      return new RequestMatcherRuleBuilder(this, restPatterns, method);
    }

    const patterns = Array.isArray(methodOrPattern)
      ? methodOrPattern
      : [methodOrPattern, ...restPatterns];

    return new RequestMatcherRuleBuilder(this, patterns);
  }

  /**
   * Catches all requests that did not match any previous rule.
   */
  public anyRequest(): AnyRequestRuleBuilder {
    return new AnyRequestRuleBuilder(this);
  }

  /**
   * Generates the Express middleware that enforces the path-based rules.
   */
  public createFilter(
    entryPoint: AuthenticationEntryPoint,
    accessDenied: AccessDeniedHandler
  ): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const path = req.path || req.url;
      const method = req.method.toUpperCase();

      // 1. Find the first matching rule (Spring Security semantics: first match wins)
      let matchedRule: RequestMatcherRule | undefined;

      for (const rule of this.rules) {
        if (rule.method && rule.method !== method) {
          continue;
        }
        const matches = rule.patterns.some(pattern => AntPathMatcher.match(pattern, path));
        if (matches) {
          matchedRule = rule;
          break;
        }
      }

      // 2. If no specific rule matched, check anyRequest rule
      if (!matchedRule && this.anyRequestRule) {
        matchedRule = this.anyRequestRule;
      }

      // 3. If no rule matched at all, allow to proceed to next middleware
      if (!matchedRule) {
        return next();
      }

      // 4. If permitAll, allow without checking authentication
      if (matchedRule.accessType === 'PERMIT_ALL') {
        return next();
      }

      // Read current authentication context
      let context: Authentication;
      try {
        context = SecurityContextHolder.getContext();
      } catch {
        context = { isAuthenticated: false, user: null };
      }

      // 5. If denyAll, reject immediately
      if (matchedRule.accessType === 'DENY_ALL') {
        await accessDenied.handle(req, res, new Error('Access is denied: Request matched denyAll policy.'));
        return;
      }

      // 6. For authenticated(), hasRole(), hasAnyRole(), or custom: must be authenticated
      if (!context.isAuthenticated || !context.user) {
        await entryPoint.commence(req, res, new Error('Full authentication is required to access this resource.'));
        return;
      }

      if (matchedRule.accessType === 'AUTHENTICATED') {
        return next();
      }

      if (matchedRule.accessType === 'HAS_ROLE' || matchedRule.accessType === 'HAS_ANY_ROLE') {
        const requiredRoles = matchedRule.roles || [];
        const userRoles = context.user.roles || [];

        const hasPermission = requiredRoles.some(role =>
          userRoles.includes(role) ||
          userRoles.includes(`ROLE_${role}`) ||
          (role.startsWith('ROLE_') && userRoles.includes(role.substring(5)))
        );

        if (!hasPermission) {
          await accessDenied.handle(
            req,
            res,
            new Error(`Access is denied: Requires role ${requiredRoles.join(' or ')}.`)
          );
          return;
        }

        return next();
      }

      if (matchedRule.accessType === 'CUSTOM' && matchedRule.customPredicate) {
        const isAllowed = await matchedRule.customPredicate(context, req);
        if (!isAllowed) {
          await accessDenied.handle(
            req,
            res,
            new Error('Access is denied: Custom authorization expression rejected the request.')
          );
          return;
        }
        return next();
      }

      next();
    };
  }
}
