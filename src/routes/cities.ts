import express from "express";
import {
  getCities,
  synCities,
} from "../controllers/cityController";

const router = express.Router();

router.get(
  "/cities",
  getCities
);
router.get(
  "/update-cities",
  synCities
);

export default router;
