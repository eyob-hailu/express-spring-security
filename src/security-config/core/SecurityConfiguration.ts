import { AuthenticationEntryPoint, DefaultAuthenticationEntryPoint } from '../handlers/AuthenticationEntryPoint';
import { AccessDeniedHandler, DefaultAccessDeniedHandler } from '../handlers/AccessDeniedHandler';

/**
 * Global configuration registry for express-spring-security.
 * Holds active entry points, access denied handlers, and framework defaults.
 */
export class SecurityConfiguration {
  private static authenticationEntryPoint: AuthenticationEntryPoint = new DefaultAuthenticationEntryPoint();
  private static accessDeniedHandler: AccessDeniedHandler = new DefaultAccessDeniedHandler();

  public static getAuthenticationEntryPoint(): AuthenticationEntryPoint {
    return this.authenticationEntryPoint;
  }

  public static setAuthenticationEntryPoint(entryPoint: AuthenticationEntryPoint): void {
    this.authenticationEntryPoint = entryPoint;
  }

  public static getAccessDeniedHandler(): AccessDeniedHandler {
    return this.accessDeniedHandler;
  }

  public static setAccessDeniedHandler(handler: AccessDeniedHandler): void {
    this.accessDeniedHandler = handler;
  }

  public static resetDefaults(): void {
    this.authenticationEntryPoint = new DefaultAuthenticationEntryPoint();
    this.accessDeniedHandler = new DefaultAccessDeniedHandler();
  }
}

