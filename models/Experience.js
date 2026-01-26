import mongoose from "mongoose";
import { EVENT_TYPES } from "../constants/eventTypes.js";

const experienceSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    eventType: {
      type: String,
      required: true,
      enum: EVENT_TYPES
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    experience: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Experience", experienceSchema);
