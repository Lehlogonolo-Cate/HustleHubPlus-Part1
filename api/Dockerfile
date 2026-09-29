# ---- HustleHub+ API ----
FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies only, from the lockfile
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY src ./src
COPY scripts/createAdmin.js scripts/seedAdmin.js scripts/healthcheck.js ./scripts/

# Run as the unprivileged "node" user; only the log folder is writable
RUN mkdir -p /app/logs /app/certs && chown -R node:node /app/logs
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "scripts/healthcheck.js"]

CMD ["node", "src/server.js"]
