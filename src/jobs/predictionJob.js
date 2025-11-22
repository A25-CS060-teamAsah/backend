/* eslint-env node */
/* global process */
import cron from 'node-cron';
import { autoPredictNewCustomers } from '../services/autoPredictService.js';
import { getCacheStats, getAutoPredictStatus } from '../services/cacheService.js';

/**
 * Prediction Cron Jobs
 * Team A25-CS060
 *
 * Scheduled tasks for automatic predictions
 */

// Job status
let isJobRunning = false;
let lastJobResult = null;

// Configuration
const AUTO_PREDICT_CRON = process.env.AUTO_PREDICT_CRON || '*/2 * * * *'; // Every 2 minutes
const CACHE_CLEANUP_CRON = process.env.CACHE_CLEANUP_CRON || '0 * * * *'; // Every hour

/**
 * Auto predict job - runs every 2 minutes
 */
const autoPredictJob = cron.schedule(
  AUTO_PREDICT_CRON,
  async () => {
    // Prevent overlapping runs
    if (isJobRunning) {
      console.log('[CronJob] Auto predict job already running, skipping...');
      return;
    }

    isJobRunning = true;

    try {
      console.log('[CronJob] Running auto predict job...');
      lastJobResult = await autoPredictNewCustomers();
      console.log('[CronJob] Auto predict job completed:', lastJobResult);
    } catch (error) {
      console.error('[CronJob] Auto predict job failed:', error.message);
      lastJobResult = { error: error.message, timestamp: new Date().toISOString() };
    } finally {
      isJobRunning = false;
    }
  },
  {
    scheduled: false, // Don't start automatically
    timezone: 'Asia/Jakarta',
  }
);

/**
 * Cache stats logging job - runs every hour
 */
const cacheStatsJob = cron.schedule(
  CACHE_CLEANUP_CRON,
  () => {
    const stats = getCacheStats();
    console.log('[CronJob] Cache Statistics:', stats);
  },
  {
    scheduled: false,
    timezone: 'Asia/Jakarta',
  }
);

/**
 * Start all cron jobs
 */
export const startCronJobs = () => {
  const enableAutoPredictCron = process.env.ENABLE_AUTO_PREDICT_CRON !== 'false';

  if (enableAutoPredictCron) {
    autoPredictJob.start();
    console.log(`[CronJob] Auto predict job started (schedule: ${AUTO_PREDICT_CRON})`);

    cacheStatsJob.start();
    console.log(`[CronJob] Cache stats job started (schedule: ${CACHE_CLEANUP_CRON})`);
  } else {
    console.log('[CronJob] Auto predict cron is disabled');
  }
};

/**
 * Stop all cron jobs
 */
export const stopCronJobs = () => {
  autoPredictJob.stop();
  cacheStatsJob.stop();
  console.log('[CronJob] All cron jobs stopped');
};

/**
 * Get job status
 * @returns {Object} - Job status info
 */
export const getJobStatus = () => {
  return {
    isRunning: isJobRunning,
    lastResult: lastJobResult,
    autoPredictStatus: getAutoPredictStatus(),
    cacheStats: getCacheStats(),
    schedules: {
      autoPredict: AUTO_PREDICT_CRON,
      cacheCleanup: CACHE_CLEANUP_CRON,
    },
  };
};

/**
 * Manually trigger auto predict job
 * @returns {Promise<Object>} - Job result
 */
export const triggerManualPredictJob = async () => {
  if (isJobRunning) {
    return { error: 'Job already running', isRunning: true };
  }

  isJobRunning = true;

  try {
    console.log('[CronJob] Manual auto predict job triggered');
    lastJobResult = await autoPredictNewCustomers();
    return lastJobResult;
  } catch (error) {
    console.error('[CronJob] Manual job failed:', error.message);
    lastJobResult = { error: error.message, timestamp: new Date().toISOString() };
    return lastJobResult;
  } finally {
    isJobRunning = false;
  }
};

export default {
  startCronJobs,
  stopCronJobs,
  getJobStatus,
  triggerManualPredictJob,
};
