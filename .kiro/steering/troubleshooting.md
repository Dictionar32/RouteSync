# RouteSync: Common Issues & Solutions

## Filosofi Troubleshooting

RouteSync troubleshooting menggunakan **systematic approach**: identifikasi tahap bermasalah (Scan → Generate → Runtime), isolasi root cause, dan apply targeted solutions. Setiap issue dikategorisasi berdasarkan severity dan impact.

## Quick Diagnosis

### 1. Health Check Command
```bash
# Comprehensive system check
npx routesync doctor

# Output contoh:
✅ Node.js version: 20.10.0 (compatible)
✅ PHP available: 8.2.4 (compatible) 
❌ Laravel project: Not detected
✅ Dependencies: All required packages installed
⚠️  Cache directory: Permissions issue detected
```

### 2. Common Error Categories
```bash
# Scanning errors
ERROR: PHP not found in PATH
ERROR: Database connection failed
ERROR: Route file not found

# Generation errors  
ERROR: Type inference failed for 'UserResource'
ERROR: Manifest validation failed
ERROR: Template compilation error

# Runtime errors
ERROR: Hook not found: useUsers
ERROR: Type mismatch in generated code
ERROR: Network request failed
```

## Installation & Setup Issues

### Issue 1: "Command not found: routesync"

**Symptoms:**
```bash
$ routesync --version
bash: routesync: command not found
```

**Diagnosis:**
```bash
# Check npm global installation
npm list -g routesync

# Check PATH untuk npm global binaries
echo $PATH | grep npm
```

**Solutions:**
```bash
# Option 1: Install globally
npm install -g routesync@latest

# Option 2: Use npx (recommended)
npx routesync@latest --version

# Option 3: Fix PATH issues (macOS/Linux)
export PATH=$PATH:$(npm config get prefix)/bin
echo 'export PATH=$PATH:$(npm config get prefix)/bin' >> ~/.bashrc

# Option 4: Fix PATH issues (Windows)
setx PATH "%PATH%;%APPDATA%\npm"
```

### Issue 2: "PHP not found in PATH"

**Symptoms:**
```bash
$ routesync scan --input routes/api.php
Error: PHP not found in PATH. Laravel scanning requires PHP to be available.
```

**Diagnosis:**
```bash
# Test PHP availability
php --version
which php  # macOS/Linux
where php  # Windows
```

**Solutions:**
```bash
# macOS dengan Homebrew
brew install php

# Ubuntu/Debian
sudo apt update && sudo apt install php php-cli

# Windows dengan Chocolatey
choco install php

# Manual PATH fix
export PATH="/path/to/php:$PATH"  # Linux/macOS
set PATH=C:\path\to\php;%PATH%    # Windows

# Verify installation
php --version
routesync scan --input routes/api.php --dry-run
```

### Issue 3: Node.js Version Compatibility

**Symptoms:**
```bash
$ npx routesync generate
Error: RouteSync requires Node.js version 20 or higher. Current: 18.17.0
```

**Solutions:**
```bash
# Install Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify version
node --version  # Should be 20.x.x

# Alternative: Use Docker
docker run -it --rm -v $(pwd):/workspace node:20 npm install -g routesync
```
## Laravel Integration Issues

### Issue 4: "Database connection failed"

**Symptoms:**
```bash
$ routesync scan --input routes/api.php --models
Error: SQLSTATE[HY000] [1045] Access denied for user 'root'@'localhost'
```

**Diagnosis:**
```bash
# Test Laravel database connection
cd your-laravel-project
php artisan tinker
>>> DB::connection()->getPdo();

# Check .env configuration
cat .env | grep DB_
```

**Solutions:**
```bash
# Fix .env database credentials
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Test database connection
php artisan migrate:status

# Alternative: Use SQLite untuk development
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

# Create SQLite database
touch database/database.sqlite
php artisan migrate

# Scan dengan SQLite
routesync scan --input routes/api.php --models
```

### Issue 5: "Route file not found or empty"

**Symptoms:**
```bash
$ routesync scan --input routes/api.php
Error: No routes found in routes/api.php
```

**Diagnosis:**
```bash
# Check file exists
ls -la routes/api.php

# Check file content
head -20 routes/api.php

# Test Laravel route loading
php artisan route:list --path=api
```

