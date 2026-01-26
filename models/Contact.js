import mongoose from "mongoose";
import { EVENT_TYPES } from "../constants/eventTypes.js";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    eventType: {
      type: String,
      required: true,
      enum: EVENT_TYPES
    },
    message: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Contact", contactSchema);