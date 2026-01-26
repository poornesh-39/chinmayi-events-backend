import Experience from "../models/Experience.js";
import { EVENT_TYPES } from "../constants/eventTypes.js";

export const submitExperience = async (req, res) => {
  try {
    const { fullName, eventType, rating, experience } = req.body;

    if (!fullName || !eventType || !rating || !experience) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({ message: "Invalid event type" });
    }

    const newExperience = await Experience.create({
      fullName,
      eventType,
      rating,
      experience
    });

    res.status(201).json({
      message: "Experience shared successfully",
      data: newExperience
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllExperiences = async (req, res) => {
  try {
    const experiences = await Experience.find().sort({ createdAt: -1 });
    res.status(200).json(experiences);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