**Solutions:**
```bash
# Ensure routes/api.php exists dan has routes
cat routes/api.php

# Basic route file should contain:
<?php
Route::middleware('api')->prefix('api')->group(function () {
    Route::apiResource('users', UserController::class);
});

# Check route registration di bootstrap/app.php atau RouteServiceProvider
# Laravel 11: bootstrap/app.php
# Laravel 10: app/Providers/RouteServiceProvider.php

# Test route loading
php artisan route:list
```

### Issue 6: "Controller not found during scanning"

**Symptoms:**
```bash
$ routesync scan --input routes/api.php
Warning: Controller 'UserController' not found, skipping type inference
```

**Diagnosis:**
```bash
# Check controller exists
ls -la app/Http/Controllers/UserController.php

# Check namespace
head -5 app/Http/Controllers/UserController.php

# Test controller loading
php artisan tinker
>>> new App\Http\Controllers\UserController;
```

**Solutions:**
```bash
# Create missing controller
php artisan make:controller UserController --api --model=User

# Fix namespace dalam controller
<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;

class UserController extends Controller
{
    public function index() { /* */ }
}

# Run composer autoload jika diperlukan
composer dump-autoload
```

## Type Inference Issues

### Issue 7: "Type inference failed for Resource"

**Symptoms:**
```bash
$ routesync generate --manifest routesync.manifest.json
Warning: Could not infer response type for 'UserResource'
Generated type: unknown
```

**Diagnosis:**
```bash
# Check Resource class exists
ls -la app/Http/Resources/UserResource.php

# Check Resource structure
cat app/Http/Resources/UserResource.php
```

**Solutions:**
```bash
# Add explicit type annotation
<?php
class UserController extends Controller
{
    #[Response(model: User::class)]
    public function index(): JsonResponse
    {
        return UserResource::collection(User::all());
    }
    
    #[Response(model: User::class)]  
    public function show(User $user): JsonResponse
    {
        return new UserResource($user);
    }
}

# Alternative: Add @mixin annotation ke Resource
<?php
/**
 * @mixin \App\Models\User
 */
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
        ];
    }
}

# Re-scan setelah fix
routesync scan --input routes/api.php --models --force
```

### Issue 8: "Model schema not detected"

**Symptoms:**
```bash
$ routesync scan --input routes/api.php --models
Warning: Model 'User' schema could not be determined
```

**Diagnosis:**
```bash
# Test model loading
php artisan tinker
>>> $user = new App\Models\User;
>>> $user->getTable();
>>> Schema::getColumns($user->getTable());
```

**Solutions:**
```bash
# Ensure model exists dan has table
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $table = 'users';  // Explicit table name
    
    protected $fillable = [
        'name', 'email', 'password'
    ];
}

# Run migrations jika belum
php artisan migrate

# Check database table exists
php artisan tinker
>>> Schema::hasTable('users');
>>> Schema::getColumns('users');

# Re-scan dengan verbose logging
DEBUG=routesync:scanner routesync scan --input routes/api.php --models
```
## Code Generation Issues

### Issue 9: "Generated TypeScript compilation errors"

**Symptoms:**
```bash
$ npx tsc --noEmit
src/api/api.ts:15:7 - error TS2322: Type 'unknown' is not assignable to type 'User'
```

**Diagnosis:**
```bash
# Check generated files
ls -la src/api/

# Inspect problematic file
head -20 src/api/api.ts

# Check type definitions
cat src/api/types.ts | grep "interface User"
```

**Solutions:**
```bash
# Re-generate dengan explicit model scanning
routesync scan --input routes/api.php --models --force
routesync generate --manifest routesync.manifest.json --output src/api --force

# Check tsconfig.json configuration
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,  // Skip library type checking
    "moduleResolution": "bundler"
  }
}

# Fix import paths jika needed
// Ubah dari:
import { User } from './types'
// Ke:
import type { User } from './types'

# Verify compilation
npx tsc --noEmit --skipLibCheck
```

### Issue 10: "Hook not found" error

**Symptoms:**
```typescript
// Error di runtime
import { useUsers } from '@/api'  // Error: Module not found
```

**Diagnosis:**
```bash
# Check generated files structure
ls -la src/api/
cat src/api/index.ts

# Check imports di generated files
grep -r "useUsers" src/api/
```

