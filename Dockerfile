# ==========================================
# Dockerfile — Production Multi-stage Build
# ==========================================

# Stage 1: Build static assets with Node.js
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install clean dependencies
RUN npm ci

# Copy full application source
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve static app using lightweight Nginx
FROM nginx:alpine AS runner

# Copy custom Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose web port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
