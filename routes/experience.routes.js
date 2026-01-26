import express from "express";
import {
  submitExperience,
  getAllExperiences
} from "../controllers/experience.controller.js";

const router = express.Router();

router.post("/", submitExperience);
router.get("/", getAllExperiences);

export default router;
