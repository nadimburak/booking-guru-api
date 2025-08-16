import mongoose, { Document, Model, Schema } from "mongoose";

// Interface for City Document
export interface ICity extends Document {
  country: string; // Reference to Country model
  name: string;
  pollution: string;
  description: string;
  status: boolean; // true or false
  created_at: Date;
  updated_at: Date;
}

// Schema Definition
const CitySchema: Schema<ICity> = new Schema(
  {
    country: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    pollution: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    status: {
      type: Boolean,
      required: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, // Mongoose will manage timestamps
  }
);

// Model Definition
const City: Model<ICity> = mongoose.model<ICity>(
  "City",
  CitySchema
);

export default City;
