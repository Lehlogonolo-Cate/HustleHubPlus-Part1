require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const https = require('https');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/authRoutes');

const app = express();

const PORT = process.env.PORT || 4000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.disable('x-powered-by');

app.use(helmet());

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => {
  return res.status(200).json({
    app: process.env.APP_NAME || 'HustleHub+',
    message: 'HustleHub+ API is running securely',
    protocol: USE_HTTPS ? 'HTTPS' : 'HTTP'
  });
});

app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'OK',
    protocol: USE_HTTPS ? 'HTTPS' : 'HTTP'
  });
});

app.use('/api/auth', authRoutes);

app.use((req, res) => {
  return res.status(404).json({
    error: 'Route not found'
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  return res.status(500).json({
    error: 'An unexpected error occurred'
  });
});

if (USE_HTTPS) {
  const keyPath = path.join(
    __dirname,
    'certs',
    'localhost-key.pem'
  );

  const certificatePath = path.join(
    __dirname,
    'certs',
    'localhost-cert.pem'
  );

  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certificatePath)
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`HTTPS server running on port ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
  });
}