import { Request, Response } from "express";

const modelTitle = "Permission";

export const getCities = async (req: Request, res: Response) => {
  try {
    const data = [{
      name: "test"
    }];
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: `Error ${modelTitle}.`, error });
  }
};
