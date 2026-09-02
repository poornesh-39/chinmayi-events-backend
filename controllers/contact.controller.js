import Contact from "../models/Contact.js";
import { EVENT_TYPES } from "../constants/eventTypes.js";

export const submitContactForm = async (req, res) => {
  try {
    const { name, phone, email, eventType, message } = req.body;

    // Email and message are optional — name, phone and event type are enough
    // to follow up on an enquiry.
    if (!name || !phone || !eventType) {
      return res
        .status(400)
        .json({ message: "Name, phone and event type are required" });
    }

    if (!EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({ message: "Invalid event type" });
    }

    const contact = await Contact.create({
      name,
      phone,
      email: email || "",
      eventType,
      message: message || ""
    });

    res.status(201).json({
      message: "Contact form submitted successfully",
      data: contact
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
