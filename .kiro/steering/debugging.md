# RouteSync: Panduan Debugging & Troubleshooting

## Filosofi Debugging

RouteSync memiliki **multi-stage pipeline** yang kompleks, sehingga debugging membutuhkan pendekatan sistematis untuk mengidentifikasi masalah di setiap tahap: Parse → Semantic → IR → Emit.

## Debug Tools & Setup

### Environment Variables
```bash
# Enable debug logging untuk semua RouteSync modules
DEBUG=routesync:* npm run generate

# Debug specific modules
DEBUG=routesync:parser,routesync:semantic npm run generate
DEBUG=routesync:emitter npm run generate

# Verbose CLI output
ROUTESYNC_VERBOSE=true npm run generate
```

### Development Debug Mode
```bash
# Run dengan Node inspector untuk step debugging
node --inspect-brk ./dist/cli.js generate --manifest test.json

# Enable source maps untuk better stack traces
NODE_OPTIONS="--enable-source-maps" npm run generate
```

## Common Issues & Solutions

### 1. Type Inference Gagal

**Symptoms:**
- Generated types adalah `unknown` atau `any`
- Error: "Could not infer response type"
- Missing model types di output

**Debug Steps:**
```bash
# Check semantic resolution log
DEBUG=routesync:semantic npm run generate

# Validate manifest structure
cat routesync.manifest.json | jq '.routes[0].response'
```

**Solutions:**
```php
// ✅ Add explicit #[Response] annotation
#[Response(model: User::class)]
public function show(User $user) {
    return new UserResource($user);
}

// ✅ Fix Resource naming convention
class UserResource extends JsonResource // → User model
class PublicProfileResource extends JsonResource {
    // Add @mixin annotation
    /** @mixin \App\Models\User */
}
```

### 2. Generated TypeScript Compilation Errors

**Symptoms:**
- `tsc` errors pada generated files
- Import resolution failures
- Type conflicts

**Debug Steps:**
```bash
# Check generated file syntax
npx tsc --noEmit src/api/api.ts

# Validate import paths
DEBUG=routesync:emitter npm run generate

# Check type conflicts
npx tsc --listFiles --noEmit src/api/
```

**Solutions:**
```typescript
// Check tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@/api/*": ["./src/api/*"]
    }
  }
}

// Verify generated imports
import type { User } from './types'  // ✅ Relative import
import type { User } from '@/types'  // ❌ May fail resolution
```

### 3. Laravel Scanning Failures

**Symptoms:**
- "PHP not found in PATH"
- "Database connection failed"  
- Empty manifest generation

**Debug Steps:**
```bash
# Test PHP availability
php --version
which php

# Test Laravel bootstrap
php artisan route:list

# Debug scan process
DEBUG=routesync:scanner npm run scan
```

**Solutions:**
```bash
# Fix PHP PATH (Linux/macOS)
export PATH="/usr/bin/php:$PATH"

# Fix database connection
# Check .env file in Laravel project
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_db
DB_USERNAME=your_user
DB_PASSWORD=your_pass

# Alternative: Use SQLite for scanning
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

### 4. Hook Generation Issues

**Symptoms:**
- Missing React/Vue hooks
- Invalid hook signatures
- Runtime hook errors

**Debug Steps:**
```bash
# Check hook emitter logs
DEBUG=routesync:emitter:hooks npm run generate

# Validate generated hook types
npx tsc --noEmit src/api/hooks.ts

# Check framework dependencies
npm ls @tanstack/react-query
npm ls @tanstack/vue-query
```

**Solutions:**
```json
// package.json dependencies
{
  "dependencies": {
    "@tanstack/react-query": "^5.101.0",
    "routesync": "^1.0.49"
  }
}

// Check hook usage
const { data, isLoading } = useUsers() // ✅ Destructure correctly
const result = useUsers()             // ✅ Use full result object
```

### 5. Zod Schema Generation Problems

**Symptoms:**
- Missing schemas.ts file
- Invalid Zod schemas
- Validation runtime errors

**Debug Steps:**
```bash
# Check FormRequest scanning
DEBUG=routesync:scanner:validation npm run scan --models

# Validate schema generation
DEBUG=routesync:emitter:zod npm run generate --zod

# Test generated schemas
node -e "require('./src/api/schemas').UserCreateSchema.parse({})"
```

**Solutions:**
```php
// ✅ Use FormRequest classes (not inline validation)
class StoreUserRequest extends FormRequest {
    public function rules(): array {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
        ];
    }
}

// ❌ Inline validation won't be detected
public function store(Request $request) {
    $request->validate(['name' => 'required']);
}
```

## Debug Workflow per Pipeline Stage

### 1. Parse Stage Debugging
```bash
# Check route file parsing
DEBUG=routesync:parser npm run scan --input routes/api.php

# Validate PHP reflection output
php -r "
include 'bootstrap/app.php';
\$routes = Route::getRoutes();
foreach (\$routes as \$route) {
    echo \$route->uri() . PHP_EOL;
}
"
```

### 2. Semantic Resolution Debugging
```bash
# Debug type resolution
DEBUG=routesync:semantic:resolver npm run generate

# Check symbol table construction
DEBUG=routesync:semantic:symbols npm run generate

