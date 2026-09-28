const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const { config } = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiters');
const { requestId, requestLogger } = require('./middleware/requestContext');
const { sanitizeInput } = require('./middleware/sanitize');
const apiRouter = require('./routes');

const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  // "simple" parsing never turns ?a[$ne]=1 into a nested object (blocks query-string NoSQL injection)
  app.set('query parser', 'simple');
  app.set('trust proxy', config.trustProxy);

  app.use(requestId);
  app.use(requestLogger);

  // The API only ever returns JSON, so the Content Security Policy forbids everything:
  // if a response were ever rendered as HTML, no script, style or frame could load
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"]
        }
      },
      strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true },
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginResourcePolicy: { policy: 'same-origin' }
    })
  );

  app.use(
    cors({
      origin: config.clientOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 600
    })
  );

  app.use(generalLimiter);
  app.use(express.json({ limit: '10kb' }));
  app.use(sanitizeInput);

  // Responses carry per-user data, so they must never be cached by browsers or proxies
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', app: config.appName, protocol: req.secure ? 'HTTPS' : 'HTTP' });
  });

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
