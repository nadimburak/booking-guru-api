import { Request, Response } from "express";
import AxiosClient from "../utils/axiosInstance";

const modelTitle = "City";

export const getCities = async (req: Request, res: Response) => {

  try {
    const apiClient = new AxiosClient(req, res);
    const response = await apiClient.get(`/pollution?country=FR&page=1&limit=50`);

    const data = {
      cities: response.data,
      status: 'success'
    };

    res.status(200).json(data);
  } catch (error: any) {
    const status = error.response?.status || error.status || 500;
    const message = error.response?.data?.message || error.message || `Error ${modelTitle}`;

    res.status(status).json({
      status: 'error',
      message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};