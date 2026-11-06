// src/filters/SecurityFilterChain.ts
import { Application, RequestHandler } from 'express';
import cors from 'cors'; // <-- 1. Import the standard Express cors package
import { SecurityContextHolder } from './SecurityContextHolder';
import { JwtAuthenticationFilter } from './JwtAuthenticationFilter';

export class SecurityFilterChain {
  private app: Application;
  private jwtFilter: JwtAuthenticationFilter | null = null;
  private preFilters: RequestHandler[] = [];

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
   * (e.g., helmet, body-parser).
   */
  public addPreFilter(filter: RequestHandler): this {
    this.preFilters.push(filter);
    return this; // Return 'this' to allow method chaining
  }

  /**
   * Registers the JWT Authentication Filter.
   */
  public addJwtAuthenticationFilter(filter: JwtAuthenticationFilter): this {
    this.jwtFilter = filter;
    return this;
  }

  /**
   * Applies all configured filters to the Express application in the correct, secure order.
   * This should be called before defining any routes.
   */
  public apply(): void {
    // 1. MUST GO FIRST: Initialize the global context bubble for the request
    this.app.use(SecurityContextHolder.initialize());

    // 2. Apply any pre-authentication filters (like CORS and express.json)
    this.preFilters.forEach(filter => this.app.use(filter));

    // 3. Apply the JWT Filter to intercept and authenticate the request
    if (this.jwtFilter) {
      this.app.use(this.jwtFilter.doFilter());
    }

    // 4. (Optional) We could add global route matchers here in the future
    // like app.use('/api/admin', roleCheck('ADMIN'))
  }
}