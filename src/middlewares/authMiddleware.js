/* eslint-env node */
/* global process */
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return sendError(res, 'Authorization header is missing', 401);
    }

    // Check if format is "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return sendError(res, 'Invalid token format. Use: Bearer <token>', 401);
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token has expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', 401);
    }
    return sendError(res, 'Authentication failed', 401);
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return sendError(res, 'Access denied. Admin role required', 403);
  }
  next();
};

/**
 * Middleware to check if user has sales or admin role
 */
export const requireSalesOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'sales') {
    return sendError(res, 'Access denied. Sales or Admin role required', 403);
  }
  next();
};
