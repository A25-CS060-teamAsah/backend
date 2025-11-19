/* eslint-env node */
import { sendSuccess, sendError } from '../utils/response.js';
import { getCustomerById } from '../services/customerService.js';
import { getCustomersWithoutPredictions } from '../services/customerService.js';
import {
  createPrediction,
  getPredictionHistory,
  getTopLeads,
  getPredictionStats,
} from '../services/predictionService.js';
import { predictCustomer, batchPredict } from '../services/mlService.js';

/**
 * Prediction Controller
 * Handles business logic for prediction operations
 * Integrates with ML service and database
 */

/**
 * Predict single customer
 * @route POST /api/v1/predictions/customer/:id
 */
export const predictSingleCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return sendError(res, 'Invalid customer ID', 400);
    }

    // Get customer data
    const customer = await getCustomerById(parseInt(id));
    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    // Call ML service
    const prediction = await predictCustomer(customer);

    // Save prediction to database
    const savedPrediction = await createPrediction({
      customerId: customer.id,
      probability: prediction.probability,
      willSubscribe: prediction.willSubscribe,
      modelVersion: prediction.modelVersion,
    });

    return sendSuccess(
      res,
      {
        customer: {
          id: customer.id,
          age: customer.age,
          job: customer.job,
          education: customer.education,
        },
        prediction: {
          probability: savedPrediction.probability_score,
          willSubscribe: savedPrediction.will_subscribe,
          modelVersion: savedPrediction.model_version,
          predictedAt: savedPrediction.predicted_at,
        },
      },
      'Prediction completed successfully'
    );
  } catch (error) {
    console.error('Predict single customer error:', error);

    // Check if ML service error
    if (error.message.includes('ML Service')) {
      return sendError(res, error.message, 503);
    }

    return sendError(res, 'Prediction failed', 500);
  }
};

/**
 * Batch predict customers without predictions
 * @route POST /api/v1/predictions/batch
 */
export const predictBatchCustomers = async (req, res) => {
  try {
    const { limit = 100 } = req.body;

    // Validate limit
    const validLimit = Math.min(Math.max(1, parseInt(limit)), 500); // Max 500 at once

    // Get customers without predictions
    const customers = await getCustomersWithoutPredictions(validLimit);

    if (customers.length === 0) {
      return sendSuccess(res, {
        message: 'No customers without predictions found',
        predicted: 0,
      });
    }

    // Call ML service for batch prediction
    const predictions = await batchPredict(customers);

    // Save all predictions to database
    let successCount = 0;
    let failedCount = 0;
    const results = [];

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const prediction = predictions[i];

      if (prediction.error) {
        failedCount++;
        results.push({
          customerId: customer.id,
          success: false,
          error: prediction.error,
        });
        continue;
      }

      try {
        await createPrediction({
          customerId: customer.id,
          probability: prediction.probability,
          willSubscribe: prediction.willSubscribe,
          modelVersion: prediction.modelVersion,
        });
        successCount++;
        results.push({
          customerId: customer.id,
          success: true,
          probability: prediction.probability,
        });
      } catch (error) {
        failedCount++;
        results.push({
          customerId: customer.id,
          success: false,
          error: error.message,
        });
      }
    }

    return sendSuccess(res, {
      summary: {
        total: customers.length,
        success: successCount,
        failed: failedCount,
      },
      results,
    });
  } catch (error) {
    console.error('Batch predict error:', error);

    if (error.message.includes('ML Service')) {
      return sendError(res, error.message, 503);
    }

    return sendError(res, 'Batch prediction failed', 500);
  }
};

/**
 * Get top leads (high probability customers)
 * @route GET /api/v1/predictions/top-leads
 */
export const getTopLeadsHandler = async (req, res) => {
  try {
    const { limit = 50, threshold = 0.5 } = req.query;

    // Validate params
    const validLimit = Math.min(Math.max(1, parseInt(limit)), 200);
    const validThreshold = Math.max(0, Math.min(1, parseFloat(threshold)));

    const leads = await getTopLeads({
      limit: validLimit,
      threshold: validThreshold,
    });

    return sendSuccess(res, {
      leads,
      count: leads.length,
      threshold: validThreshold,
    });
  } catch (error) {
    console.error('Get top leads error:', error);
    return sendError(res, 'Failed to retrieve top leads', 500);
  }
};

/**
 * Get prediction statistics
 * @route GET /api/v1/predictions/stats
 */
export const getPredictionStatsHandler = async (req, res) => {
  try {
    const stats = await getPredictionStats();

    return sendSuccess(res, {
      totalPredictions: parseInt(stats.total_predictions),
      averageScore: parseFloat(stats.avg_score || 0).toFixed(4),
      positivePredictions: parseInt(stats.positive_predictions),
      negativePredictions: parseInt(stats.negative_predictions),
      highestScore: parseFloat(stats.highest_score || 0).toFixed(4),
      lowestScore: parseFloat(stats.lowest_score || 0).toFixed(4),
      conversionRate: (
        (parseInt(stats.positive_predictions) /
          parseInt(stats.total_predictions)) *
        100
      ).toFixed(2),
    });
  } catch (error) {
    console.error('Get prediction stats error:', error);
    return sendError(res, 'Failed to retrieve statistics', 500);
  }
};

/**
 * Get customer prediction history
 * @route GET /api/v1/predictions/customer/:id/history
 */
export const getCustomerPredictionHistoryHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return sendError(res, 'Invalid customer ID', 400);
    }

    // Check if customer exists
    const customer = await getCustomerById(parseInt(id));
    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    // Get prediction history
    const history = await getPredictionHistory(parseInt(id));

    return sendSuccess(res, {
      customerId: parseInt(id),
      totalPredictions: history.length,
      history,
    });
  } catch (error) {
    console.error('Get prediction history error:', error);
    return sendError(res, 'Failed to retrieve prediction history', 500);
  }
};
