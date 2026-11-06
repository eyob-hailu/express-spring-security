// src/security-config/core/SecurityFilterChain.ts
import { Application, RequestHandler } from 'express';
import cors from 'cors';
import { SecurityContextHolder } from './SecurityContextHolder';
import { SecurityConfiguration } from './SecurityConfiguration';
import { JwtAuthenticationFilter } from './JwtAuthenticationFilter';
import { AuthorizeHttpRequestsConfigurer } from '../matcher/AuthorizeHttpRequestsConfigurer';
import { AuthenticationEntryPoint } from '../handlers/AuthenticationEntryPoint';
import { AccessDeniedHandler } from '../handlers/AccessDeniedHandler';

export class ExceptionHandlingConfigurer {
  private _entryPoint?: AuthenticationEntryPoint;
  private _accessDeniedHandler?: AccessDeniedHandler;

  public authenticationEntryPoint(entryPoint: AuthenticationEntryPoint): this {
    this._entryPoint = entryPoint;
    return this;
  }

  public accessDeniedHandler(handler: AccessDeniedHandler): this {
    this._accessDeniedHandler = handler;
    return this;
  }

  public get entryPoint(): AuthenticationEntryPoint | undefined {
    return this._entryPoint;
  }

  public get accessDenied(): AccessDeniedHandler | undefined {
    return this._accessDeniedHandler;
  }
}

export class SecurityFilterChain {
  private app: Application;
  private jwtFilter: JwtAuthenticationFilter | null = null;
  private preFilters: RequestHandler[] = [];
  private authConfigurer: AuthorizeHttpRequestsConfigurer | null = null;
  private entryPoint?: AuthenticationEntryPoint;
  private accessDenied?: AccessDeniedHandler;

  /**
   * @param app The Express application instance
   */
  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Adds Spring-style CORS configuration.
   * Guaranteed to be applied securely BEFORE the authentication filter.
   */
  public cors(options?: cors.CorsOptions): this {
    this.preFilters.push(cors(options));
    return this;
  }

  /**
   * Registers custom middleware that should run BEFORE authentication
   * (e.g., helmet, body-parser, express.json()).
   */
  public addPreFilter(filter: RequestHandler): this {
    this.preFilters.push(filter);
    return this;
  }

  /**
   * Registers the JWT Authentication Filter.
   */
  public addJwtAuthenticationFilter(filter: JwtAuthenticationFilter): this {
    this.jwtFilter = filter;
    return this;
  }

  /**
   * Configures URL path-based authorization rules (matching Spring Security 6's DSL).
   *
   * Example:
   * .authorizeHttpRequests(auth => auth
   *   .requestMatchers('/api/public/**', '/api/auth/**').permitAll()
   *   .requestMatchers('/api/admin/**').hasRole('ADMIN')
   *   .anyRequest().authenticated()
   * )
   */
  public authorizeHttpRequests(
    configurer: (auth: AuthorizeHttpRequestsConfigurer) => void
  ): this {
    this.authConfigurer = new AuthorizeHttpRequestsConfigurer();
    configurer(this.authConfigurer);
    return this;
  }

  /**
   * Configures custom exception handlers for authentication (401) and access denied (403).
   */
  public exceptionHandling(
    configurer: (customizer: ExceptionHandlingConfigurer) => void
  ): this {
    const customizer = new ExceptionHandlingConfigurer();
    configurer(customizer);

    if (customizer.entryPoint) {
      this.authenticationEntryPoint(customizer.entryPoint);
    }

    if (customizer.accessDenied) {
      this.accessDeniedHandler(customizer.accessDenied);
    }

    return this;
  }

  /**
   * Directly sets the custom AuthenticationEntryPoint.
   */
  public authenticationEntryPoint(entryPoint: AuthenticationEntryPoint): this {
    this.entryPoint = entryPoint;
    SecurityConfiguration.setAuthenticationEntryPoint(entryPoint);
    return this;
  }

  /**
   * Directly sets the custom AccessDeniedHandler.
   */
  public accessDeniedHandler(handler: AccessDeniedHandler): this {
    this.accessDenied = handler;
    SecurityConfiguration.setAccessDeniedHandler(handler);
    return this;
  }

  /**
   * Applies all configured filters to the Express application in the correct, secure order.
   * This should be called before defining route endpoints.
   */
  public apply(): void {
    // 1. MUST GO FIRST: Initialize the global AsyncLocalStorage context bubble
    this.app.use(SecurityContextHolder.initialize());

    // 2. Apply any pre-authentication filters (like CORS and express.json)
    this.preFilters.forEach(filter => this.app.use(filter));

    // 3. Apply the JWT Filter to intercept and authenticate requests
    if (this.jwtFilter) {
      this.app.use(this.jwtFilter.doFilter());
    }

    // 4. Apply URL path authorization filter (authorizeHttpRequests)
    if (this.authConfigurer) {
      const activeEntryPoint = this.entryPoint || SecurityConfiguration.getAuthenticationEntryPoint();
      const activeAccessDenied = this.accessDenied || SecurityConfiguration.getAccessDeniedHandler();

      this.app.use(this.authConfigurer.createFilter(activeEntryPoint, activeAccessDenied));
    }
  }
}
