import { Request, Response } from "express";
import AxiosClient from "../utils/axiosInstance";
import City from "../models/City";

const modelTitle = "City";
interface CityData {
  name: string;
  pollution: any;
}

interface ApiResponse {
  results: CityData[];
}

interface CountryProcessingResult {
  success: boolean;
  country: string;
  error?: unknown;
}

export const synCities = async (req: Request, res: Response) => {
  try {
    const countries = ["PL", "DE", "ES", "FR"] as const;
    const apiClient = new AxiosClient(req, res);

    // Process countries in parallel for better performance
    const countryPromises = countries.map(async (country): Promise<CountryProcessingResult> => {
      try {
        const response = await apiClient.get<ApiResponse>(`/pollution?country=${country}&page=1&limit=50`);
        const pollutionData = response.data.results;

        // Use bulk insert for better performance
        const cityDocuments = pollutionData.map(cityData => ({
          country,
          name: cityData.name,
          pollution: cityData.pollution,
          status: true,
        }));

        await City.insertMany(cityDocuments);
        console.log(`Successfully processed data for country: ${country}`);

        return { success: true, country };
      } catch (error) {
        console.error(`Error processing country ${country}:`, error);
        return { success: false, country, error };
      }
    });

    // Wait for all countries to be processed
    const results = await Promise.all(countryPromises);
    const successfulCountries = results.filter(r => r.success).map(r => r.country);
    const failedCountries = results.filter(r => !r.success);

    res.status(200).json({
      message: "Countries processing completed",
      successfulCountries,
      failedCountries: failedCountries.length > 0 ? failedCountries : undefined,
    });

  } catch (error: any) {
    const status = error.response?.status || error.status || 500;
    const message = error.response?.data?.message || error.message || `Error ${modelTitle}`;

    res.status(status).json({
      status: 'error',
      message,
      cookies: req.cookies,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const getCities = async (req: Request, res: Response) => {

  try {
    const {
      page = "1", // Default to page 1 if not provided
      limit = "10", // Default to limit 10 if not provided
      sortBy = "name", // Default sorting field
      order = "asc", // Default order
      search = "", // Default search string
    } = req.query;

    // Parse and validate page and limit
    const parsedPage = Math.max(parseInt(page as string, 10), 1); // Minimum value 1
    const parsedLimit = Math.max(parseInt(limit as string, 10), 1); // Minimum value 1
    const sortOrder = order === "asc" ? 1 : -1; // Convert order to MongoDB format

    const query: any = search
      ? {
        $or: [
          { name: { $regex: search, $options: "i" } }, // Case-insensitive match for name
        ],
      }
      : {};

    // Fetch data with sorting and pagination
    const data = await City.find(query)
      .sort({ [sortBy as string]: sortOrder })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    // Get the total number of documents
    const totalData = await City.countDocuments(query);

    // Send the response
    res.status(200).json({
      data,
      total: totalData,
      currentPage: parsedPage,
      totalPages: Math.ceil(totalData / parsedLimit),
    });
  } catch (error) {
    res.status(500).json({ message: `Error ${modelTitle}.`, error });
  }
};