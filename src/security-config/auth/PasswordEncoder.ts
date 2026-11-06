export interface PasswordEncoder {
    /**
     * Hashes a raw, plain-text password.
     */
    encode(rawPassword: string): Promise<string>;

    /**
     * Verifies a raw password against the hashed password from the database.
     */
    matches(rawPassword: string, encodedPassword: string): Promise<boolean>;
}