/* eslint-env node */
import pool from '../config/database.js';

/**
 * Customer Service - Handles all database operations for customers
 * Business logic should be in controllers, NOT here!
 */

/**
 * Get all customers with pagination and filters
 * @param {Object} options - { page, limit, search, sortBy, order, minAge, maxAge, job, education, housing, loan, hasDefault }
 * @returns {Promise<Array>}
 */
export const getAllCustomers = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'id',
      order = 'ASC',
      minAge,
      maxAge,
      job,
      education,
      housing,
      loan,
      hasDefault,
      marital,
    } = options;

    const offset = (page - 1) * limit;

    // Build query
    let query = `
      SELECT c.*, p.probability_score, p.will_subscribe, p.predicted_at
      FROM customers c
      LEFT JOIN LATERAL (
        SELECT probability_score, will_subscribe, predicted_at
        FROM predictions
        WHERE customer_id = c.id
        ORDER BY predicted_at DESC
        LIMIT 1
      ) p ON true
      WHERE 1=1
    `;

    const queryParams = [];

    // Add search filter (searches in job, education, marital)
    if (search) {
      queryParams.push(`%${search}%`);
      query += ` AND (c.job ILIKE $${queryParams.length} 
                  OR c.education ILIKE $${queryParams.length} 
                  OR c.marital ILIKE $${queryParams.length})`;
    }

    // Add age range filter
    if (minAge) {
      queryParams.push(minAge);
      query += ` AND c.age >= $${queryParams.length}`;
    }

    if (maxAge) {
      queryParams.push(maxAge);
      query += ` AND c.age <= $${queryParams.length}`;
    }

    // Add job filter
    if (job) {
      queryParams.push(job);
      query += ` AND c.job = $${queryParams.length}`;
    }

    // Add education filter
    if (education) {
      queryParams.push(education);
      query += ` AND c.education = $${queryParams.length}`;
    }

    // Add marital filter
    if (marital) {
      queryParams.push(marital);
      query += ` AND c.marital = $${queryParams.length}`;
    }

    // Add housing loan filter
    if (housing !== undefined) {
      queryParams.push(housing === 'true' || housing === true);
      query += ` AND c.has_housing_loan = $${queryParams.length}`;
    }

    // Add personal loan filter
    if (loan !== undefined) {
      queryParams.push(loan === 'true' || loan === true);
      query += ` AND c.has_personal_loan = $${queryParams.length}`;
    }

    // Add default filter
    if (hasDefault !== undefined) {
      queryParams.push(hasDefault === 'true' || hasDefault === true);
      query += ` AND c.has_default = $${queryParams.length}`;
    }

    // Add sorting
    const validSortColumns = [
      'id',
      'age',
      'job',
      'education',
      'created_at',
      'probability_score',
    ];
    const validOrders = ['ASC', 'DESC'];

    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'id';
    const sortOrder = validOrders.includes(order.toUpperCase())
      ? order.toUpperCase()
      : 'ASC';

    // Handle probability_score sorting (from joined table)
    if (sortColumn === 'probability_score') {
      query += ` ORDER BY p.${sortColumn} ${sortOrder} NULLS LAST`;
    } else {
      query += ` ORDER BY c.${sortColumn} ${sortOrder}`;
    }

    // Add pagination
    queryParams.push(limit, offset);
    query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    throw error;
  }
};

/**
 * Count total customers (for pagination)
 * @param {Object} options - { search, minAge, maxAge, job, education, housing, loan, hasDefault, marital }
 * @returns {Promise<number>}
 */
export const countCustomers = async (options = {}) => {
  try {
    const {
      search = '',
      minAge,
      maxAge,
      job,
      education,
      housing,
      loan,
      hasDefault,
      marital,
    } = options;

    let query = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
    const queryParams = [];

    // Add search filter
    if (search) {
      queryParams.push(`%${search}%`);
      query += ` AND (job ILIKE $${queryParams.length} 
                  OR education ILIKE $${queryParams.length} 
                  OR marital ILIKE $${queryParams.length})`;
    }

    // Add age range filter
    if (minAge) {
      queryParams.push(minAge);
      query += ` AND age >= $${queryParams.length}`;
    }

    if (maxAge) {
      queryParams.push(maxAge);
      query += ` AND age <= $${queryParams.length}`;
    }

    // Add job filter
    if (job) {
      queryParams.push(job);
      query += ` AND job = $${queryParams.length}`;
    }

    // Add education filter
    if (education) {
      queryParams.push(education);
      query += ` AND education = $${queryParams.length}`;
    }

    // Add marital filter
    if (marital) {
      queryParams.push(marital);
      query += ` AND marital = $${queryParams.length}`;
    }

    // Add housing loan filter
    if (housing !== undefined) {
      queryParams.push(housing === 'true' || housing === true);
      query += ` AND has_housing_loan = $${queryParams.length}`;
    }

    // Add personal loan filter
    if (loan !== undefined) {
      queryParams.push(loan === 'true' || loan === true);
      query += ` AND has_personal_loan = $${queryParams.length}`;
    }

    // Add default filter
    if (hasDefault !== undefined) {
      queryParams.push(hasDefault === 'true' || hasDefault === true);
      query += ` AND has_default = $${queryParams.length}`;
    }

    const result = await pool.query(query, queryParams);
    return parseInt(result.rows[0].total);
  } catch (error) {
    console.error('Error in countCustomers:', error);
    throw error;
  }
};