**Solutions:**
```bash
# Ensure proper generation flags
routesync generate --manifest routesync.manifest.json --output src/api --hooks

# Check generated hooks file exists
ls -la src/api/hooks.ts

# Check index.ts exports
cat src/api/index.ts
# Should contain:
export * from './hooks'
export * from './types'
export * from './api'

# Fix import path jika needed
// Check tsconfig paths
{
  "compilerOptions": {
    "paths": {
      "@/api/*": ["./src/api/*"]
    }
  }
}
```

### Issue 11: "Zod schema validation errors"

**Symptoms:**
```typescript
// Runtime error
ZodError: Invalid input at "email": Expected string, received number
```

**Diagnosis:**
```bash
# Check FormRequest rules
cat app/Http/Requests/StoreUserRequest.php

# Check generated schemas
cat src/api/schemas.ts | grep "UserCreateSchema"
```

**Solutions:**
```bash
# Fix FormRequest rules untuk proper types
<?php
class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email'], // Ensure 'string' rule
            'age' => ['required', 'integer', 'min:18'],  // Explicit integer
        ];
    }
}

# Re-generate schemas
routesync scan --input routes/api.php --force
routesync generate --manifest routesync.manifest.json --output src/api --zod

# Debug schema dalam runtime
import { UserCreateSchema } from '@/api/schemas'
console.log(UserCreateSchema.safeParse(formData))
```

## Runtime Issues

### Issue 12: "Network request failed"

**Symptoms:**
```javascript
// Console error
Failed to fetch: TypeError: Failed to fetch
CORS error: Access to fetch blocked by CORS policy
```

**Diagnosis:**
```bash
# Check network tab di browser DevTools
# Check Laravel API endpoint
curl -X GET http://localhost:8000/api/users

# Check CORS configuration
cat config/cors.php  # Laravel
```

**Solutions:**
```bash
# Fix CORS di Laravel
# config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:3000'], // Frontend URL
    'allowed_headers' => ['*'],
    'supports_credentials' => true,
];

# Install Laravel CORS jika belum
composer require fruitcake/laravel-cors

# Add CORS middleware di Kernel.php
protected $middleware = [
    \Fruitcake\Cors\HandleCors::class,
];

# Fix API client base URL
import { createClient } from 'routesync'

createClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  withCredentials: true
})
```

### Issue 13: "Authentication token issues"

**Symptoms:**
```javascript
// 401 Unauthorized responses
Error: Unauthenticated
```

**Diagnosis:**
```bash
# Check token storage
console.log(localStorage.getItem('auth_token'))

# Check API client configuration
# Check Laravel Sanctum configuration
```

**Solutions:**
```bash
# Setup Sanctum properly di Laravel
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate

# Configure Sanctum
# config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3000')),

# Setup client authentication
import { createClient } from 'routesync'

const client = createClient({
  baseURL: '/api',
  withCredentials: true
})

// Set token setelah login
client.setToken(loginResponse.token)

// Clear token saat logout  
client.removeToken()
```

### Issue 14: "React Query cache issues"

**Symptoms:**
```javascript
// Data tidak ter-update setelah mutation
// Stale data ditampilkan
```

**Diagnosis:**
```bash
# Check React Query DevTools
# Inspect cache keys
# Check invalidation logic
```

**Solutions:**
```typescript
// Proper cache invalidation
import { useQueryClient } from '@tanstack/react-query'
import { useUsersCreate } from '@/api'

const queryClient = useQueryClient()
const createUser = useUsersCreate()

const handleSubmit = (data) => {
  createUser.mutate(data, {
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['users'] })
      
      // Or update cache directly
      queryClient.setQueryData(['users'], (old) => ({
        ...old,
        data: [...old.data, newUser]
      }))
    }
  })
}

// Fix stale time configuration
const { users } = useUsers({
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000,   // 10 minutes
})
```
## Performance Issues

### Issue 15: "Slow generation time"

**Symptoms:**
```bash
$ routesync generate --manifest large-manifest.json
Generation took 45 seconds for 500 routes (should be < 15s)
```

**Diagnosis:**
```bash
# Enable performance monitoring
ROUTESYNC_PERF=true routesync generate --manifest manifest.json

# Check manifest size
du -h routesync.manifest.json
wc -l routesync.manifest.json

# Profile memory usage
node --max-old-space-size=4096 --prof $(which routesync) generate
```

**Solutions:**
```bash
# Enable caching
ROUTESYNC_CACHE=true routesync generate --manifest manifest.json

# Use optimized IR builder
routesync generate --manifest manifest.json --optimize

# Split large manifests
routesync generate --manifest manifest.json --chunk-size 100

# Increase Node.js memory limit
node --max-old-space-size=8192 $(which routesync) generate

# Alternative: Use streaming generation
routesync generate --manifest manifest.json --stream
```

