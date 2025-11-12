/**
 * File Upload Middleware
 * Team A25-CS060
 * 
 * Handles file uploads using multer
 */

import multer from 'multer';
import path from 'path';

// Configure storage (memory storage for CSV processing)
const storage = multer.memoryStorage();

// File filter - only allow CSV files
const fileFilter = (req, file, cb) => {
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ext !== '.csv') {
    return cb(new Error('Only CSV files are allowed'), false);
  }

  // Check MIME type
  const allowedMimes = ['text/csv', 'application/csv', 'text/plain'];
  
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Please upload a CSV file'), false);
  }

  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1 // Only one file at a time
  }
});

/**
 * Middleware for single CSV file upload
 * Field name: 'csvfile'
 */
export const uploadCSV = upload.single('csvfile');

/**
 * Error handler for multer errors
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer error
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file',
        message: 'Unexpected file field. Use field name: csvfile'
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Upload error',
      message: err.message
    });
  }

  if (err) {
    // Other errors (e.g., from fileFilter)
    return res.status(400).json({
      success: false,
      error: 'Invalid file',
      message: err.message
    });
  }

  next();
};
