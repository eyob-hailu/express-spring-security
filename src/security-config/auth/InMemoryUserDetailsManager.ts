// src/security-config/auth/InMemoryUserDetailsManager.ts
import { UserDetailsService } from './UserDetailsService';
import { UserDetails } from '../types';

export interface SecurityUser extends UserDetails {
  password?: string;
}

/**
 * In-memory implementation of UserDetailsService.
 * Mirrors Spring Security's InMemoryUserDetailsManager.
 * Allows quick prototyping and unit testing without a live database.
 */
export class InMemoryUserDetailsManager implements UserDetailsService {
  private users: Map<string, SecurityUser> = new Map();

  constructor(initialUsers: SecurityUser[] = []) {
    initialUsers.forEach(user => this.createUser(user));
  }

  public async loadUserByUsername(username: string): Promise<UserDetails | null> {
    const user = this.users.get(username.toLowerCase());
    return user ? { ...user } : null;
  }

  public createUser(user: SecurityUser): void {
    if (this.users.has(user.username.toLowerCase())) {
      throw new Error(`User with username '${user.username}' already exists.`);
    }
    this.users.set(user.username.toLowerCase(), { ...user });
  }

  public updateUser(user: SecurityUser): void {
    if (!this.users.has(user.username.toLowerCase())) {
      throw new Error(`User with username '${user.username}' does not exist.`);
    }
    this.users.set(user.username.toLowerCase(), { ...user });
  }

  public deleteUser(username: string): void {
    this.users.delete(username.toLowerCase());
  }

  public userExists(username: string): boolean {
    return this.users.has(username.toLowerCase());
  }
}