### Issue 16: "High memory usage"

**Symptoms:**
```bash
# Memory usage > 2GB untuk 1000 routes
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Diagnosis:**
```bash
# Monitor memory during generation
node --expose-gc --inspect $(which routesync) generate

# Check for memory leaks
node --trace-gc $(which routesync) generate
```

**Solutions:**
```bash
# Increase heap size
node --max-old-space-size=8192 $(which routesync) generate

# Enable garbage collection
node --expose-gc $(which routesync) generate

# Use chunked processing
routesync generate --manifest manifest.json --max-routes-per-chunk 50

# Clear cache if needed
routesync cache clear
rm -rf .routesync/cache
```

## Development & Watch Mode Issues

### Issue 17: "Watch mode not detecting changes"

**Symptoms:**
```bash
$ routesync watch --input routes/api.php --output src/api
# File changes tidak trigger regeneration
```

**Diagnosis:**
```bash
# Check file watcher limits (Linux)
cat /proc/sys/fs/inotify/max_user_watches

# Check file permissions
ls -la routes/api.php

# Test manual detection
touch routes/api.php
```

**Solutions:**
```bash
# Increase inotify limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Use polling mode jika inotify gagal
routesync watch --input routes/api.php --output src/api --poll

# Check ignored patterns
routesync watch --input routes/api.php --output src/api --verbose

# Alternative: Use nodemon
nodemon --watch routes/api.php --ext php --exec "routesync scan && routesync generate"
```

### Issue 18: "Hot reload breaking after regeneration"

**Symptoms:**
```bash
# Next.js/Vite hot reload berhenti bekerja setelah RouteSync regeneration
```

**Diagnosis:**
```bash
# Check generated file timestamps
ls -la src/api/ --time-style=full-iso

