export interface UserDetails {
    id: string | number;
    username: string;
    roles: string[];
    [key: string]: any; // Allow developers to add custom claims
}

export interface Authentication {
    isAuthenticated: boolean;
    user: UserDetails | null;
    token?: string;
}