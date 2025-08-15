import { Request, Response } from "express";
import axiosInstance from "../utils/axiosInstance";

const modelTitle = "City";

export const getCities = async (req: Request, res: Response) => {
  try {
    const response = await axiosInstance.get(`/pollution?country=FR&page=1&limit=50`)

    console.log("response", response)

    const data = [{
      name: "test",
      response: response
    }];
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: `Error ${modelTitle}.`, error });
  }
};
