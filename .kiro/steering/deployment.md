# RouteSync: Panduan Deployment & Production

## Filosofi Deployment

RouteSync deployment melibatkan **dual environment setup**: Backend Laravel untuk scanning dan Frontend untuk consuming generated SDKs. Deployment harus mempertimbangkan CI/CD pipelines, environment parity, dan production safety.

## Deployment Strategies

### 1. Separate Repository Strategy (Recommended)
```
Backend Repo (Laravel)
├── routes/api.php
├── app/Models/
└── routesync.manifest.json (generated)

Frontend Repo (Next.js/React/Vue)  
├── src/api/ (generated)
├── package.json
└── routesync.manifest.json (copied from backend)
```

**Benefits:**
- Independent deployment cycles
- Team separation (backend vs frontend)
- Technology stack independence

### 2. Monorepo Strategy
```
Project Root/
├── backend/
│   ├── routes/api.php
│   └── routesync.manifest.json
├── frontend/
│   ├── src/api/
│   └── package.json  
└── .github/workflows/
```

**Benefits:**
- Shared CI/CD pipelines
- Atomic changes across backend/frontend
- Simplified dependency management

## CI/CD Pipeline Setup

### GitHub Actions Workflow
```yaml
# .github/workflows/routesync.yml
name: RouteSync CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-scan:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: routesync_test
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: pdo_mysql
          
      - name: Install Laravel Dependencies
        run: |
          cd backend
          composer install --no-dev --optimize-autoloader
          
      - name: Setup Laravel Environment
        run: |
          cd backend
          cp .env.example .env
          php artisan key:generate
          php artisan migrate --force
          
      - name: Install RouteSync CLI
        run: npm install -g routesync@latest
        
      - name: Generate Manifest
        run: |
          cd backend
          routesync scan --input routes/api.php --models --output ../routesync.manifest.json
          
      - name: Upload Manifest Artifact
        uses: actions/upload-artifact@v4
        with:
          name: routesync-manifest
          path: routesync.manifest.json

  frontend-generate:
    runs-on: ubuntu-latest
    needs: backend-scan
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Download Manifest Artifact
        uses: actions/download-artifact@v4
        with:
          name: routesync-manifest
          
      - name: Install Dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Generate SDK
        run: |
          cd frontend
          routesync generate --manifest ../routesync.manifest.json --output src/api --next-actions --zod
          
      - name: Type Check Generated Code
        run: |
          cd frontend
          npx tsc --noEmit
          
      - name: Build Frontend
        run: |
          cd frontend
          npm run build
          
      - name: Upload Build Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist/
```

### GitLab CI Pipeline
```yaml
# .gitlab-ci.yml
stages:
  - scan
  - generate
  - test
  - deploy

variables:
  PHP_VERSION: "8.2"
  NODE_VERSION: "20"

backend-scan:
  stage: scan
  image: php:${PHP_VERSION}
  
  services:
    - mysql:8.0
    
  variables:
    MYSQL_ROOT_PASSWORD: password
    MYSQL_DATABASE: routesync_test
    
  before_script:
    - apt-get update && apt-get install -y git unzip
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    - curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    - apt-get install -y nodejs
    - npm install -g routesync@latest
    
  script:
    - cd backend
    - composer install --no-dev --optimize-autoloader
    - cp .env.example .env
    - php artisan key:generate
    - php artisan migrate --force
    - routesync scan --input routes/api.php --models --output ../routesync.manifest.json
    
  artifacts:
    paths:
      - routesync.manifest.json
    expire_in: 1 hour

frontend-generate:
  stage: generate
  image: node:${NODE_VERSION}
  
  dependencies:
    - backend-scan
    
  script:
    - cd frontend
    - npm ci
    - routesync generate --manifest ../routesync.manifest.json --output src/api --next-actions --zod
    - npx tsc --noEmit
    - npm run build
    
  artifacts:
    paths:
      - frontend/dist/
    expire_in: 1 day
```

## Environment Configuration

