/* eslint-env node */
import express from 'express';
import { login, register, getProfile, logout } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

/**
 * Authentication Routes
 * 
 * NOTE: Registration is Admin-only
 * First admin should be created via database seed or direct SQL
 */

// Public routes
router.post('/login', login);

// Protected routes (require authentication)
router.get('/me', authenticate, getProfile);
router.post('/logout', authenticate, logout);

// Admin-only routes
// Only admins can register new users (sales/managers)
router.post('/register', authenticate, requireAdmin(), register);

export default router;
