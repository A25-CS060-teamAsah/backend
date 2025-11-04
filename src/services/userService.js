/* eslint-env node */
import pool from '../config/database.js';

/**
 * User Service - Handles all database operations for users
 */

/**
 * Find user by email
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export const findUserByEmail = async (email) => {
  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error in findUserByEmail:', error);
    throw error;
  }
};

/**
 * Find user by ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
export const findUserById = async (id) => {
  try {
    const query = 'SELECT id, email, role, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error in findUserById:', error);
    throw error;
  }
};

/**
 * Create new user
 * @param {Object} userData - { email, password, role }
 * @returns {Promise<Object>}
 */
export const createUser = async (userData) => {
  try {
    const { email, password, role = 'sales' } = userData;

    const query = `
      INSERT INTO users (email, password, role)
      VALUES ($1, $2, $3)
      RETURNING id, email, role, created_at
    `;

    const result = await pool.query(query, [email, password, role]);
    return result.rows[0];
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
};

/**
 * Get all users
 * @returns {Promise<Array>}
 */
export const getAllUsers = async () => {
  try {
    const query = 'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
};

/**
 * Update user
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<Object|null>}
 */
export const updateUser = async (id, updates) => {
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, role, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error in updateUser:', error);
    throw error;
  }
};

/**
 * Delete user
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export const deleteUser = async (id) => {
  try {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error in deleteUser:', error);
    throw error;
  }
};

/**
 * Count total users
 * @returns {Promise<number>}
 */
export const countUsers = async () => {
  try {
    const query = 'SELECT COUNT(*) as total FROM users';
    const result = await pool.query(query);
    return parseInt(result.rows[0].total);
  } catch (error) {
    console.error('Error in countUsers:', error);
    throw error;
  }
};
