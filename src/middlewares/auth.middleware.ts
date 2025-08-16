// middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import { generateToken } from "../utils/auth";
import { Tokens } from "../types/auth";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.cookies?.token) {
            console.log('No access token found, attempting to login...');

            const authResponse = await generateToken();

            // Verify the responses contain the expected properties
            if (!authResponse?.token || !authResponse?.refreshToken) {
                throw new Error('Authentication failed: Invalid token response');
            }

            res.cookie('token', authResponse?.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 3600000,
                sameSite: 'strict'
            });

            res.cookie('refreshToken', authResponse?.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 3600000,
                sameSite: 'strict'
            });

            // Type-safe assignment
            (req as Request & { tokens: Tokens }).tokens = {
                token: authResponse?.token,
                refreshToken: authResponse?.refreshToken
            };
        }

        next();
    } catch (error) {
        console.error('Authentication failed:', error);
        return res.status(401).json({ message: 'Authentication failed' });
    }
};