import mongoose from "mongoose";
import { EVENT_TYPES } from "../constants/eventTypes.js";

// Where a lead sits in the follow-up pipeline. Ordered as it progresses.
export const LEAD_STATUSES = ["new", "contacted", "quoted", "won", "lost"];

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
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "new",
      index: true
    },
    // Free-text follow-up notes kept by whoever works the lead.
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

// The admin list is always newest-first, optionally narrowed to one status.
contactSchema.index({ createdAt: -1 });
contactSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Contact", contactSchema);