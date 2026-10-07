import express from "express";
import {
  submitContactForm,
  getContacts,
  updateContact,
  deleteContact
} from "../controllers/contact.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Public: the website's enquiry form.
router.post("/", submitContactForm);

// Admin: reading and working the leads those submissions create.
router.get("/", requireAuth, getContacts);
router.patch("/:id", requireAuth, updateContact);
router.delete("/:id", requireAuth, deleteContact);

export default router;
