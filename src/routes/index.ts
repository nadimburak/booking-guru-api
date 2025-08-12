import express, { Request, Response } from "express";

import cityRoutes from "./cities";

const app = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express! User Api is running.");
});

app.use(cityRoutes);

export default app;
