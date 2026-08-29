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
    // Optional: most enquiries come from mobile users who are contacted back
    // by phone or WhatsApp, and requiring an email measurably costs leads.
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
      default: ""
    },
    eventType: {
      type: String,
      required: true,
      enum: EVENT_TYPES
    },
    message: {
      type: String,
      required: false,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model("Contact", contactSchema);