### Production Environment Variables
```bash
# Backend (.env)
APP_ENV=production
APP_DEBUG=false
DB_CONNECTION=mysql
DB_HOST=db.production.com
DB_DATABASE=app_production
ROUTESYNC_CACHE_ENABLED=true
ROUTESYNC_CACHE_TTL=3600

# Frontend (.env.production)
NEXT_PUBLIC_API_URL=https://api.production.com
ROUTESYNC_GENERATED_AT=2024-01-01T12:00:00Z
```

### Staging Environment
```bash
# Backend (.env.staging)
APP_ENV=staging
APP_DEBUG=true
DB_CONNECTION=mysql
DB_HOST=db.staging.com
ROUTESYNC_VERBOSE=true

# Frontend (.env.staging) 
NEXT_PUBLIC_API_URL=https://api.staging.com
ROUTESYNC_DEBUG=true
```

## Production Deployment

### Docker Setup
```dockerfile
# Dockerfile.backend
FROM php:8.2-fpm

WORKDIR /var/www

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader

COPY . .

# Install RouteSync CLI
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs
RUN npm install -g routesync@latest

# Generate manifest during build
RUN php artisan migrate --force && \
    routesync scan --input routes/api.php --models --output routesync.manifest.json

EXPOSE 9000
```

```dockerfile
# Dockerfile.frontend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Copy manifest from backend build
COPY --from=backend-builder /var/www/routesync.manifest.json ./

# Generate SDK
RUN routesync generate --manifest routesync.manifest.json --output src/api --next-actions --zod

COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
```

### Docker Compose
```yaml
# docker-compose.production.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DB_HOST=db
      - DB_DATABASE=production
    depends_on:
      - db
      
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
      
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: production
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

## Deployment Verification

### Health Check Scripts
```typescript
// scripts/verify-deployment.ts
import { api } from '../src/api'

async function verifyDeployment() {
  try {
    console.log('🔍 Verifying API connectivity...')
    
    // Test basic endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
    
    if (!response.ok) {
      throw new Error(`API health check failed: ${response.status}`)
    }
    
    console.log('✅ API connectivity verified')
    
    // Test generated SDK
    console.log('🔍 Testing generated SDK...')
    
    const result = await api.health.check()
    
    if (!result.status) {
      throw new Error('SDK health check failed')
    }
    
    console.log('✅ SDK functionality verified')
    console.log('🚀 Deployment verification successful!')
    
  } catch (error) {
    console.error('❌ Deployment verification failed:', error)
    process.exit(1)
  }
}

verifyDeployment()
```

### Automated Testing
```bash
#!/bin/bash
# scripts/deploy-test.sh

echo "🧪 Running deployment tests..."

# Test generated types compile
echo "Checking TypeScript compilation..."
cd frontend && npx tsc --noEmit

# Test generated code quality
echo "Running linting on generated code..."
npx eslint src/api/ --ext .ts,.tsx

# Test runtime functionality
echo "Running integration tests..."
npm run test:integration

# Test API connectivity
echo "Verifying API connectivity..."
node scripts/verify-deployment.js

echo "✅ All deployment tests passed!"
```

## Production Optimization

### Build Optimization
```json
{
  "scripts": {
    "build:production": "routesync generate --manifest manifest.json --output src/api --production && next build",
    "build:analyze": "ANALYZE=true npm run build:production"
  }
}
```

### CDN Integration
```typescript
// next.config.js
module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.example.com' 
    : '',
    
  // Optimize generated SDK for CDN
  experimental: {
    esmExternals: true,
  }
}
```

## Rollback Strategy

### Blue-Green Deployment
```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

