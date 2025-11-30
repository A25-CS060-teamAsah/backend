/* eslint-env node */
import pool from '../config/database.js';

/**
 * Prediction Service - Handles all database operations for predictions
 * Business logic should be in controllers, NOT here!
 */

/**
 * Create new prediction
 * @param {Object} predictionData - { customerId, probability, willSubscribe, modelVersion }
 * @returns {Promise<Object>}
 */
export const createPrediction = async (predictionData) => {
  try {
    const { customerId, probability, willSubscribe, modelVersion } = predictionData;

    const query = `
      INSERT INTO predictions (customer_id, probability_score, will_subscribe, model_version)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [customerId, probability, willSubscribe, modelVersion || '1.0'];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error in createPrediction:', error);
    throw error;
  }
};

/**
 * Get latest prediction for a customer
 * @param {number} customerId - Customer ID
 * @returns {Promise<Object|null>}
 */
export const getLatestPrediction = async (customerId) => {
  try {
    const query = `
      SELECT * FROM predictions
      WHERE customer_id = $1
      ORDER BY predicted_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [customerId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error in getLatestPrediction:', error);
    throw error;
  }
};

/**
 * Get prediction history for a customer
 * @param {number} customerId - Customer ID
 * @returns {Promise<Array>}
 */
export const getPredictionHistory = async (customerId) => {
  try {
    const query = `
      SELECT * FROM predictions
      WHERE customer_id = $1
      ORDER BY predicted_at DESC
    `;

    const result = await pool.query(query, [customerId]);
    return result.rows;
  } catch (error) {
    console.error('Error in getPredictionHistory:', error);
    throw error;
  }
};

/**
 * Get top leads (customers with high probability scores)
 * @param {Object} options - { limit, threshold }
 * @returns {Promise<Array>}
 */
export const getTopLeads = async (options = {}) => {
  try {
    const { limit = 50, threshold = 0.5 } = options;

    const query = `
      SELECT 
        c.*,
        p.probability_score,
        p.will_subscribe,
        p.predicted_at,
        p.model_version
      FROM customers c
      INNER JOIN LATERAL (
        SELECT probability_score, will_subscribe, predicted_at, model_version
        FROM predictions
        WHERE customer_id = c.id
        ORDER BY predicted_at DESC
        LIMIT 1
      ) p ON true
      WHERE p.probability_score >= $1
      ORDER BY p.probability_score DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [threshold, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error in getTopLeads:', error);
    throw error;
  }
};

/**
 * Get prediction statistics
 * @returns {Promise<Object>}
 */
export const getPredictionStats = async () => {
  try {
    const query = `
      WITH latest_predictions AS (
        SELECT DISTINCT ON (customer_id)
          customer_id,
          probability_score,
          will_subscribe
        FROM predictions
        ORDER BY customer_id, predicted_at DESC
      ),
      customer_counts AS (
        SELECT
          COUNT(DISTINCT c.id) as total_customers,
          COUNT(DISTINCT lp.customer_id) as customers_with_predictions
        FROM customers c
        LEFT JOIN latest_predictions lp ON c.id = lp.customer_id
      )
      SELECT
        COUNT(*) as total_predictions,
        AVG(probability_score) as avg_score,
        COUNT(CASE WHEN will_subscribe = true THEN 1 END) as positive_predictions,
        COUNT(CASE WHEN will_subscribe = false THEN 1 END) as negative_predictions,
        MAX(probability_score) as highest_score,
        MIN(probability_score) as lowest_score,
        COUNT(CASE WHEN probability_score >= 0.75 THEN 1 END) as high_priority_count,
        COUNT(CASE WHEN probability_score >= 0.5 AND probability_score < 0.75 THEN 1 END) as medium_priority_count,
        COUNT(CASE WHEN probability_score < 0.5 THEN 1 END) as low_priority_count,
        (SELECT customers_with_predictions FROM customer_counts) as customers_with_predictions,
        (SELECT total_customers - customers_with_predictions FROM customer_counts) as customers_without_predictions
      FROM latest_predictions
    `;

    const result = await pool.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error in getPredictionStats:', error);
    throw error;
  }
};

/**
 * Delete all predictions for a customer
 * @param {number} customerId - Customer ID
 * @returns {Promise<number>} - Number of deleted predictions
 */
export const deletePredictionsByCustomerId = async (customerId) => {
  try {
    const query = 'DELETE FROM predictions WHERE customer_id = $1';
    const result = await pool.query(query, [customerId]);
    return result.rowCount;
  } catch (error) {
    console.error('Error in deletePredictionsByCustomerId:', error);
    throw error;
  }
};

/**
 * Count total predictions
 * @returns {Promise<number>}
 */
export const countPredictions = async () => {
  try {
    const query = 'SELECT COUNT(*) as total FROM predictions';
    const result = await pool.query(query);
    return parseInt(result.rows[0].total);
  } catch (error) {
    console.error('Error in countPredictions:', error);
    throw error;
  }
};

/**
 * Get customers with predictions (for analytics)
 * @param {number} limit - Maximum number of customers
 * @returns {Promise<Array>}
 */
export const getCustomersWithPredictions = async (limit = 100) => {
  try {
    const query = `
      SELECT 
        c.*,
        p.probability_score,
        p.will_subscribe,
        p.predicted_at
      FROM customers c
      INNER JOIN LATERAL (
        SELECT probability_score, will_subscribe, predicted_at
        FROM predictions
        WHERE customer_id = c.id
        ORDER BY predicted_at DESC
        LIMIT 1
      ) p ON true
      ORDER BY p.predicted_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error in getCustomersWithPredictions:', error);
    throw error;
  }
};
