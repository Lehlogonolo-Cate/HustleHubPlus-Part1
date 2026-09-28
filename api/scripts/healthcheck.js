// Used by the Docker HEALTHCHECK. The request stays inside the container and trusts
// the local certificate explicitly, so TLS verification stays switched on.
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const useHttps = process.env.USE_HTTPS !== 'false';
const certDir = process.env.CERT_DIR || path.join(__dirname, '..', 'certs');

const options = { host: '127.0.0.1', port: process.env.PORT || 4000, path: '/health', timeout: 3000 };

if (useHttps) {
  // The path comes from container configuration, never from a request
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  options.ca = fs.readFileSync(path.join(certDir, 'localhost-cert.pem'));
  options.servername = 'localhost';
}

const request = (useHttps ? https : http).get(options, (res) => process.exit(res.statusCode === 200 ? 0 : 1));

request.on('error', () => process.exit(1));
request.on('timeout', () => {
  request.destroy();
  process.exit(1);
});
