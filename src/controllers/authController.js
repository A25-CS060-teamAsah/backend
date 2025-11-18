/* eslint-env node */
/* global process */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendSuccess, sendError } from '../utils/response.js';
import { validatePassword, validateEmail } from '../utils/validator.js';
import {
  findUserByEmail,
  createUser,
  findUserById,
} from '../services/userService.js';
import { handleDatabaseError } from '../middlewares/errorMiddleware.js';

/**
 * Login Controller
 * @route POST /api/v1/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return sendError(res, emailValidation.message, 400);
    }

    // Find user by email
    const user = await findUserByEmail(email);

    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Return success response
    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      'Login successful'
    );
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Login failed. Please try again', 500);
  }
};

/**
 * Register Controller
 * @route POST /api/v1/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'sales' } = req.body;

    // Validate name
    if (!name || name.trim() === '') {
      return sendError(res, 'Name is required', 400);
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return sendError(res, emailValidation.message, 400);
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return sendError(res, passwordValidation.message, 400);
    }

    // Validate role
    if (role && !['admin', 'sales'].includes(role)) {
      return sendError(res, 'Invalid role. Must be admin or sales', 400);
    }

    // Check if email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return sendError(res, 'Email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await createUser({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Return success response
    return sendSuccess(
      res,
      {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.created_at,
        },
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    console.error('Register error:', error);

    // Handle database errors
    if (error.code) {
      const dbError = handleDatabaseError(error);
      return sendError(res, dbError.message, dbError.statusCode);
    }

    return sendError(res, 'Registration failed. Please try again', 500);
  }
};

/**
 * Get Current User Profile
 * @route GET /api/v1/auth/me
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await findUserById(userId);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, user, 'User profile retrieved successfully');
  } catch (error) {
    console.error('Get profile error:', error);
    return sendError(res, 'Failed to retrieve user profile', 500);
  }
};

/**
 * Logout Controller (optional - for client-side token removal)
 * @route POST /api/v1/auth/logout
 */
export const logout = async (req, res) => {
  try {
    // In JWT, logout is typically handled client-side by removing the token
    // This endpoint is optional and can be used for logging purposes

    return sendSuccess(res, null, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    return sendError(res, 'Logout failed', 500);
  }
};
