/* eslint-env node */
/* global process */
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import { simpleLogger } from './middlewares/loggerMiddleware.js';
import { testConnection } from './config/database.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Security middlewares
app.use(helmet()); // Set security headers
app.use(cors()); // Enable CORS

// Body parser middlewares
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(simpleLogger);
}

// API Routes
app.use('/api/v1', routes);

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected && process.env.NODE_ENV === 'production') {
      console.error('❌ Database connection failed. Server not started.');
      process.exit(1);
    }

    // Start listening
    app.listen(PORT, HOST, () => {
      console.log(`
                                                         
   Lead Scoring Backend API                           
                                                    
   Server:      http://${HOST}:${PORT}                    
   Environment: ${process.env.NODE_ENV || 'production'}                                      
   API Docs:    http://${HOST}:${PORT}/api/v1/health                                                              
   Status:      ✅ Running                               
   Database:    ${dbConnected ? '✅ Connected' : '⚠️  Not Connected'}                        
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
startServer();
