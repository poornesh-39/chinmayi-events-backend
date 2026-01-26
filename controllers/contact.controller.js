import Contact from "../models/Contact.js";
import { EVENT_TYPES } from "../constants/eventTypes.js";

export const submitContactForm = async (req, res) => {
  try {
    const { name, phone, email, eventType, message } = req.body;

    if (!name || !phone || !email || !eventType || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({ message: "Invalid event type" });
    }

    const contact = await Contact.create({
      name,
      phone,
      email,
      eventType,
      message
    });

    res.status(201).json({
      message: "Contact form submitted successfully",
      data: contact
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
