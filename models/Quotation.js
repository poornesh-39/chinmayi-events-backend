import mongoose from "mongoose";
import { EVENT_TYPES } from "../constants/eventTypes.js";

const quotationItemSchema = new mongoose.Schema(
  {
    material: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    clientName: {
      type: String,
      required: true,
      trim: true
    },
    clientEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    clientPhone: {
      type: String,
      trim: true
    },
    eventType: {
      type: String,
      enum: EVENT_TYPES,
      trim: true
    },
    quotationDate: {
      type: String,
      required: true
    },
    eventDate: {
      type: String
    },
    items: [quotationItemSchema],
    total: {
      type: Number,
      required: true,
      min: 0
    },
    transportationCharge: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("Quotation", quotationSchema);
