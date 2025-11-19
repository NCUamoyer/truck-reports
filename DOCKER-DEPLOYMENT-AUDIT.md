# Docker Deployment Configuration Audit Report

**Project:** Vehicle Condition Reports (truck-reports)  
**Date:** November 19, 2025  
**Audit Scope:** Dockerfile, docker-compose.yml, deploy.sh

---

## Executive Summary

The auto-generated Docker deployment files contain **multiple critical issues** that will prevent successful deployment. The main problems stem from:

1. **Incorrect framework assumptions** (assumes Next.js when it's Express)
2. **Wrong package manager** (uses npm when project uses pnpm)
3. **Missing dependencies** for health checks
4. **Incomplete volume configuration** for data persistence
5. **Incorrect migration detection logic**

**Status:** 🔴 **Will NOT work without corrections**

---

## 1. Dockerfile Analysis

### Current File Structure
```dockerfile
# Build stage
FROM node:18-alpine AS builder
# ... 
# Production stage
FROM node:18-alpine AS runner
```

### 🔴 Critical Issues

#### Issue 1.1: Incorrect User Naming
**Location:** Line 36  
**Problem:**
```dockerfile
RUN adduser --system --uid 1001 nextjs
```

**Why It's Wrong:**
- Creates a user called `nextjs` but this is **NOT a Next.js application**
- This is a plain **Express.js** application with static file serving
- Misleading naming violates clarity and maintainability

**Fix:**
```dockerfile
RUN adduser --system --uid 1001 appuser
# Later references:
RUN chown -R appuser:nodejs /app
USER appuser
```

---

#### Issue 1.2: Wrong Package Manager
**Location:** Line 49  
**Problem:**
```dockerfile
CMD ["npm", "start"]
```

**Why It's Wrong:**
- Project uses **pnpm** (evidenced by `pnpm-lock.yaml` and `pnpm-workspace.yaml`)
- Using `npm` will cause dependency resolution issues
- The pnpm installation logic in build stage (lines 13-19) correctly detects pnpm but then doesn't use it in production

**Fix:**
```dockerfile
# In builder stage, ensure pnpm is available in runner
RUN if [ -f pnpm-lock.yaml ]; then \
      corepack enable && corepack prepare pnpm@latest --activate; \
    fi

# In runner stage CMD
CMD if [ -f pnpm-lock.yaml ]; then \
      corepack enable && pnpm start; \
    else \
      npm start; \
    fi
```

**Better Fix (since we KNOW it's pnpm):**
```dockerfile
RUN corepack enable && corepack prepare pnpm@latest --activate
CMD ["pnpm", "start"]
```

---

#### Issue 1.3: Missing Health Check Dependencies
**Location:** N/A (missing)  
**Problem:**
- Alpine images don't include `curl` by default
- docker-compose.yml expects curl for health checks (line 21)
- Health checks will always fail

**Fix:**
```dockerfile
# In runner stage, before USER directive
RUN apk add --no-cache curl
```

---

#### Issue 1.4: Missing Workspace Configuration Copy
**Location:** Line 7  
**Problem:**
```dockerfile
COPY package*.json ./
```

**Why It's Wrong:**
- Project uses pnpm workspaces (`pnpm-workspace.yaml` exists)
- This file is critical for pnpm to understand project structure
- Currently copied on line 9, but should be more explicit

**Fix:**
```dockerfile
# Copy package files
COPY package*.json ./
COPY pnpm-workspace.yaml* ./
COPY pnpm-lock.yaml* ./
```

---

#### Issue 1.5: No Volume Directories Created
**Location:** N/A (missing)  
**Problem:**
- App needs `data/` directory for SQLite database
- App needs `uploads/` directory for document storage
- Directories not created with proper permissions
- Will cause permission errors when containers try to write

**Fix:**
```dockerfile
# In runner stage, after creating user
RUN mkdir -p /app/data /app/uploads && \
    chown -R appuser:nodejs /app/data /app/uploads
```

---

### 🟡 Warnings

#### Warning 1.1: Inefficient Caching
**Problem:** Copying all source files before checking if build is needed wastes cache layers

**Recommendation:**
```dockerfile
# Copy only necessary files for production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
```

---

## 2. docker-compose.yml Analysis

### 🔴 Critical Issues

#### Issue 2.1: Health Check Will Fail
**Location:** Lines 20-25  
**Problem:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
```

**Why It's Wrong:**
1. `curl` not installed in Alpine image (see Dockerfile Issue 1.3)
2. App doesn't have a `/health` endpoint defined

**Fix Option 1 (Install curl in Dockerfile):**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Fix Option 2 (Use wget, built into Alpine):**
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Fix Option 3 (Use node):**
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

#### Issue 2.2: Missing Uploads Volume
**Location:** Lines 15-17  
**Problem:**
```yaml
volumes:
  - ./volumes/logs:/app/logs
  - ./volumes/data:/app/data
```

**Why It's Wrong:**
- App uses `uploads/` directory for document storage (PDFs, images, etc.)
- Critical data will be lost on container restart
- Logs volume is mapped but app doesn't create logs

**Fix:**
```yaml
volumes:
  - ./volumes/data:/app/data      # SQLite database
  - ./volumes/uploads:/app/uploads # User uploaded documents
  # Remove logs volume - app doesn't use it
```

---

### 🟢 What's Good

- Port mapping is correct (3000 internal, configurable external)
- Environment variables properly configured
- Restart policy is sensible
- Data volume for SQLite is present
- No unnecessary database service (correctly identified SQLite usage)

---

## 3. deploy.sh Analysis

### 🔴 Critical Issues

#### Issue 3.1: Incorrect Migration Detection
**Location:** Lines 62-68  
**Problem:**
```bash
if [ -f "scripts/migrate.sh" ]; then
    echo "Running migrations..."
    ./scripts/migrate.sh
elif [ -f "prisma/schema.prisma" ]; then
    echo "Detected Prisma, running migrations..."
    docker compose exec -T app npx prisma migrate deploy
fi
```

**Why It's Wrong:**
- This app doesn't use `scripts/migrate.sh`
- This app doesn't use Prisma (uses better-sqlite3)
- This app has custom migration scripts in `scripts/migrations/001-*.js`, `scripts/migrations/002-*.js`
- Migrations won't run at all

**Fix:**
```bash
# Check for custom migration scripts
if [ -d "scripts/migrations" ] && [ -n "$(ls -A scripts/migrations/*.js 2>/dev/null)" ]; then
    echo "Running custom migration scripts..."
    for migration in scripts/migrations/*.js; do
        echo "Running $(basename "$migration")..."
        docker compose exec -T app node "$migration"
    done
elif [ -f "scripts/migrate.sh" ]; then
    echo "Running migration script..."
    ./scripts/migrate.sh
elif [ -f "prisma/schema.prisma" ]; then
    echo "Detected Prisma, running migrations..."
    docker compose exec -T app npx prisma migrate deploy
fi
```

**Even Better - Using package.json script:**
```bash
# Check if migrate script exists in package.json
if docker compose exec -T app pnpm run --silent | grep -q "migrate"; then
    echo "Running migrations..."
    docker compose exec -T app pnpm run migrate
fi
```

---

### 🟢 What's Good

- Git checkout logic is solid
- Argument parsing is clean
- Environment file creation is safe
- Docker cleanup is responsible
- Overall structure is professional

---

## 4. Project-Specific Requirements

### Application Architecture
```
Express.js Server (server/index.js)
├── Static Files: public/ (HTML, CSS, JS)
├── Database: data/reports.db (SQLite via better-sqlite3)
├── Uploads: uploads/vehicles/{id}/{category}/
├── Scripts: scripts/ (migrations, imports)
└── Dependencies: pnpm (NOT npm)
```

### Runtime Requirements
1. **Node.js 18+**
2. **pnpm** package manager
3. **SQLite** database (better-sqlite3)
4. **File system access** for uploads
5. **Volume persistence** for data/ and uploads/

### Key Dependencies
```json
{
  "better-sqlite3": "^9.2.2",    // Native SQLite binding
  "express": "^4.18.2",           // Web server
  "multer": "^2.0.2",             // File uploads
  "express-rate-limit": "^7.1.5"  // Rate limiting
}
```

---

## 5. Intelligence Improvements for Auto-Generation

### Required Detection Logic

#### 1. Package Manager Detection
```bash
# Priority order
if [ -f "pnpm-lock.yaml" ]; then
    PKG_MANAGER="pnpm"
    LOCKFILE="pnpm-lock.yaml"
elif [ -f "yarn.lock" ]; then
    PKG_MANAGER="yarn"
    LOCKFILE="yarn.lock"
elif [ -f "package-lock.json" ]; then
    PKG_MANAGER="npm"
    LOCKFILE="package-lock.json"
else
    PKG_MANAGER="npm"
    LOCKFILE=""
fi
```

#### 2. Framework Detection
```bash
# Check package.json dependencies
if grep -q "\"next\":" package.json; then
    FRAMEWORK="nextjs"
    USER_NAME="nextjs"
elif grep -q "\"express\":" package.json; then
    FRAMEWORK="express"
    USER_NAME="appuser"
elif grep -q "\"@nestjs/core\":" package.json; then
    FRAMEWORK="nestjs"
    USER_NAME="appuser"
else
    FRAMEWORK="node"
    USER_NAME="appuser"
fi
```

#### 3. Database Detection
```bash
# Check for database types
if grep -q "\"prisma\":" package.json || [ -f "prisma/schema.prisma" ]; then
    DATABASE="prisma"
elif grep -q "\"better-sqlite3\":" package.json; then
    DATABASE="sqlite"
    NEEDS_DATA_VOLUME=true
elif grep -q "\"pg\":" package.json || grep -q "\"postgres\":" package.json; then
    DATABASE="postgresql"
    NEEDS_DB_SERVICE=true
elif grep -q "\"mysql\":" package.json; then
    DATABASE="mysql"
    NEEDS_DB_SERVICE=true
else
    DATABASE="none"
fi
```

#### 4. File Upload Detection
```bash
# Check if app handles file uploads
if grep -q "\"multer\":" package.json || \
   grep -q "\"formidable\":" package.json || \
   grep -q "\"busboy\":" package.json; then
    NEEDS_UPLOAD_VOLUME=true
    # Try to detect upload directory
    UPLOAD_DIR=$(grep -r "uploads" . --include="*.js" -m 1 | grep -oP "(?<=['\"])uploads[^'\"]*" | head -1)
    UPLOAD_DIR=${UPLOAD_DIR:-"uploads"}
fi
```

#### 5. Health Check Endpoint Detection
```bash
# Check for common health check routes
if grep -rq "\.get.*['\"]\/health['\"]" server/ src/ app/ 2>/dev/null; then
    HEALTH_ENDPOINT="/health"
elif grep -rq "\.get.*['\"]\/api\/health['\"]" server/ src/ app/ 2>/dev/null; then
    HEALTH_ENDPOINT="/api/health"
elif grep -rq "\.get.*['\"]\/healthz['\"]" server/ src/ app/ 2>/dev/null; then
    HEALTH_ENDPOINT="/healthz"
else
    HEALTH_ENDPOINT="/"
fi
```

#### 6. Migration Detection
```bash
# Check for migration patterns
if [ -f "scripts/migrate.sh" ]; then
    MIGRATION_CMD="./scripts/migrate.sh"
elif [ -d "scripts/migrations" ] && [ -n "$(ls -A scripts/migrations/*.js 2>/dev/null)" ]; then
    MIGRATION_TYPE="custom-scripts"
    MIGRATION_DIR="scripts/migrations"
elif [ -f "prisma/schema.prisma" ]; then
    MIGRATION_CMD="npx prisma migrate deploy"
elif grep -q "\"migrate\":" package.json; then
    MIGRATION_CMD="${PKG_MANAGER} run migrate"
else
    MIGRATION_CMD=""
fi
```

---

## 6. Corrected Files

### Dockerfile (Corrected)

```dockerfile
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

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies
RUN apk add --no-cache curl

# Create non-root user (Express app)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy application files
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts

# Create necessary directories with proper permissions
RUN mkdir -p /app/data /app/uploads && \
    chown -R appuser:nodejs /app

# Enable pnpm in production
RUN corepack enable && corepack prepare pnpm@latest --activate

USER appuser

EXPOSE 3000

# Use pnpm to start (matches project's package manager)
CMD ["pnpm", "start"]
```

### docker-compose.yml (Corrected)

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${CONTAINER_NAME:-truck-reports}
    restart: unless-stopped
    ports:
      - "${PORT:-3001}:3000"
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - PORT=3000
    volumes:
      # SQLite database persistence
      - ./volumes/data:/app/data
      # User uploaded documents persistence
      - ./volumes/uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### deploy.sh (Corrected)

```bash
#!/bin/bash

# Deployment Script
# Auto-generated by NCU Deployment CLI

# Default values
ENV="test"
REF="main"
BASE_PATH=""
CONTAINER=""
DOMAIN=""

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --env) ENV="$2"; shift ;;
        --ref) REF="$2"; shift ;;
        --base-path) BASE_PATH="$2"; shift ;;
        --container) CONTAINER="$2"; shift ;;
        --domain) DOMAIN="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# Validate required arguments
if [ -z "$BASE_PATH" ]; then
    echo "Error: --base-path is required"
    exit 1
fi

echo "Deploying to $ENV environment..."
echo "Ref: $REF"
echo "Base Path: $BASE_PATH"

# Navigate to project directory
cd "$BASE_PATH" || exit 1

# Fetch latest changes
echo "Fetching latest changes..."
git fetch origin

# Checkout specific ref
echo "Checking out $REF..."
git checkout "$REF"
git pull origin "$REF"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo "NODE_ENV=$ENV" > .env
    echo "PORT=3000" >> .env
fi

# Create volume directories if they don't exist
echo "Ensuring volume directories exist..."
mkdir -p volumes/data volumes/uploads

# Build and start containers
echo "Building and starting containers..."
export CONTAINER_NAME="${CONTAINER:-truck-reports}"
docker compose up -d --build --remove-orphans

# Wait for container to be ready
echo "Waiting for container to be healthy..."
sleep 5

# Run migrations based on project type
if [ -d "scripts/migrations" ] && [ -n "$(ls -A scripts/migrations/*.js 2>/dev/null)" ]; then
    echo "Running custom migration scripts..."
    for migration in scripts/migrations/*.js; do
        echo "  - Running $(basename "$migration")..."
        docker compose exec -T app node "$migration" || echo "  ⚠ Migration $(basename "$migration") had issues"
    done
elif [ -f "scripts/migrate.sh" ]; then
    echo "Running migration script..."
    docker compose exec -T app bash ./scripts/migrate.sh
elif [ -f "prisma/schema.prisma" ]; then
    echo "Detected Prisma, running migrations..."
    docker compose exec -T app npx prisma migrate deploy
elif docker compose exec -T app pnpm run --silent 2>&1 | grep -q "migrate"; then
    echo "Running migrations via package.json script..."
    docker compose exec -T app pnpm run migrate
else
    echo "No migrations detected, skipping..."
fi

# Verify deployment
echo "Verifying deployment..."
if docker compose ps | grep -q "Up"; then
    echo "✅ Container is running"
else
    echo "❌ Container failed to start"
    docker compose logs --tail=50
    exit 1
fi

# Prune old images to save space
echo "Pruning old docker images..."
docker image prune -f

echo "✅ Deployment complete!"
echo "Container: $CONTAINER_NAME"
echo "Port: ${PORT:-3001}"
```

---

## 7. Summary & Recommendations

### Critical Actions Required

| Priority | Issue | Impact | Fix Effort |
|----------|-------|--------|------------|
| 🔴 P0 | Wrong package manager (npm vs pnpm) | Startup failure | 5 min |
| 🔴 P0 | Missing curl for health checks | Health checks fail | 2 min |
| 🔴 P0 | Missing uploads volume | Data loss | 2 min |
| 🔴 P0 | Migrations won't run | Database outdated | 10 min |
| 🟡 P1 | Incorrect user name | Confusion | 2 min |
| 🟡 P1 | Wrong health endpoint | Unreliable checks | 1 min |

### Auto-Generation Logic Improvements

To make your deployment system truly intelligent for **all apps**, implement:

1. **Package Manager Detection** - Parse lock files, use correct commands
2. **Framework Detection** - Scan package.json, use appropriate naming
3. **Database Detection** - Identify DB type, create appropriate services/volumes
4. **File Upload Detection** - Scan for upload libraries, create volumes
5. **Health Endpoint Detection** - Grep source code for health routes
6. **Migration Detection** - Multiple strategy detection (Prisma, custom, npm scripts)
7. **Port Detection** - Parse server files for listen() calls
8. **Environment Variable Detection** - Scan code for process.env usage

### Testing Checklist

Before deploying to production:

- [ ] Run `docker build .` and verify it completes
- [ ] Run `docker compose up` and check logs
- [ ] Verify health check passes: `docker compose ps`
- [ ] Test API endpoints: `curl http://localhost:3001/api/vehicles`
- [ ] Upload a document to test volume persistence
- [ ] Restart container and verify data persists
- [ ] Run migrations and verify database schema

---

## Conclusion

The auto-generated Docker configuration shows a **good framework** but lacks **project-specific intelligence**. The main gaps are:

1. **Assumption-based rather than detection-based** - Assumes Next.js/npm instead of detecting Express/pnpm
2. **Generic health checks** - Doesn't verify actual health endpoints exist
3. **Incomplete volume mapping** - Misses critical uploads directory
4. **Rigid migration logic** - Only checks for common patterns, not custom setups

By implementing the detection logic outlined in Section 5, your auto-deployment system can become truly universal and work correctly with **any Node.js application**.

**Estimated Time to Fix All Issues:** ~30 minutes  
**Estimated Time to Implement Smart Detection:** ~4 hours

---

*Report generated for NCU Command deployment system improvement initiative*

