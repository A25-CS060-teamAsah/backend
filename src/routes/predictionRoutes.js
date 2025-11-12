/* eslint-env node */
import express from 'express';
import {
  predictSingleCustomer,
  predictBatchCustomers,
  getTopLeadsHandler,
  getPredictionStatsHandler,
  getCustomerPredictionHistoryHandler,
} from '../controllers/predictionController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Prediction Routes
 * All routes require authentication
 */

// Get statistics
router.get('/stats', authenticate, getPredictionStatsHandler);

// Get top leads
router.get('/top-leads', authenticate, getTopLeadsHandler);

// Get customer prediction history
router.get('/customer/:id/history', authenticate, getCustomerPredictionHistoryHandler);

// Predict single customer
router.post('/customer/:id', authenticate, predictSingleCustomer);

// Batch predict customers
router.post('/batch', authenticate, predictBatchCustomers);

export default router;
