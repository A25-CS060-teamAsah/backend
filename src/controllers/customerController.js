/* eslint-env node */
import { sendSuccess, sendError } from '../utils/response.js';
import { validateCustomerData } from '../utils/customerValidator.js';
import {
  getAllCustomers,
  countCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  bulkCreateCustomers,
} from '../services/customerService.js';
import { handleDatabaseError } from '../middlewares/errorMiddleware.js';
import {
  parseAndValidateCSV,
  generateCSVTemplate,
} from '../utils/csvParser.js';
import {
  triggerPredictionForNewCustomer,
  triggerBatchPrediction,
} from '../services/autoPredictService.js';
import { deleteCachedPrediction } from '../services/cacheService.js';

/**
 * Customer Controller
 * Handles business logic for customer operations
 * Database queries are in customerService.js
 */

/**
 * Get all customers with pagination
 * @route GET /api/v1/customers
 */
export const getAllCustomersHandler = async (req, res) => {
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
    } = req.query;

    // Validate pagination params
    const validPage = Math.max(1, parseInt(page));
    const validLimit = Math.min(Math.max(1, parseInt(limit)), 100); // Max 100 per page

    const options = {
      page: validPage,
      limit: validLimit,
      search,
      sortBy,
      order: order.toUpperCase(),
      minAge: minAge ? parseInt(minAge) : undefined,
      maxAge: maxAge ? parseInt(maxAge) : undefined,
      job,
      education,
      housing,
      loan,
      hasDefault,
      marital,
    };

    // Get customers and total count
    const [customers, total] = await Promise.all([
      getAllCustomers(options),
      countCustomers({
        search,
        minAge,
        maxAge,
        job,
        education,
        housing,
        loan,
        hasDefault,
        marital,
      }),
    ]);

    const totalPages = Math.ceil(total / validLimit);

    return sendSuccess(res, {
      customers,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
        hasNext: validPage < totalPages,
        hasPrev: validPage > 1,
      },
    });
  } catch (error) {
    console.error('Get all customers error:', error);
    return sendError(res, 'Failed to retrieve customers', 500);
  }
};

/**
 * Get customer by ID
 * @route GET /api/v1/customers/:id
 */
export const getCustomerByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return sendError(res, 'Invalid customer ID', 400);
    }

    const customer = await getCustomerById(parseInt(id));

    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    return sendSuccess(res, customer);
  } catch (error) {
    console.error('Get customer by ID error:', error);
    return sendError(res, 'Failed to retrieve customer', 500);
  }
};

/**
 * Create new customer
 * @route POST /api/v1/customers
 */
export const createCustomerHandler = async (req, res) => {
  try {
    const customerData = req.body;

    // Map 'full_name' to 'name' for database compatibility
    if (customerData.full_name && !customerData.name) {
      customerData.name = customerData.full_name;
    }
    // Remove full_name to avoid sending it to database
    delete customerData.full_name;

    // Validate customer data
    const validation = validateCustomerData(customerData);
    if (!validation.isValid) {
      return sendError(res, 'Validation failed', 400, validation.errors);
    }

    // Create customer
    const newCustomer = await createCustomer(customerData);

    // Trigger auto prediction for new customer (non-blocking)
    triggerPredictionForNewCustomer(newCustomer.id);

    return sendSuccess(res, newCustomer, 'Customer created successfully', 201);
  } catch (error) {
    console.error('Create customer error:', error);

    // Handle database errors
    if (error.code) {
      const dbError = handleDatabaseError(error);
      return sendError(res, dbError.message, dbError.statusCode);
    }

    return sendError(res, 'Failed to create customer', 500);
  }
};

/**
 * Update customer
 * @route PUT /api/v1/customers/:id
 */
