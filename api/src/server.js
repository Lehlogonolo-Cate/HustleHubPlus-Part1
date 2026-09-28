const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const createApp = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const { config, validateConfig } = require('./config/env');
const logger = require('./utils/logger');

// Certificate paths come from server configuration, never from a request
/* eslint-disable security/detect-non-literal-fs-filename */
const loadCertificates = () => ({
  key: fs.readFileSync(path.join(config.certDir, 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(config.certDir, 'localhost-cert.pem')),
  minVersion: 'TLSv1.2'
});
/* eslint-enable security/detect-non-literal-fs-filename */

const startServer = async ({ mongoUri = config.mongoUri } = {}) => {
  validateConfig();
  await connectDatabase(mongoUri);

  const app = createApp();
  const server = config.useHttps ? https.createServer(loadCertificates(), app) : http.createServer(app);

  await new Promise((resolve) => server.listen(config.port, resolve));

  const protocol = config.useHttps ? 'https' : 'http';
  logger.info(`${config.appName} API listening on ${protocol}://localhost:${config.port}`, { event: 'server.started' });

  if (!config.useHttps) {
    logger.warn('HTTPS is disabled. Only do this behind a TLS-terminating proxy.', { event: 'server.insecure' });
  }

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down`, { event: 'server.stopping' });
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  return server;
};

if (require.main === module) {
  startServer().catch((error) => {
    // Configuration errors are safe to print; they never contain secret values
    logger.error(`Server failed to start: ${error.message}`, { event: 'server.start_failed' });
    process.exit(1);
  });
}

module.exports = { startServer };
