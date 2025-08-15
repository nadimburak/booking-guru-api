// middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import { generateToken, generateRefreshToken } from "../utils/auth";
import { Tokens } from "../types/auth";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.cookies.accessToken) {
            console.log('No access token found, attempting to login...');

            const token = await generateToken();
            const refreshToken = await generateRefreshToken();

            res.cookie('accessToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 3600000,
                sameSite: 'strict'
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 3600000,
                sameSite: 'strict'
            });

            // Type-safe assignment
            (req as Request & { tokens: Tokens }).tokens = {
                accessToken: token,
                refreshToken
            };
        }

        next();
    } catch (error) {
        console.error('Authentication failed:', error);
        return res.status(401).json({ message: 'Authentication failed' });
    }
};