export const updateCustomerHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate ID format
    const customerId = parseInt(id);
    if (isNaN(customerId) || customerId <= 0) {
      return sendError(res, 'Invalid customer ID format', 400);
    }

    // Check if customer exists
    const existingCustomer = await getCustomerById(customerId);
    if (!existingCustomer) {
      return sendError(res, 'Customer not found', 404);
    }

    // Convert numeric fields from string to number if needed
    const normalizedUpdates = { ...updates };

    // Convert numeric fields
    if (
      normalizedUpdates.age !== undefined &&
      normalizedUpdates.age !== null &&
      normalizedUpdates.age !== ''
    ) {
      normalizedUpdates.age = Number(normalizedUpdates.age);
    }
    if (
      normalizedUpdates.balance !== undefined &&
      normalizedUpdates.balance !== null &&
      normalizedUpdates.balance !== ''
    ) {
      normalizedUpdates.balance = Number(normalizedUpdates.balance);
    }
    if (
      normalizedUpdates.campaign !== undefined &&
      normalizedUpdates.campaign !== null &&
      normalizedUpdates.campaign !== ''
    ) {
      normalizedUpdates.campaign = Number(normalizedUpdates.campaign);
    }
    if (
      normalizedUpdates.pdays !== undefined &&
      normalizedUpdates.pdays !== null &&
      normalizedUpdates.pdays !== ''
    ) {
      normalizedUpdates.pdays = Number(normalizedUpdates.pdays);
    }
    if (
      normalizedUpdates.previous !== undefined &&
      normalizedUpdates.previous !== null &&
      normalizedUpdates.previous !== ''
    ) {
      normalizedUpdates.previous = Number(normalizedUpdates.previous);
    }

    // Validate update data (partial validation - only validates fields that are present)
    const validation = validateCustomerData(normalizedUpdates, true);
    if (!validation.isValid) {
      return sendError(res, 'Validation failed', 400, validation.errors);
    }

    // Remove protected fields that shouldn't be updated
    delete normalizedUpdates.id;
    delete normalizedUpdates.created_at;
    delete normalizedUpdates.updated_at;
    delete normalizedUpdates.probability_score;
    delete normalizedUpdates.will_subscribe;
    delete normalizedUpdates.predicted_at;
    delete normalizedUpdates.model_version;

    // Update customer (field mapping handled in service layer)
    const updatedCustomer = await updateCustomer(customerId, normalizedUpdates);

    // Clear cache and trigger new prediction (customer data changed)
    deleteCachedPrediction(parseInt(id));
    triggerPredictionForNewCustomer(parseInt(id));

    return sendSuccess(res, updatedCustomer, 'Customer updated successfully');
  } catch (error) {
    console.error('Update customer error:', error);

    if (error.code) {
      const dbError = handleDatabaseError(error);
      return sendError(res, dbError.message, dbError.statusCode);
    }

    return sendError(res, 'Failed to update customer', 500);
  }
};

/**
 * Delete customer
 * @route DELETE /api/v1/customers/:id
 */
export const deleteCustomerHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return sendError(res, 'Invalid customer ID', 400);
    }

    // Check if customer exists
    const existingCustomer = await getCustomerById(parseInt(id));
    if (!existingCustomer) {
      return sendError(res, 'Customer not found', 404);
    }

    // Delete customer (predictions will be cascade deleted)
    await deleteCustomer(parseInt(id));

    // Clear cache for deleted customer
    deleteCachedPrediction(parseInt(id));

    return sendSuccess(res, null, 'Customer deleted successfully');
  } catch (error) {
    console.error('Delete customer error:', error);
    return sendError(res, 'Failed to delete customer', 500);
  }
};

/**
 * Get customer statistics
 * @route GET /api/v1/customers/stats
 */
export const getCustomerStatsHandler = async (req, res) => {
  try {
    const stats = await getCustomerStats();
    console.log('📊 Raw stats from service:', stats);

    const responseData = {
      totalCustomers: parseInt(stats.total_customers),
      avgAge: parseFloat(stats.avg_age).toFixed(1),
      withHousingLoan: parseInt(stats.with_housing_loan),
      withPersonalLoan: parseInt(stats.with_personal_loan),
      uniqueJobs: parseInt(stats.unique_jobs),
      uniqueEducationLevels: parseInt(stats.unique_education_levels),
      pendingCalls: stats.pending_calls || 0,
      monthlyConversions: stats.monthly_conversions || 0,
      monthlyTrend: (stats.monthly_trend || []).map((item) => ({
        month: item.month,
        total: parseInt(item.total),
        highPriority: parseInt(item.high_priority || 0),
        willSubscribe: parseInt(item.will_subscribe || 0),
        avgScore: parseFloat(item.avg_score || 0),
      })),
    };

    console.log('📤 Sending response:', responseData);
    return sendSuccess(res, responseData);
  } catch (error) {
    console.error('Get customer stats error:', error);
    return sendError(res, 'Failed to retrieve statistics', 500);
  }
};

