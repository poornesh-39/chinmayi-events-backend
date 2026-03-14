import express from 'express';
import {
  generateQuotationPDF
} from '../controllers/quotation.controller.js';

const router = express.Router();

router.post('/generate-pdf', generateQuotationPDF);

export default router;
