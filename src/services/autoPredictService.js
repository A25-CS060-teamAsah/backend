/* eslint-env node */
/* global process, setImmediate */
import { getCustomersWithoutPredictions, getCustomerById } from './customerService.js';
import { createPrediction } from './predictionService.js';
import { predictCustomer, batchPredict, checkMLServiceHealth } from './mlService.js';
import {
  getCachedPrediction,
  setCachedPrediction,
  setAutoPredictStatus,
  markPendingPrediction,
  removePendingPrediction,
  isPendingPrediction,
} from './cacheService.js';

/**
 * Auto Predict Service
 * Team A25-CS060
 *
 * Handles automatic prediction for customers
 */

// Configuration
const BATCH_SIZE = parseInt(process.env.AUTO_PREDICT_BATCH_SIZE) || 50;

/**
 * Predict single customer with caching
 * @param {number} customerId - Customer ID
 * @param {boolean} forceRefresh - Force new prediction even if cached
 * @returns {Promise<Object>} - Prediction result
 */
export const predictSingleWithCache = async (customerId, forceRefresh = false) => {
  try {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedPrediction(customerId);
      if (cached) {
        console.log(`[AutoPredict] Cache HIT for customer ${customerId}`);
        return { ...cached, fromCache: true };
      }
    }

    // Check if already pending
    if (isPendingPrediction(customerId)) {
      console.log(`[AutoPredict] Customer ${customerId} already pending prediction`);
      return { pending: true };
    }

    // Mark as pending
    markPendingPrediction(customerId);

    // Get customer data
    const customer = await getCustomerById(customerId);
    if (!customer) {
      removePendingPrediction(customerId);
      throw new Error(`Customer ${customerId} not found`);
    }

    // Call ML service
    const prediction = await predictCustomer(customer);

    // Save to database
    const savedPrediction = await createPrediction({
      customerId: customer.id,
      probability: prediction.probability,
      willSubscribe: prediction.willSubscribe,
      modelVersion: prediction.modelVersion,
    });

    // Cache the result
    const result = {
      customerId: customer.id,
      probability: savedPrediction.probability_score,
      willSubscribe: savedPrediction.will_subscribe,
      modelVersion: savedPrediction.model_version,
      predictedAt: savedPrediction.predicted_at,
      fromCache: false,
    };

    setCachedPrediction(customerId, result);
    removePendingPrediction(customerId);

    console.log(`[AutoPredict] Predicted customer ${customerId}: ${result.probability}`);

    return result;
  } catch (error) {
    removePendingPrediction(customerId);
    console.error(`[AutoPredict] Error predicting customer ${customerId}:`, error.message);
    throw error;
  }
};

/**
 * Auto predict all customers without predictions
 * Called by cron job
 * @returns {Promise<Object>} - Summary of predictions
 */
export const autoPredictNewCustomers = async () => {
  const startTime = Date.now();
  const summary = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    console.log('[AutoPredict] Starting auto prediction job...');
    setAutoPredictStatus('running');

    // Check ML service health first
    const mlHealth = await checkMLServiceHealth();
    if (mlHealth.status !== 'OK') {
      console.log('[AutoPredict] ML Service not available, skipping...');
      setAutoPredictStatus('skipped - ML service unavailable');
      return { ...summary, skipped: true, reason: 'ML service unavailable' };
    }

    // Get customers without predictions
    const customers = await getCustomersWithoutPredictions(BATCH_SIZE);
    summary.total = customers.length;

    if (customers.length === 0) {
      console.log('[AutoPredict] No customers without predictions found');
      setAutoPredictStatus('completed - no new customers');
      return summary;
    }

    console.log(`[AutoPredict] Found ${customers.length} customers without predictions`);

    // Use batch prediction for efficiency
    if (customers.length > 1) {
      try {
        const predictions = await batchPredict(customers);

        // Save each prediction
        for (let i = 0; i < customers.length; i++) {
          const customer = customers[i];
          const prediction = predictions[i];

          if (prediction.error) {
            summary.failed++;
            summary.errors.push({
              customerId: customer.id,
              error: prediction.error,
            });
            continue;
          }

          try {
            const savedPrediction = await createPrediction({
              customerId: customer.id,
              probability: prediction.probability,
              willSubscribe: prediction.willSubscribe,
              modelVersion: prediction.modelVersion,
            });

            // Cache result
            setCachedPrediction(customer.id, {
              customerId: customer.id,
              probability: savedPrediction.probability_score,
              willSubscribe: savedPrediction.will_subscribe,
              modelVersion: savedPrediction.model_version,
              predictedAt: savedPrediction.predicted_at,
            });

            summary.success++;
          } catch (dbError) {
            summary.failed++;
            summary.errors.push({
              customerId: customer.id,
              error: dbError.message,
            });
          }
        }
      } catch (batchError) {
        console.error('[AutoPredict] Batch prediction failed:', batchError.message);

        // Fallback to single predictions
        for (const customer of customers) {
          try {
            await predictSingleWithCache(customer.id, true);
            summary.success++;
          } catch (singleError) {
            summary.failed++;
            summary.errors.push({
              customerId: customer.id,
              error: singleError.message,
            });
          }
        }
      }
    } else {
      // Single customer - use single prediction
      try {
        await predictSingleWithCache(customers[0].id, true);
        summary.success++;
      } catch (error) {
        summary.failed++;
        summary.errors.push({
          customerId: customers[0].id,
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[AutoPredict] Completed: ${summary.success}/${summary.total} success, ${summary.failed} failed (${duration}ms)`);

    setAutoPredictStatus(`completed - ${summary.success}/${summary.total} predicted`);

    return summary;
  } catch (error) {
    console.error('[AutoPredict] Job failed:', error.message);
    setAutoPredictStatus(`error - ${error.message}`);

    return {
      ...summary,
      error: error.message,
    };
  }
};

/**
 * Trigger prediction for newly created customer
 * Non-blocking - runs in background
 * @param {number} customerId - Customer ID
 */
export const triggerPredictionForNewCustomer = (customerId) => {
  // Run in background (non-blocking)
  setImmediate(async () => {
    try {
      console.log(`[AutoPredict] Triggering prediction for new customer ${customerId}`);
      await predictSingleWithCache(customerId, true);
    } catch (error) {
      console.error(`[AutoPredict] Failed to predict new customer ${customerId}:`, error.message);
    }
  });
};

/**
 * Trigger batch prediction for multiple customers
 * Non-blocking - runs in background
 * @param {Array<number>} customerIds - Array of customer IDs
 */
export const triggerBatchPrediction = (customerIds) => {
  if (!customerIds || customerIds.length === 0) return;

  setImmediate(async () => {
    try {
      console.log(`[AutoPredict] Triggering batch prediction for ${customerIds.length} customers`);

      for (const customerId of customerIds) {
        try {
          await predictSingleWithCache(customerId, true);
        } catch (error) {
          console.error(`[AutoPredict] Failed to predict customer ${customerId}:`, error.message);
        }
      }
    } catch (error) {
      console.error('[AutoPredict] Batch trigger failed:', error.message);
    }
  });
};

export default {
  predictSingleWithCache,
  autoPredictNewCustomers,
  triggerPredictionForNewCustomer,
  triggerBatchPrediction,
};