# Check if build tools detect changes
# Monitor console untuk HMR logs
```

**Solutions:**
```bash
# Configure build tools untuk ignore generated files dari hot reload
# Next.js: next.config.js
module.exports = {
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/src/api/**'] // Ignore RouteSync generated files
    }
    return config
  }
}

# Vite: vite.config.ts
export default defineConfig({
  server: {
    watch: {
      ignored: ['**/src/api/**']
    }
  }
})

# Alternative: Manual reload setelah generation
routesync generate --manifest manifest.json && kill -USR2 $NEXT_PID
```

## CI/CD Issues

### Issue 19: "Generation fails in CI environment"

**Symptoms:**
```bash
# GitHub Actions error
Error: ENOENT: no such file or directory, open 'routesync.manifest.json'
```

**Diagnosis:**
```bash
# Check CI environment variables
env | grep CI

# Check file paths di CI
ls -la
pwd
```

**Solutions:**
```yaml
# GitHub Actions fix
jobs:
  generate:
    steps:
      - name: Create manifest directory
        run: mkdir -p .routesync
        
      - name: Download manifest artifact
        uses: actions/download-artifact@v4
        with:
          name: routesync-manifest
          path: .
          
      - name: Verify manifest exists
        run: |
          ls -la routesync.manifest.json
          cat routesync.manifest.json | jq '.version'
          
      - name: Generate SDK
        run: routesync generate --manifest routesync.manifest.json --output src/api
        env:
          NODE_ENV: production
```

### Issue 20: "TypeScript errors in CI but not locally"

**Symptoms:**
```bash
# CI fails dengan TypeScript errors yang tidak muncul locally
```

**Diagnosis:**
```bash
# Check TypeScript version differences
npm list typescript

# Check generated code differences
diff -u local-api.ts ci-api.ts
```

**Solutions:**
```bash
# Pin TypeScript version
npm install --save-dev typescript@5.4.5

# Use same Node version di CI dan local
# .nvmrc
20.10.0

# GitHub Actions
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version-file: '.nvmrc'

# Consistent generation environment
routesync generate --manifest manifest.json --production --no-debug
```

## Debugging Utilities

### Custom Debug Scripts

```bash
#!/bin/bash
# debug-routesync.sh - Comprehensive debugging script

echo "🔍 RouteSync Debug Report"
echo "========================"

echo "📊 System Information:"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PHP: $(php --version | head -1)"
echo "RouteSync: $(routesync --version 2>/dev/null || echo 'Not installed')"
echo ""

echo "📁 Project Structure:"
ls -la routes/ 2>/dev/null || echo "❌ No routes directory"
ls -la app/Http/Controllers/ 2>/dev/null || echo "❌ No controllers directory"
ls -la app/Http/Resources/ 2>/dev/null || echo "❌ No resources directory"
echo ""

echo "🔧 Laravel Configuration:"
php artisan route:list --path=api 2>/dev/null | head -10 || echo "❌ Cannot list routes"
echo ""

echo "📦 Dependencies:"
npm list routesync 2>/dev/null || echo "❌ RouteSync not installed locally"
composer show | grep laravel 2>/dev/null | head -3 || echo "❌ Cannot detect Laravel"
echo ""

echo "🎯 Generated Files:"
ls -la src/api/ 2>/dev/null || echo "❌ No generated API files"
echo ""

echo "✅ Debug complete!"
```

### Log Analysis Tools

```typescript
// utils/debug-logger.ts
export class RouteSync DebugLogger {
  private logs: Array<{ timestamp: Date; level: string; message: string; data?: any }> = []
  
  log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const entry = {
      timestamp: new Date(),
      level,
      message,
      data
    }
    
    this.logs.push(entry)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RouteSync:${level.toUpperCase()}] ${message}`, data || '')
    }
  }
  
  export() {
    return {
      logs: this.logs,
      summary: {
        total: this.logs.length,
        errors: this.logs.filter(l => l.level === 'error').length,
        warnings: this.logs.filter(l => l.level === 'warn').length
      }
    }
  }
  
  clear() {
    this.logs = []
  }
}

// Usage
const debugLogger = new RouteSync DebugLogger()
debugLogger.log('info', 'Starting type inference', { typeName: 'UserResource' })
```

## Emergency Recovery

### Complete Reset Procedure

```bash
#!/bin/bash
# emergency-reset.sh - Complete RouteSync reset

echo "🚨 Emergency RouteSync Reset"
echo "This will clear all caches and regenerate everything"
read -p "Continue? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🧹 Clearing caches..."
  rm -rf .routesync/cache
  rm -rf node_modules/.cache/routesync
  
  echo "🗑️  Removing generated files..."
  rm -rf src/api/
  
  echo "📱 Clearing Laravel caches..."
  php artisan config:clear
  php artisan route:clear
  php artisan cache:clear
  
  echo "🔄 Reinstalling RouteSync..."
  npm uninstall routesync
  npm install routesync@latest
  
  echo "📊 Fresh scan..."
  routesync scan --input routes/api.php --models --force
  
  echo "⚡ Fresh generation..."
  routesync generate --manifest routesync.manifest.json --output src/api --force
  
  echo "✅ Reset complete!"
else
  echo "❌ Reset cancelled"
fi
```

### Health Check & Recovery

```bash
# comprehensive-health-check.sh
#!/bin/bash

ISSUES_FOUND=0

echo "🏥 RouteSync Health Check"
echo "========================"

# Check Node.js version
NODE_VERSION=$(node --version | cut -c 2- | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js version $NODE_VERSION < 20"
  ISSUES_FOUND=1
else
  echo "✅ Node.js version OK"
fi

# Check RouteSync installation
if ! command -v routesync &> /dev/null; then
  echo "❌ RouteSync CLI not installed"
  echo "   Fix: npm install -g routesync@latest"
  ISSUES_FOUND=1
else
  echo "✅ RouteSync CLI installed"
fi

# Check PHP
if ! command -v php &> /dev/null; then
  echo "❌ PHP not available"
  echo "   Fix: Install PHP and add to PATH"
  ISSUES_FOUND=1
else
  echo "✅ PHP available"
fi

# Check Laravel project
if [ ! -f "artisan" ]; then
  echo "❌ Not in Laravel project root"
  ISSUES_FOUND=1
else
  echo "✅ Laravel project detected"
fi

if [ $ISSUES_FOUND -eq 0 ]; then
  echo ""
  echo "🎉 All checks passed! RouteSync is ready to use."
else
  echo ""
  echo "⚠️  Found $ISSUES_FOUND issue(s). Please fix them before using RouteSync."
fi
```

Troubleshooting guide ini menyediakan **systematic approach** untuk mendiagnosis dan mengatasi masalah RouteSync dari installation sampai production deployment, dengan focus pada **practical solutions** dan **prevention strategies**.
```