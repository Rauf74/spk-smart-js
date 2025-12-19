# ============================================
# Dockerfile untuk SPK-SMART-JS
# Node.js + Express Application
# ============================================

# Stage 1: Base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies only (untuk caching)
COPY package*.json ./

# ============================================
# Stage 2: Production
# ============================================
FROM base AS production

# Set NODE_ENV
ENV NODE_ENV=production

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port (default 3000)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Start the application
CMD ["node", "index.js"]

# ============================================
# Stage 3: Development (optional)
# ============================================
FROM base AS development

# Set NODE_ENV
ENV NODE_ENV=development

# Install all dependencies (including devDependencies)
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start with nodemon for hot-reload
CMD ["npm", "run", "dev"]
