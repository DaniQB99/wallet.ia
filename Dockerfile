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

# Receive build arguments for Supabase
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set them as environment variables during build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build production bundle
RUN npm run build

# Stage 2: Serve static app using lightweight Nginx (Non-Root)
FROM nginxinc/nginx-unprivileged:alpine AS runner

# Copy custom Nginx configuration for SPA routing
# Since nginx-unprivileged listens on 8080 by default, our nginx.conf must also listen on 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose non-root web port
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