/**
 * Upload CSV file and bulk create customers
 * @route POST /api/v1/customers/upload-csv
 */
export const uploadCSVHandler = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    console.log(
      '📁 CSV Upload - File received:',
      req.file.originalname,
      `(${req.file.size} bytes)`
    );

    // Parse and validate CSV
    const validationResult = parseAndValidateCSV(req.file.buffer);

    if (!validationResult.success) {
      console.log('❌ CSV Upload - Validation failed:', validationResult.error);
      return res.status(400).json({
        success: false,
        error: 'CSV Validation Failed',
        message: validationResult.error,
      });
    }

    const { valid, invalid, totalRecords } = validationResult.data;

    console.log(
      `✅ CSV Upload - Validation complete: ${valid.length} valid, ${invalid.length} invalid out of ${totalRecords} records`
    );

    // If no valid records, return error
    if (valid.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No Valid Records',
        message: 'All records in the CSV file are invalid',
        details: {
          totalRecords,
          validRecords: 0,
          invalidRecords: invalid.length,
          errors: invalid,
        },
      });
    }

    // Bulk insert valid customers
    const customersToInsert = valid.map((item) => ({
      ...item.data,
      row: item.row,
    }));

    // Log first customer data to check balance
    if (customersToInsert.length > 0) {
      console.log('🔍 First customer to insert:', {
        name: customersToInsert[0].name,
        balance: customersToInsert[0].balance,
        balanceType: typeof customersToInsert[0].balance,
        hasBalance: 'balance' in customersToInsert[0],
        allKeys: Object.keys(customersToInsert[0]),
      });
    }

    console.log(
      `💾 CSV Upload - Inserting ${customersToInsert.length} valid records...`
    );

    const insertResult = await bulkCreateCustomers(customersToInsert);

    console.log(
      `✅ CSV Upload - Insert complete: ${insertResult.successCount} created, ${insertResult.failedCount} failed`
    );

    // Trigger batch prediction for newly created customers (non-blocking)
    if (insertResult.created.length > 0) {
      const newCustomerIds = insertResult.created.map((c) => c.id);
      console.log(
        `🔮 CSV Upload - Triggering predictions for ${newCustomerIds.length} customers`
      );
      triggerBatchPrediction(newCustomerIds);
    }

    // Prepare response
    const response = {
      success: true,
      message: 'CSV upload processed',
      summary: {
        totalRecordsInFile: totalRecords,
        validRecords: valid.length,
        invalidRecordsDuringValidation: invalid.length,
        successfullyCreated: insertResult.successCount,
        failedToCreate: insertResult.failedCount,
      },
      created: insertResult.created.slice(0, 10), // Show first 10 created
      validationErrors: invalid.length > 0 ? invalid.slice(0, 10) : [], // Show first 10 validation errors
      insertionErrors:
        insertResult.failed.length > 0 ? insertResult.failed.slice(0, 10) : [], // Show first 10 insertion errors
    };

    // Add warnings if any
    if (invalid.length > 10) {
      response.note = `Showing first 10 validation errors. Total: ${invalid.length}`;
    }
    if (insertResult.failed.length > 10) {
      response.noteInsert = `Showing first 10 insertion errors. Total: ${insertResult.failed.length}`;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ CSV Upload error:', error);
    return res.status(500).json({
      success: false,
      error: 'CSV Upload Failed',
      message: error.message,
    });
  }
};

/**
 * Download CSV template
 * @route GET /api/v1/customers/csv-template
 */
export const downloadCSVTemplateHandler = async (req, res) => {
  try {
    const template = generateCSVTemplate();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=customer_import_template.csv'
    );

    return res.send(template);
  } catch (error) {
    console.error('Download template error:', error);
    return sendError(res, 'Failed to generate template', 500);
  }
};
