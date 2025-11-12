/* eslint-env node */
/* global process */
import axios from 'axios';

/**
 * ML Service Configuration
 * Axios instance for communicating with Flask ML API
 */

const mlClient = axios.create({
  baseURL: process.env.ML_SERVICE_URL || 'http://localhost:5050',
  timeout: parseInt(process.env.ML_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Log outgoing requests
mlClient.interceptors.request.use(
  (config) => {
    console.log(`📤 ML Request: ${config.method.toUpperCase()} ${config.url}`);
    if (config.data && process.env.NODE_ENV === 'development') {
      console.log('   Data:', JSON.stringify(config.data).substring(0, 200));
    }
    return config;
  },
  (error) => {
    console.error('❌ ML Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor - Log responses and handle errors
mlClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ML Response: ${response.status} ${response.statusText}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error(`❌ ML Response Error: ${error.response.status}`);
      console.error(
        '   Message:',
        error.response.data?.message || error.response.data
      );
    } else if (error.request) {
      // Request was made but no response received
      console.error('❌ ML Service No Response - Service might be down');
    } else {
      // Error setting up the request
      console.error('❌ ML Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default mlClient;
