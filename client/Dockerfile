# ---- Stage 1: build the React app ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ---- Stage 2: serve the static files with nginx ----
# The unprivileged image runs nginx as a non-root user
FROM nginxinc/nginx-unprivileged:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080 8443

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q --no-check-certificate -O /dev/null https://127.0.0.1:8443/ || exit 1
