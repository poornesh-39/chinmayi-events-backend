import express from 'express';
import {
  generateQuotationPDF,
  saveQuotation,
  getQuotationByNumber,
  updateQuotation
} from '../controllers/quotation.controller.js';

const router = express.Router();

router.post('/generate-pdf', generateQuotationPDF);
router.post('/save', saveQuotation);
router.get('/:quotationNumber', getQuotationByNumber);
router.put('/:quotationNumber', updateQuotation);

export default router;
