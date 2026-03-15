import express from 'express';
import multer from 'multer';
import {
  uploadGalleryImage,
  getGalleriesByCategory,
  getAllCategoriesWithFeatured,
  deleteGalleryImage,
  setFeaturedImage,
  getAdminGalleries
} from '../controllers/gallery.controller.js';

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

router.post('/upload', upload.single('file'), uploadGalleryImage);
router.get('/categories', getAllCategoriesWithFeatured);
router.get('/category/:category', getGalleriesByCategory);
router.get('/admin/all', getAdminGalleries);
router.delete('/:imageId', deleteGalleryImage);
router.put('/:imageId/featured', setFeaturedImage);

export default router;
