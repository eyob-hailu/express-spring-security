import { UserDetails } from '../types'; // Adjust import based on your types.ts location

export interface UserDetailsService {
    /**
     * Locates the user based on the username.
     * Should throw an error or return null if the user is not found.
     */
    loadUserByUsername(username: string): Promise<UserDetails | null>;
}