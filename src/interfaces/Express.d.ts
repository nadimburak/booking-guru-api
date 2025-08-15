import { Tokens } from "../types/auth";

declare namespace Express {
    interface Request {
        tokens?: Tokens;
    }
}
