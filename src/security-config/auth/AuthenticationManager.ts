import * as jwt from 'jsonwebtoken';
import { PasswordEncoder } from './PasswordEncoder';
import { UserDetailsService } from './UserDetailsService';

export class AuthenticationManager {
    private userDetailsService: UserDetailsService;
    private passwordEncoder: PasswordEncoder;
    private jwtSecret: string;
    private expiresIn: jwt.SignOptions['expiresIn'];

    constructor(
        userDetailsService: UserDetailsService,
        passwordEncoder: PasswordEncoder,
        jwtSecret: string,
        expiresIn: jwt.SignOptions['expiresIn'] = '1h' // Default expiration
    ) {
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
        this.jwtSecret = jwtSecret;
        this.expiresIn = expiresIn;
    }

    /**
     * Authenticates the user and returns a signed JWT if successful.
     * Throws standard errors if authentication fails.
     */
    public async authenticate(username: string, rawPassword: string): Promise<string> {
        // 1. Fetch user from the database
        const user = await this.userDetailsService.loadUserByUsername(username);

        if (!user) {
            throw new Error('Bad credentials: User not found');
        }

        if (!user.password) {
            throw new Error('Internal Error: User record missing password hash');
        }

        // 2. Verify the password
        const isMatch = await this.passwordEncoder.matches(rawPassword, user.password);

        if (!isMatch) {
            throw new Error('Bad credentials: Password mismatch');
        }

        // 3. Generate the JWT (excluding the password hash for safety)
        const payload = {
            id: user.id,
            username: user.username,
            roles: user.roles
        };

        return jwt.sign(payload, this.jwtSecret, { expiresIn: this.expiresIn });
    }
}