/**
 * Get customer by ID
 * @param {number} id - Customer ID
 * @returns {Promise<Object|null>}
 */
export const getCustomerById = async (id) => {
  try {
    const query = `
      SELECT c.*, p.probability_score, p.will_subscribe, p.predicted_at, p.model_version
      FROM customers c
      LEFT JOIN LATERAL (
        SELECT probability_score, will_subscribe, predicted_at, model_version
        FROM predictions
        WHERE customer_id = c.id
        ORDER BY predicted_at DESC
        LIMIT 1
      ) p ON true
      WHERE c.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    throw error;
  }
};

/**
 * Create new customer
 * @param {Object} customerData - Customer data
 * @returns {Promise<Object>}
 */
export const createCustomer = async (customerData) => {
  try {
    const {
      age,
      job,
      marital,
      education,
      // Accept both field name formats
      has_default,
      default: defaultValue,
      has_housing_loan,
      housing,
      has_personal_loan,
      loan,
      contact,
      month,
      day_of_week,
      campaign,
      pdays,
      previous,
      poutcome,
    } = customerData;

    const query = `
      INSERT INTO customers (
        age, job, marital, education,
        has_default, has_housing_loan, has_personal_loan,
        contact, month, day_of_week,
        campaign, pdays, previous, poutcome
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      age,
      job,
      marital,
      education,
      has_default ?? defaultValue ?? false,  // Support both field names
      has_housing_loan ?? housing ?? false,
      has_personal_loan ?? loan ?? false,
      contact,
      month,
      day_of_week,
      campaign || 1,
      pdays || 999,
      previous || 0,
      poutcome || 'unknown',
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error in createCustomer:', error);
    throw error;
  }
};

/**
 * Update customer
 * @param {number} id - Customer ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>}
 */
export const updateCustomer = async (id, updates) => {
  try {
    // Transform API field names to database column names
    const fieldMapping = {
      'default': 'has_default',
      'housing': 'has_housing_loan',
      'loan': 'has_personal_loan'
    };

    const transformedUpdates = {};
    Object.entries(updates).forEach(([key, value]) => {
      // Use mapped name if exists, otherwise use original key
      const dbKey = fieldMapping[key] || key;
      transformedUpdates[dbKey] = value;
    });

    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
    // IMPORTANT: Quote column names to handle reserved keywords
    Object.entries(transformedUpdates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        fields.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `
      UPDATE customers
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    throw error;
  }
};

/**
 * Delete customer
 * @param {number} id - Customer ID
 * @returns {Promise<boolean>}
 */
export const deleteCustomer = async (id) => {
  try {
    const query = 'DELETE FROM customers WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    throw error;
  }
};

/**
 * Get customers without predictions (for batch prediction)
 * @param {number} limit - Maximum number of customers
 * @returns {Promise<Array>}
 */
export const getCustomersWithoutPredictions = async (limit = 100) => {
  try {
    const query = `
      SELECT c.*
      FROM customers c
      LEFT JOIN predictions p ON c.id = p.customer_id
      WHERE p.id IS NULL
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error in getCustomersWithoutPredictions:', error);
    throw error;
  }
};

/**
 * Get customer statistics
 * @returns {Promise<Object>}
 */
export const getCustomerStats = async () => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_customers,
        AVG(age) as avg_age,
        COUNT(CASE WHEN has_housing_loan = true THEN 1 END) as with_housing_loan,
        COUNT(CASE WHEN has_personal_loan = true THEN 1 END) as with_personal_loan,
        COUNT(DISTINCT job) as unique_jobs,
        COUNT(DISTINCT education) as unique_education_levels
      FROM customers
    `;

    const result = await pool.query(statsQuery);
    return result.rows[0];
  } catch (error) {
    console.error('Error in getCustomerStats:', error);
    throw error;
  }
};

/**
 * Bulk create customers from CSV
 * @param {Array} customers - Array of customer objects
 * @returns {Promise<Object>} Result with created and failed counts
 */
export const bulkCreateCustomers = async (customers) => {
  const client = await pool.connect();
  const results = {
    created: [],
    failed: [],
    successCount: 0,
    failedCount: 0,
  };

  try {
    await client.query('BEGIN');

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];

      try {
        const query = `
          INSERT INTO customers (
            age, job, marital, education, 
            has_default, has_housing_loan, has_personal_loan,
            contact, month, day_of_week, 
            campaign, pdays, previous, poutcome
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id, age, job, education
        `;

        const values = [
          customer.age,
          customer.job,
          customer.marital,
          customer.education,
          customer.default || customer.has_default || false,  // Support both field names
          customer.housing || customer.has_housing_loan || false,
          customer.loan || customer.has_personal_loan || false,
          customer.contact,
          customer.month,
          customer.day_of_week,
          customer.campaign,
          customer.pdays,
          customer.previous,
          customer.poutcome,
        ];

        const result = await client.query(query, values);

        results.created.push({
          row: customer.row || i + 1,
          id: result.rows[0].id,
          data: result.rows[0],
        });
        results.successCount++;
      } catch (error) {
        results.failed.push({
          row: customer.row || i + 1,
          data: customer,
          error: error.message,
        });
        results.failedCount++;
      }
    }

    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in bulkCreateCustomers:', error);
    throw error;
  } finally {
    client.release();
  }
};
