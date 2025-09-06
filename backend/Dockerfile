# Backend Dockerfile
# Multi-stage build for Express/TypeScript application

# Development stage
FROM node:22-alpine AS development

# Install netcat for database connectivity check
RUN apk add --no-cache netcat-openbsd

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# ✅ Generate Prisma client
RUN pnpm db:generate

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Development command with hot reload
CMD ["pnpm", "dev"]

# Build stage
FROM node:22-alpine AS build

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm db:generate

# Build the application
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

# Install netcat for database connectivity check
RUN apk add --no-cache netcat-openbsd

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=build --chown=appuser:nodejs /app/dist ./dist
COPY --from=build --chown=appuser:nodejs /app/prisma ./prisma
COPY --from=build --chown=appuser:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy entrypoint script
COPY --chown=appuser:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Production command
CMD ["pnpm", "start"]