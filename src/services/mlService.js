/* eslint-env node */
import mlClient from '../config/mlService.js';

/**
 * ML Service - Functions for communicating with Flask ML API
 * All ML predictions go through this service
 */

/**
 * Predict single customer subscription probability
 * @param {Object} customerData - Customer features
 * @returns {Promise<Object>} - { probability, willSubscribe, modelVersion }
 */
export const predictCustomer = async (customerData) => {
  try {
    // Format data for ML API
    const mlPayload = {
      age: customerData.age,
      job: customerData.job,
      marital: customerData.marital,
      education: customerData.education,
      default: customerData.has_default || false,
      housing: customerData.has_housing_loan || false,
      loan: customerData.has_personal_loan || false,
      contact: customerData.contact,
      month: customerData.month,
      day_of_week: customerData.day_of_week,
      campaign: customerData.campaign || 1,
      pdays: customerData.pdays || 999,
      previous: customerData.previous || 0,
      poutcome: customerData.poutcome || 'unknown',
    };

    const response = await mlClient.post('/predict', mlPayload);

    return {
      probability: response.data.probability,
      willSubscribe: response.data.prediction,
      modelVersion: response.data.model_version || '1.0',
    };
  } catch (error) {
    console.error('ML Service Error (predictCustomer):', error.message);
    
    // Check if ML service is down
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('ML Service is not available. Please make sure the ML service is running.');
    }
    
    throw new Error(`ML prediction failed: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Batch predict multiple customers
 * @param {Array<Object>} customersData - Array of customer objects
 * @returns {Promise<Array>} - Array of predictions
 */
export const batchPredict = async (customersData) => {
  try {
    // Format data for ML API
    const mlPayload = {
      customers: customersData.map((customer) => ({
        age: customer.age,
        job: customer.job,
        marital: customer.marital,
        education: customer.education,
        default: customer.has_default || false,
        housing: customer.has_housing_loan || false,
        loan: customer.has_personal_loan || false,
        contact: customer.contact,
        month: customer.month,
        day_of_week: customer.day_of_week,
        campaign: customer.campaign || 1,
        pdays: customer.pdays || 999,
        previous: customer.previous || 0,
        poutcome: customer.poutcome || 'unknown',
      })),
    };

    const response = await mlClient.post('/predict/batch', mlPayload);

    return response.data.predictions.map((pred) => ({
      probability: pred.probability,
      willSubscribe: pred.prediction,
      modelVersion: pred.model_version || '1.0',
      error: pred.error || null,
    }));
  } catch (error) {
    console.error('ML Service Error (batchPredict):', error.message);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('ML Service is not available. Please make sure the ML service is running.');
    }
    
    throw new Error(`Batch prediction failed: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Check ML service health
 * @returns {Promise<Object>} - { status, message, details }
 */
export const checkMLServiceHealth = async () => {
  try {
    const response = await mlClient.get('/health');
    
    return {
      status: 'OK',
      message: 'ML Service is running',
      details: response.data,
    };
  } catch (error) {
    console.error('ML Service Health Check Failed:', error.message);
    
    return {
      status: 'ERROR',
      message: 'ML Service is not available',
      error: error.message,
    };
  }
};

/**
 * Get ML model information
 * @returns {Promise<Object>} - Model metadata
 */
export const getModelInfo = async () => {
  try {
    const response = await mlClient.get('/model/info');
    return response.data;
  } catch (error) {
    console.error('ML Service Error (getModelInfo):', error.message);
    throw new Error('Failed to get model information');
  }
};
