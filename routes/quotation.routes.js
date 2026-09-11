import express from 'express';
import {
  generateQuotationPDF,
  saveQuotation,
  getQuotationByNumber,
  updateQuotation
} from '../controllers/quotation.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Quotations are an internal tool end to end — nothing here is public.
router.use(requireAuth);

router.post('/generate-pdf', generateQuotationPDF);
router.post('/save', saveQuotation);
router.get('/:quotationNumber', getQuotationByNumber);
router.put('/:quotationNumber', updateQuotation);

export default router;
