import Contact, { LEAD_STATUSES } from "../models/Contact.js";
import { EVENT_TYPES } from "../constants/eventTypes.js";
import { notifyNewLead } from "../utils/notifyNewLead.js";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

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

    // Fire and forget: the enquiry is already stored, so a mail failure must
    // not turn a successful submission into an error for the customer.
    notifyNewLead(contact);

    res.status(201).json({
      message: "Contact form submitted successfully",
      data: contact
    });
  } catch (error) {
    console.error("Contact submission failed:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** Admin-only. Newest first, paginated, optionally narrowed to one status. */
export const getContacts = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_SIZE));
    const { status } = req.query;

    const filter = {};
    if (status && status !== "all") {
      if (!LEAD_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      filter.status = status;
    }

    const [contacts, total, newCount] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Contact.countDocuments(filter),
      Contact.countDocuments({ status: "new" })
    ]);

    res.status(200).json({
      contacts,
      newCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error) {
    console.error("Fetching contacts failed:", error);
    res.status(500).json({ message: "Could not load enquiries" });
  }
};

/** Admin-only. Moves a lead along the pipeline, or saves a follow-up note. */
export const updateContact = async (req, res) => {
  try {
    const { status, notes } = req.body || {};

    if (status === undefined && notes === undefined) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const update = {};

    if (status !== undefined) {
      if (!LEAD_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      update.status = status;
    }

    if (notes !== undefined) {
      update.notes = String(notes).slice(0, 2000);
    }

    const contact = await Contact.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });

    if (!contact) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.status(200).json({ message: "Enquiry updated", contact });
  } catch (error) {
    console.error("Updating contact failed:", error);
    res.status(500).json({ message: "Could not update enquiry" });
  }
};

/** Admin-only. Permanently removes an enquiry. */
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.status(200).json({ message: "Enquiry deleted" });
  } catch (error) {
    console.error("Deleting contact failed:", error);
    res.status(500).json({ message: "Could not delete enquiry" });
  }
};

export const getLeadStatuses = (_req, res) => res.status(200).json({ statuses: LEAD_STATUSES });
