# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
# Copy lock file if it exists
COPY pnpm-lock.yaml* ./
COPY yarn.lock* ./

# Install dependencies based on lock file
RUN if [ -f pnpm-lock.yaml ]; then       corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile;     elif [ -f yarn.lock ]; then       yarn install --frozen-lockfile;     else       npm ci;     fi

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# For Next.js, you might need .next instead of dist
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/public ./public

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