CURRENT_ENV=$(curl -s https://api.production.com/env)
TARGET_ENV=$([[ "$CURRENT_ENV" == "blue" ]] && echo "green" || echo "blue")

echo "Current: $CURRENT_ENV, Target: $TARGET_ENV"

# Deploy to target environment
docker-compose -f docker-compose.$TARGET_ENV.yml up -d

# Health check
./scripts/health-check.sh $TARGET_ENV

if [ $? -eq 0 ]; then
  # Switch traffic
  echo "Switching traffic to $TARGET_ENV"
  # Update load balancer configuration
  
  # Stop old environment
  docker-compose -f docker-compose.$CURRENT_ENV.yml down
else
  echo "Health check failed, keeping $CURRENT_ENV active"
  docker-compose -f docker-compose.$TARGET_ENV.yml down
  exit 1
fi
```

### Rollback Script
```bash
#!/bin/bash
# scripts/rollback.sh

PREVIOUS_VERSION=$(git describe --tags --abbrev=0 HEAD~1)

echo "Rolling back to version: $PREVIOUS_VERSION"

# Rollback backend
git checkout $PREVIOUS_VERSION -- backend/

# Regenerate manifest from previous version
cd backend
routesync scan --input routes/api.php --models

# Regenerate frontend SDK
cd ../frontend
routesync generate --manifest ../backend/routesync.manifest.json --output src/api

# Build and deploy
npm run build
./scripts/deploy.sh
```

## Monitoring & Alerting

### Production Monitoring
```typescript
// utils/monitoring.ts
class ProductionMonitor {
  static reportMetric(name: string, value: number) {
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service
      fetch('/api/metrics', {
        method: 'POST',
        body: JSON.stringify({ name, value, timestamp: Date.now() })
      })
    }
  }
  
  static reportError(error: Error, context?: any) {
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      console.error('Production Error:', {
        message: error.message,
        stack: error.stack,
        context
      })
    }
  }
}

// Monitor API client performance
const originalFetch = api.fetch
api.fetch = async (...args) => {
  const start = performance.now()
  
  try {
    const result = await originalFetch(...args)
    ProductionMonitor.reportMetric('api_request_duration', performance.now() - start)
    return result
  } catch (error) {
    ProductionMonitor.reportError(error as Error, { args })
    throw error
  }
}
```

### Log Aggregation
```typescript
// utils/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'routesync-frontend',
    version: process.env.DEPLOYMENT_VERSION
  },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

export default logger
```

## Security Considerations

### API Security
```typescript
// Security middleware for generated API
import { createClient } from 'routesync'

createClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  
  // Security headers
  onRequest: (config) => {
    config.headers['X-Requested-With'] = 'XMLHttpRequest'
    config.headers['X-Client-Version'] = process.env.CLIENT_VERSION
    return config
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Request timeout
  timeout: 30000,
  
  // CSRF protection
  withCredentials: true
})
```

### Environment Secrets
```bash
# Use environment-specific secret management

# Development
export ROUTESYNC_API_KEY="dev-key-123"

# Staging  
export ROUTESYNC_API_KEY="$(vault kv get -field=api_key secret/staging/routesync)"

# Production
export ROUTESYNC_API_KEY="$(vault kv get -field=api_key secret/production/routesync)"
```

## Troubleshooting Production Issues

### Common Production Problems
```bash
# 1. Manifest out of sync
curl https://api.production.com/routesync/manifest/hash
# Compare with frontend manifest hash

# 2. Type errors after deployment
cd frontend && npx tsc --noEmit --skipLibCheck

# 3. API endpoint mismatch
grep -r "useApi" src/ | grep -v ".d.ts"
# Check if all hooks match available endpoints

# 4. Performance degradation
node --perf-basic-prof scripts/perf-test.js
```

### Emergency Hotfix Process
```bash
#!/bin/bash
# scripts/emergency-hotfix.sh

echo "🚨 Emergency hotfix deployment"

# Create hotfix branch
git checkout -b "hotfix/$(date +%Y%m%d-%H%M%S)"

# Apply minimal fix
echo "Apply your emergency fix now, then press Enter"
read

# Fast regeneration (skip tests for speed)
routesync generate --manifest manifest.json --output src/api --fast

# Deploy immediately
npm run build:fast
./scripts/deploy-direct.sh

echo "🚀 Emergency hotfix deployed"
```