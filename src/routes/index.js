/* eslint-env node */
import express from 'express';
import authRoutes from './authRoutes.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Lead Scoring Backend API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
    },
  });
});

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Lead Scoring API',
    data: {
      version: '1.0.0',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
      },
    },
  });
});

export default router;
