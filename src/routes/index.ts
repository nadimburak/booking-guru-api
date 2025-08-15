import express, { Request, Response } from "express";

import cityRoutes from "./cities";
import { authMiddleware } from "../middlewares/auth.middleware";

const app = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express! User Api is running.");
});

// Apply auth middleware to all city routes
app.use(authMiddleware);

app.use(cityRoutes);

export default app;