# Validate model registry
DEBUG=routesync:semantic:models npm run generate
```

### 3. IR Building Debugging
```bash
# Debug intermediate representation
DEBUG=routesync:ir npm run generate

# Save IR to file for inspection
ROUTESYNC_SAVE_IR=true npm run generate
# Check routesync.ir.json

# Validate IR structure
cat routesync.ir.json | jq '.contracts[0]'
```

### 4. Code Emission Debugging
```bash
# Debug specific emitters
DEBUG=routesync:emitter:api npm run generate
DEBUG=routesync:emitter:types npm run generate
DEBUG=routesync:emitter:hooks npm run generate

# Save intermediate templates
ROUTESYNC_SAVE_TEMPLATES=true npm run generate
```

## Performance Debugging

### Memory Profiling
```bash
# Profile memory usage
node --max-old-space-size=4096 --prof ./dist/cli.js generate
node --prof-process isolate-*.log > profile.txt

# Monitor memory during generation
node --expose-gc --inspect ./dist/cli.js generate
```

### Performance Bottlenecks
```bash
# Time each stage
TIME_ROUTESYNC=true npm run generate

# Profile CPU usage
node --cpu-prof ./dist/cli.js generate
node --cpu-prof-name=routesync.cpuprofile
```

## Error Analysis

### Stack Trace Analysis
```bash
# Get detailed stack traces
NODE_OPTIONS="--stack-trace-limit=50" npm run generate

# Enable async stack traces
NODE_OPTIONS="--async-stack-traces" npm run generate
```

### Log Analysis Tools
```typescript
// Add custom logging dalam development
import { createLogger } from './utils/logger'

const logger = createLogger('semantic-resolver')

class SemanticResolver {
  resolve(route: Route): ResolvedRoute {
    logger.debug('Resolving route:', route.path)
    
    try {
      const result = this.performResolution(route)
      logger.debug('Resolution successful:', result.type)
      return result
    } catch (error) {
      logger.error('Resolution failed:', error.message, { route })
      throw error
    }
  }
}
```

## Debugging Generated Code

### Runtime Debugging
```typescript
// Debug generated hooks
import { useUsers } from './api/hooks'

function MyComponent() {
  const query = useUsers()
  
  // Add debugging
  console.log('Query state:', {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error
  })
  
  return <div>...</div>
}
```

### API Client Debugging
```typescript
// Enable request/response logging
import { createClient } from 'routesync'

createClient({
  baseURL: '/api',
  debug: true, // Enable request logging
  onRequest: (config) => console.log('Request:', config),
  onResponse: (response) => console.log('Response:', response),
  onError: (error) => console.error('Error:', error)
})
```

## CLI Debugging Commands

### Diagnostic Commands
```bash
# Check CLI installation
npx routesync --version

# Validate configuration
npx routesync validate --manifest routesync.manifest.json

# Dry run generation
npx routesync generate --manifest test.json --dry-run

# Check dependencies
npx routesync doctor
```

### Verbose Output
```bash
# Maximum verbosity
npx routesync generate --verbose --debug --trace

# Save logs to file
npx routesync generate 2>&1 | tee debug.log

# JSON formatted logs untuk parsing
ROUTESYNC_LOG_FORMAT=json npx routesync generate
```

## IDE Integration Debugging

### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug RouteSync CLI",
      "type": "node",
      "request": "launch",
      "program": "./dist/cli.js",
      "args": ["generate", "--manifest", "test.json"],
      "env": {
        "DEBUG": "routesync:*"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### TypeScript Language Server Issues
```json
// tsconfig.json - untuk better IDE experience
{
  "compilerOptions": {
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Common Error Messages & Solutions

### "Cannot resolve module 'routesync'"
```bash
# Check installation
npm list routesync

# Reinstall if needed
npm uninstall routesync && npm install routesync@latest
```

### "Manifest file not found"
```bash
# Check file exists
ls -la routesync.manifest.json

# Check permissions
chmod 644 routesync.manifest.json

# Validate JSON syntax
cat routesync.manifest.json | jq '.'
```

### "TypeScript compilation failed"
```bash
# Check TypeScript config
npx tsc --showConfig

# Validate generated code
npx tsc --noEmit src/api/api.ts --skipLibCheck
```

## Debug Tools Development

### Custom Debug Utilities
```typescript
// utils/debug.ts
export const debugManifest = (manifest: Manifest) => {
  console.log('Manifest Summary:')
  console.log(`- Routes: ${manifest.routes.length}`)
  console.log(`- Models: ${manifest.models?.length || 0}`)
  console.log(`- Validation: ${manifest.validation ? 'enabled' : 'disabled'}`)
}

export const debugGeneratedFiles = (files: GeneratedFile[]) => {
  files.forEach(file => {
    console.log(`Generated: ${file.path} (${file.content.length} chars)`)
  })
}
```

### Performance Monitoring
```typescript
// utils/performance.ts
export class PerformanceMonitor {
  private timers = new Map<string, number>()
  
  start(label: string) {
    this.timers.set(label, performance.now())
  }
  
  end(label: string): number {
    const start = this.timers.get(label)
    if (!start) throw new Error(`Timer ${label} not found`)
    
    const duration = performance.now() - start
    console.log(`${label}: ${duration.toFixed(2)}ms`)
    this.timers.delete(label)
    return duration
  }
}
```