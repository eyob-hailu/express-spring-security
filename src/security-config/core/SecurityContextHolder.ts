// src/context/SecurityContextHolder.ts
import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';
import { Authentication } from '../types';

// This is the Node.js equivalent of Java's ThreadLocal
const contextStorage = new AsyncLocalStorage<Authentication>();

export class SecurityContextHolder {

    /**
     * Initializes the context for the current HTTP request.
     * This MUST be registered as the very first middleware in the Express app.
     */
    public static initialize() {
        return (req: Request, res: Response, next: NextFunction) => {
            const emptyContext: Authentication = { isAuthenticated: false, user: null };

            // Everything executed inside the run() callback (including next()) 
            // will share this exact context instance.
            contextStorage.run(emptyContext, () => {
                next();
            });
        };
    }

    /**
     * Retrieves the current authentication context from anywhere in the app.
     */
    public static getContext(): Authentication {
        const context = contextStorage.getStore();
        if (!context) {
            throw new Error("SecurityContext is not initialized. Ensure SecurityContextHolder.initialize() is used as middleware.");
        }
        return context;
    }

    /**
     * Updates the current authentication context (used by the JWT Filter).
     */
    public static setContext(auth: Authentication): void {
        const context = contextStorage.getStore();
        if (!context) {
            throw new Error("Cannot set context outside of an active HTTP request scope.");
        }
        // Mutate the existing store object so the reference remains valid
        context.isAuthenticated = auth.isAuthenticated;
        context.user = auth.user;
        context.token = auth.token;
    }

    /**
     * Clears the context (useful for manual logouts or error boundaries).
     */
    public static clearContext(): void {
        const context = contextStorage.getStore();
        if (context) {
            context.isAuthenticated = false;
            context.user = null;
            context.token = undefined;
        }
    }
}