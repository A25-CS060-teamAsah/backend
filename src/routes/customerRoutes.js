/* eslint-env node */
import express from 'express';
import {
  getAllCustomersHandler,
  getCustomerByIdHandler,
  createCustomerHandler,
  updateCustomerHandler,
  deleteCustomerHandler,
  getCustomerStatsHandler,
  uploadCSVHandler,
  downloadCSVTemplateHandler
} from '../controllers/customerController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { uploadCSV, handleUploadError } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

/**
 * Customer Routes
 * All routes require authentication
 * All authenticated users (admin & sales) can access all features
 * No RBAC restrictions on customer operations
 */

// CSV Template Download
router.get('/csv-template', authenticate, downloadCSVTemplateHandler);

// CSV Upload
router.post(
  '/upload-csv',
  authenticate,
  uploadCSV,
  handleUploadError,
  uploadCSVHandler
);

// Get statistics
router.get('/stats', authenticate, getCustomerStatsHandler);

// Get all customers with pagination
router.get('/', authenticate, getAllCustomersHandler);

// Get customer by ID
router.get('/:id', authenticate, getCustomerByIdHandler);

// Create new customer
router.post('/', authenticate, createCustomerHandler);

// Update customer
router.put('/:id', authenticate, updateCustomerHandler);

// Delete customer
router.delete('/:id', authenticate, deleteCustomerHandler);

export default router;
