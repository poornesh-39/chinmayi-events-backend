import mongoose from "mongoose";
import { EVENT_TYPES } from "../constants/eventTypes.js";

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    eventCategory: {
      type: String,
      required: true,
      enum: EVENT_TYPES,
      lowercase: true
    },
    cloudinaryUrl: {
      type: String,
      required: true
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
      unique: true
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image"
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for efficient category-based queries
gallerySchema.index({ eventCategory: 1, uploadedAt: -1 });
gallerySchema.index({ eventCategory: 1, isFeatured: -1 });

export default mongoose.model("Gallery", gallerySchema);
