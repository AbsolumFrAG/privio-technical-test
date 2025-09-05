import express, { Router } from 'express';
import { uploadGameImage, getImageUrl } from '../lib/upload.js';
import { authenticateToken } from '../middleware/auth.js';

const router: Router = express.Router();

// POST /api/upload/game-image
router.post('/game-image', authenticateToken, (req, res, next) => {
  uploadGameImage.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          message: 'Image size must be less than 5MB',
        });
      }
      
      if (err.message === 'Only JPEG, PNG, and WebP images are allowed') {
        return res.status(400).json({
          error: 'Invalid file type',
          message: err.message,
        });
      }

      return res.status(400).json({
        error: 'Upload failed',
        message: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please select an image to upload',
      });
    }

    const imageUrl = getImageUrl(req.file.filename);

    res.json({
      success: true,
      imageUrl,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  });
});

export default router;