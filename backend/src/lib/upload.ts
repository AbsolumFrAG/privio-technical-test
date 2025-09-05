import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'games');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename: timestamp-randomid.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `game-${uniqueSuffix}${extension}`);
  },
});

// File filter to allow only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

// Configure multer upload
export const uploadGameImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file at a time
  },
});

// Helper function to delete uploaded files
export const deleteUploadedFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Helper to get file URL from filename
export const getImageUrl = (filename: string): string => {
  return `/uploads/games/${filename}`;
};

// Helper to extract filename from imageUrl
export const getFilenameFromUrl = (imageUrl: string): string | null => {
  const match = imageUrl.match(/\/uploads\/games\/(.+)$/);
  return match ? match[1] : null;
};

// Helper to delete image by URL
export const deleteImageByUrl = (imageUrl: string): void => {
  const filename = getFilenameFromUrl(imageUrl);
  if (filename) {
    const fullPath = path.join(uploadsDir, filename);
    deleteUploadedFile(fullPath);
  }
};