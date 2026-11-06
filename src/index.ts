// Types
export { UserDetails, Authentication } from './security-config/types';

// Core Engine (Filters & Context)
export { SecurityContextHolder } from './security-config/core/SecurityContextHolder';
export { SecurityFilterChain, ExceptionHandlingConfigurer } from './security-config/core/SecurityFilterChain';
export {
  JwtAuthenticationFilter,
  JwtAuthenticationFilterOptions,
  KeyResolver
} from './security-config/core/JwtAuthenticationFilter';
export { SecurityConfiguration } from './security-config/core/SecurityConfiguration';

// Exception Handlers
export {
  AuthenticationEntryPoint,
  DefaultAuthenticationEntryPoint
} from './security-config/handlers/AuthenticationEntryPoint';
export {
  AccessDeniedHandler,
  DefaultAccessDeniedHandler
} from './security-config/handlers/AccessDeniedHandler';

// Path Matchers & Authorization Rules
export { AntPathMatcher } from './security-config/matcher/AntPathMatcher';
export {
  AuthorizeHttpRequestsConfigurer,
  RequestMatcherRuleBuilder,
  AnyRequestRuleBuilder,
  RequestPredicate,
  AccessType,
  RequestMatcherRule
} from './security-config/matcher/AuthorizeHttpRequestsConfigurer';

// Authentication Engine
export { PasswordEncoder } from './security-config/auth/PasswordEncoder';
export { UserDetailsService } from './security-config/auth/UserDetailsService';
export { InMemoryUserDetailsManager, SecurityUser } from './security-config/auth/InMemoryUserDetailsManager';
export { AuthenticationManager } from './security-config/auth/AuthenticationManager';

// Functional Route Middleware
export {
  authenticated,
  hasRole,
  hasAnyRole,
  authorize,
  FunctionalPredicate
} from './security-config/middleware/authorizationMiddleware';

// Decorators (Stage 2 & Stage 3 Compatible)
export {
  PreAuthorize,
  PreAuthorizePredicate,
  PreAuthorizeOptions
} from './security-config/decorators/PreAuthorize';
