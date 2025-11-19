/* eslint-env node */
/* global process */
import express from 'express';
import authRoutes from './authRoutes.js';
import customerRoutes from './customerRoutes.js';
import predictionRoutes from './predictionRoutes.js';
import { checkMLServiceHealth } from '../services/mlService.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/predictions', predictionRoutes);

// Health check endpoint (includes ML service status)
router.get('/health', async (req, res) => {
  const mlHealth = await checkMLServiceHealth();

  res.json({
    success: true,
    message: 'API is running',
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Lead Scoring Backend API',
      version: '2.0.0', // Week 2
      environment: process.env.NODE_ENV || 'production',
      mlService: {
        status: mlHealth.status,
        message: mlHealth.message,
      },
    },
  });
});

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Lead Scoring API',
    data: {
      version: '2.0.0',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        customers: '/api/v1/customers',
        predictions: '/api/v1/predictions',
      },
      documentation: 'See README.md for API documentation',
    },
  });
});

export default router;
