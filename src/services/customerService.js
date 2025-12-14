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

    // Add search filter (searches in name, job, education, marital)
    if (search) {
      queryParams.push(`%${search}%`);
      query += ` AND (c.name ILIKE $${queryParams.length}
                  OR c.job ILIKE $${queryParams.length}
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

    // Map 'name' to 'full_name' for frontend compatibility
    return result.rows.map((row) => ({
      ...row,
      full_name: row.name,
      balance: row.balance || null, // Add balance field (null if not exists)
    }));
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

    // Add search filter (searches in name, job, education, marital)
    if (search) {
      queryParams.push(`%${search}%`);
      query += ` AND (name ILIKE $${queryParams.length}
                  OR job ILIKE $${queryParams.length}
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

    if (result.rows.length === 0) return null;

    // Map 'name' to 'full_name' for frontend compatibility
    const row = result.rows[0];
    return {
      ...row,
      full_name: row.name,
      balance: row.balance || null,
    };
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
      name,
      balance,
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
        name, balance, age, job, marital, education,
        has_default, has_housing_loan, has_personal_loan,
        contact, month, day_of_week,
        campaign, pdays, previous, poutcome
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const values = [
      name,
      balance || 0,
      age,
      job,
      marital,
      education,
      has_default ?? defaultValue ?? false, // Support both field names
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

    // Map 'name' to 'full_name' for frontend compatibility
    const row = result.rows[0];
    return {
      ...row,
      full_name: row.name,
      balance: row.balance || null,
    };
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
    // Step 1: Transform API field names to database column names
    const fieldMapping = {
      full_name: 'name',
      default: 'has_default',
      housing: 'has_housing_loan',
      loan: 'has_personal_loan',
    };

    const transformedUpdates = {};
    Object.entries(updates).forEach(([key, value]) => {
      const dbKey = fieldMapping[key] || key;
      transformedUpdates[dbKey] = value;
    });

    // Step 2: Whitelist valid database columns
    const validColumns = [
      'name',
      'balance',
      'age',
      'job',
      'marital',
      'education',
      'has_default',
      'has_housing_loan',
      'has_personal_loan',
      'contact',
      'month',
      'day_of_week',
      'campaign',
      'pdays',
      'previous',
      'poutcome',
      'email',
      'phone',
    ];

    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Step 3: Build SET clause safely
    Object.entries(transformedUpdates).forEach(([key, value]) => {
      if (
        value !== undefined &&
        key !== 'id' &&
        key !== 'created_at' &&
        key !== 'updated_at' &&
        validColumns.includes(key)
      ) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Step 4: Add updated_at timestamp
    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE customers
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) return null;

    // Map 'name' to 'full_name' for frontend compatibility
    const row = result.rows[0];
    return {
      ...row,
      full_name: row.name,
      balance: row.balance || null,
    };
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

    // Get monthly trend data (last 6 months)
    const monthlyTrendQuery = `
      SELECT
        TO_CHAR(c.created_at, 'Mon') as month,
        COUNT(*) as total,
        COUNT(CASE WHEN p.probability_score >= 0.75 THEN 1 END) as high_priority,
        COUNT(CASE WHEN p.probability_score >= 0.5 THEN 1 END) as will_subscribe,
        AVG(p.probability_score) as avg_score
      FROM customers c
      LEFT JOIN LATERAL (
        SELECT probability_score
        FROM predictions
        WHERE customer_id = c.id
        ORDER BY predicted_at DESC
        LIMIT 1
      ) p ON true
      WHERE c.created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(c.created_at, 'Mon'), DATE_TRUNC('month', c.created_at)
      ORDER BY DATE_TRUNC('month', c.created_at) DESC
      LIMIT 6
    `;

    // Get pending and conversions count
    const pendingConversionsQuery = `
      SELECT
        COUNT(CASE WHEN p.probability_score IS NULL THEN 1 END) as pending_calls,
        COUNT(CASE WHEN p.probability_score >= 0.5 THEN 1 END) as monthly_conversions
      FROM customers c
      LEFT JOIN LATERAL (
        SELECT probability_score
        FROM predictions
        WHERE customer_id = c.id
        ORDER BY predicted_at DESC
        LIMIT 1
      ) p ON true
    `;

    const [statsResult, trendResult, pendingResult] = await Promise.all([
      pool.query(statsQuery),
      pool.query(monthlyTrendQuery),
      pool.query(pendingConversionsQuery),
    ]);

    return {
      ...statsResult.rows[0],
      monthly_trend: trendResult.rows.reverse(), // Reverse to get oldest to newest
      pending_calls: parseInt(pendingResult.rows[0].pending_calls),
      monthly_conversions: parseInt(pendingResult.rows[0].monthly_conversions),
    };
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
            name, balance, age, job, marital, education,
            has_default, has_housing_loan, has_personal_loan,
            contact, month, day_of_week,
            campaign, pdays, previous, poutcome
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING id, name, age, job, education
        `;

        // Ensure balance is a valid number
        // Log original balance for debugging
        const originalBalance = customer.balance;
        const balanceValue =
          customer.balance !== undefined &&
          customer.balance !== null &&
          !isNaN(customer.balance) &&
          customer.balance !== ''
            ? Number(customer.balance)
            : 0;

        // Extra validation: if balance is 0 but original was not empty, log warning
        if (
          balanceValue === 0 &&
          originalBalance !== undefined &&
          originalBalance !== null &&
          originalBalance !== '' &&
          originalBalance !== 0
        ) {
          console.warn(
            `⚠️ Warning: Balance parsed as 0 but original was:`,
            originalBalance,
            typeof originalBalance
          );
        }

        // Debug log for first few records
        if (i < 3) {
          console.log(`💾 Inserting customer ${i + 1}:`, {
            name: customer.name,
            hasBalance: 'balance' in customer,
            balance: customer.balance,
            balanceValue: balanceValue,
            balanceType: typeof customer.balance,
            customerKeys: Object.keys(customer),
          });
        }

        const values = [
          customer.name,
          balanceValue,
          customer.age,
          customer.job,
          customer.marital,
          customer.education,
          customer.default || customer.has_default || false, // Support both field names
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

        // Log the inserted balance for debugging
        if (i < 3) {
          console.log(`✅ Customer ${i + 1} inserted:`, {
            id: result.rows[0].id,
            name: result.rows[0].name,
            balanceInserted: balanceValue,
            valuesArray: values.slice(0, 3), // Show first 3 values (name, balance, age)
          });
        }

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
