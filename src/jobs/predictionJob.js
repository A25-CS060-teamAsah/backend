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
let totalRuns = 0;
let lastRunTime = null;

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
      totalRuns++;
      lastRunTime = new Date().toISOString();
      console.log('[CronJob] Auto predict job completed:', lastJobResult);
    } catch (error) {
      console.error('[CronJob] Auto predict job failed:', error.message);
      lastJobResult = { error: error.message, timestamp: new Date().toISOString() };
      totalRuns++;
      lastRunTime = new Date().toISOString();
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
  const enableAutoPredictCron = process.env.ENABLE_AUTO_PREDICT_CRON !== 'false';

  // Calculate next run time (approximate - every 2 minutes)
  let nextRunTime = null;
  if (lastRunTime && enableAutoPredictCron) {
    const lastRun = new Date(lastRunTime);
    const nextRun = new Date(lastRun.getTime() + 2 * 60 * 1000); // Add 2 minutes
    nextRunTime = nextRun.toISOString();
  }

  return {
    isRunning: isJobRunning,
    cronEnabled: enableAutoPredictCron,
    lastRunTime: lastRunTime,
    nextRunTime: nextRunTime,
    cronSchedule: AUTO_PREDICT_CRON,
    totalRuns: totalRuns,
    lastResult: lastJobResult,
    autoPredictStatus: getAutoPredictStatus(),
    cacheStats: getCacheStats(),
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
    totalRuns++;
    lastRunTime = new Date().toISOString();
    return { message: 'Auto-predict job completed successfully', results: lastJobResult };
  } catch (error) {
    console.error('[CronJob] Manual job failed:', error.message);
    lastJobResult = { error: error.message, timestamp: new Date().toISOString() };
    totalRuns++;
    lastRunTime = new Date().toISOString();
    throw error;
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
