/* eslint-env node */
import express from 'express';
import { login, register, getProfile, logout } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes (require authentication)
router.get('/me', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;
