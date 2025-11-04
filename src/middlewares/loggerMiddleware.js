/* eslint-env node */

/**
 * Request logger middleware
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  console.log(`
📥 [${new Date().toISOString()}]
   Method: ${req.method}
   URL: ${req.originalUrl}
   IP: ${req.ip || req.connection.remoteAddress}
   User-Agent: ${req.get('user-agent') || 'Unknown'}
  `);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 500 ? '❌' : statusCode >= 400 ? '⚠️' : '✅';

    console.log(`
${statusEmoji} [${new Date().toISOString()}]
   Method: ${req.method}
   URL: ${req.originalUrl}
   Status: ${statusCode}
   Duration: ${duration}ms
  `);
  });

  next();
};

/**
 * Simple request logger (minimal)
 */
export const simpleLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
};
