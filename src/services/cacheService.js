/* eslint-env node */
/* global process */
import NodeCache from 'node-cache';

/**
 * Cache Service - In-memory caching for predictions
 * Team A25-CS060
 *
 * Used to reduce redundant ML API calls and database queries
 */

// Cache configuration
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300; // 5 minutes default
const CACHE_CHECK_PERIOD = parseInt(process.env.CACHE_CHECK_PERIOD) || 60; // Check every 60 seconds

// Initialize cache
const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: CACHE_CHECK_PERIOD,
  useClones: false, // Better performance for objects
});

/**
 * Get prediction from cache
 * @param {number} customerId - Customer ID
 * @returns {Object|null} - Cached prediction or null
 */
export const getCachedPrediction = (customerId) => {
  const key = `prediction_${customerId}`;
  return cache.get(key) || null;
};

/**
 * Set prediction in cache
 * @param {number} customerId - Customer ID
 * @param {Object} prediction - Prediction data
 * @param {number} ttl - Optional TTL in seconds
 */
export const setCachedPrediction = (customerId, prediction, ttl = CACHE_TTL) => {
  const key = `prediction_${customerId}`;
  cache.set(key, prediction, ttl);
};

/**
 * Delete prediction from cache
 * @param {number} customerId - Customer ID
 */
export const deleteCachedPrediction = (customerId) => {
  const key = `prediction_${customerId}`;
  cache.del(key);
};

/**
 * Clear all predictions from cache
 */
export const clearAllPredictions = () => {
  const keys = cache.keys().filter(key => key.startsWith('prediction_'));
  cache.del(keys);
};

/**
 * Get cache statistics
 * @returns {Object} - Cache stats
 */
export const getCacheStats = () => {
  const stats = cache.getStats();
  const keys = cache.keys();

  return {
    hits: stats.hits,
    misses: stats.misses,
    keys: keys.length,
    predictionKeys: keys.filter(k => k.startsWith('prediction_')).length,
    hitRate: stats.hits + stats.misses > 0
      ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%'
      : '0%',
  };
};

/**
 * Set auto predict status in cache
 * @param {string} status - Status message
 */
export const setAutoPredictStatus = (status) => {
  cache.set('auto_predict_status', {
    status,
    lastRun: new Date().toISOString(),
  }, 0); // No expiration
};

/**
 * Get auto predict status
 * @returns {Object|null} - Status info
 */
export const getAutoPredictStatus = () => {
  return cache.get('auto_predict_status') || null;
};

/**
 * Mark customer as pending prediction
 * @param {number} customerId - Customer ID
 */
export const markPendingPrediction = (customerId) => {
  const key = `pending_${customerId}`;
  cache.set(key, true, 600); // 10 minutes TTL
};

/**
 * Check if customer is pending prediction
 * @param {number} customerId - Customer ID
 * @returns {boolean}
 */
export const isPendingPrediction = (customerId) => {
  const key = `pending_${customerId}`;
  return cache.get(key) === true;
};

/**
 * Remove pending prediction mark
 * @param {number} customerId - Customer ID
 */
export const removePendingPrediction = (customerId) => {
  const key = `pending_${customerId}`;
  cache.del(key);
};

// Log cache events in development
if (process.env.NODE_ENV === 'development') {
  cache.on('set', (key) => {
    console.log(`[Cache] SET: ${key}`);
  });

  cache.on('del', (key) => {
    console.log(`[Cache] DEL: ${key}`);
  });

  cache.on('expired', (key) => {
    console.log(`[Cache] EXPIRED: ${key}`);
  });
}

export default cache;
