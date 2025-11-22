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
import { getJobStatus, triggerManualPredictJob } from '../jobs/predictionJob.js';
import { getCacheStats } from '../services/cacheService.js';
import { sendSuccess, sendError } from '../utils/response.js';

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

/**
 * Auto Predict Job Routes
 */

// Get job status and cache stats
router.get('/job/status', authenticate, (req, res) => {
  try {
    const status = getJobStatus();
    return sendSuccess(res, status, 'Job status retrieved');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
});

// Get cache statistics
router.get('/cache/stats', authenticate, (req, res) => {
  try {
    const stats = getCacheStats();
    return sendSuccess(res, stats, 'Cache stats retrieved');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
});

// Manually trigger auto predict job
router.post('/job/trigger', authenticate, async (req, res) => {
  try {
    const result = await triggerManualPredictJob();
    return sendSuccess(res, result, 'Auto predict job triggered');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
});

export default router;
