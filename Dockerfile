# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./
COPY pnpm-workspace.yaml* ./
COPY yarn.lock* ./

# Install dependencies based on lock file
RUN if [ -f pnpm-lock.yaml ]; then \
      corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile; \
    else \
      npm ci; \
    fi

# Copy application source
COPY . .

# Build application if needed
# No build script detected, skipping build step

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies (including curl for health checks)
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy application files
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.next ./.next

# Create necessary directories with proper permissions
RUN mkdir -p /app/data /app/uploads && \
    chown -R appuser:nodejs /app/data /app/uploads

# Set ownership
RUN chown -R appuser:nodejs /app

# Enable pnpm in production
RUN corepack enable && corepack prepare pnpm@latest --activate
USER appuser

EXPOSE 3000

CMD ["pnpm", "start"]
