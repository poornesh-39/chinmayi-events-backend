import express from 'express';
import multer from 'multer';
import {
  uploadGalleryImage,
  getGalleriesByCategory,
  getAllCategoriesWithFeatured,
  getHighlights,
  deleteGalleryImage,
  setFeaturedImage,
  toggleHighlightImage,
  getAdminGalleries
} from '../controllers/gallery.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max size
});

// Public: what the website itself renders.
router.get('/categories', getAllCategoriesWithFeatured);
router.get('/highlights', getHighlights);
router.get('/category/:category', getGalleriesByCategory);

// Admin only. requireAuth sits ahead of multer deliberately — otherwise an
// anonymous request buffers its file into memory before being rejected.
router.post('/upload', requireAuth, upload.single('file'), uploadGalleryImage);
router.get('/admin/all', requireAuth, getAdminGalleries);
router.delete('/:imageId', requireAuth, deleteGalleryImage);
router.put('/:imageId/featured', requireAuth, setFeaturedImage);
router.put('/:imageId/highlight', requireAuth, toggleHighlightImage);

export default router;
