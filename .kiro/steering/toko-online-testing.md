# RouteSync Toko-Online Testing Guide

## Filosofi Testing

Ketika ada request tentang testing RouteSync di proyek toko-online, fokus pada **engine capability testing** bukan full application integration. Target adalah memverifikasi bahwa RouteSync engine dapat men-generate SDK yang valid dari Laravel app toko-online.

## Testing Minimal Required (WAJIB)

### 1. Verifikasi Manifest Generation
```bash
# Generate manifest dari Laravel app toko-online
cd /home/annas-zen/Documents/RouteSync
node dist/cli.js scan /home/annas-zen/Documents/laragon-docker/www/toko-online --models --output /tmp/toko-manifest.json

# Validasi manifest structure
python3 -c "
import json
d = json.load(open('/tmp/toko-manifest.json'))
print(f'✅ Routes found: {len(d[\"routes\"])}')
print(f'✅ Models found: {len(d.get(\"models\", []))}')
print('\\n🔍 Sample routes:')
for r in d['routes'][:8]:
    print(f'  {r[\"name\"]} ({r[\"method\"]}) -> {r[\"response\"].get(\"kind\", \"unknown\")}')
"
```

**Expected Results:**
- Routes: 30+ endpoints
- Models: Minimal 1 model
- Response types: resource, object, primitive

### 2. Test Core Engine Generation
```bash
# Generate SDK menggunakan V2 engine
cd /home/annas-zen/Documents/RouteSync
node dist/cli.js generate-v2 --manifest /tmp/toko-manifest.json --output /tmp/toko-sdk

# Verifikasi file structure
echo "🔍 Generated files:"
ls -la /tmp/toko-sdk/
echo "📊 File sizes:"
wc -l /tmp/toko-sdk/*.ts
```

**Expected Files:**
- api.ts (API client)
- types.ts (TypeScript interfaces)
- mappers/ (data transformation)
- contract/ (API contracts)

### 3. TypeScript Compilation Test
```bash
# Test compilation tanpa errors
cd /tmp/toko-sdk
npx tsc --noEmit --skipLibCheck *.ts
echo "✅ TypeScript compilation result: $?"

# Check for critical types
echo "🔍 Critical types check:"
grep -q "Order\|Payment\|Produk" types.ts && echo "✅ Core business types found" || echo "❌ Missing core types"
```

### 4. API Methods Verification
```bash
# Verify API methods exported
node -e "
try {
  const api = require('/tmp/toko-sdk/api');
  console.log('✅ API exports found:', Object.keys(api).length, 'methods');
  
  // Check critical endpoints
  const critical = ['orders', 'cart', 'wishlist', 'payment'];
  critical.forEach(endpoint => {
    const found = Object.keys(api).some(key => key.toLowerCase().includes(endpoint));
    console.log(found ? '✅' : '❌', endpoint, 'endpoint');
  });
} catch(e) {
  console.log('❌ API export error:', e.message);
}
"
```

### 5. Route Coverage Analysis
```bash
# Analyze route coverage dari manifest
python3 -c "
import json
d = json.load(open('/tmp/toko-manifest.json'))

routes_by_method = {}
routes_by_auth = {'auth': 0, 'public': 0}

for r in d['routes']:
    method = r['method']
    routes_by_method[method] = routes_by_method.get(method, 0) + 1
    
    if r.get('auth'):
        routes_by_auth['auth'] += 1
    else:
        routes_by_auth['public'] += 1

print('📊 Route Analysis:')
for method, count in routes_by_method.items():
    print(f'  {method}: {count} routes')
    
print(f'\\n🔐 Auth Distribution:')
print(f'  Protected: {routes_by_auth[\"auth\"]} routes')
print(f'  Public: {routes_by_auth[\"public\"]} routes')

# Check critical business endpoints
critical_endpoints = ['orders', 'cart', 'wishlist', 'payment', 'checkout']
found_endpoints = []
for endpoint in critical_endpoints:
    found = any(endpoint in r['name'].lower() for r in d['routes'])
    status = '✅' if found else '❌'
    print(f'{status} {endpoint.title()} endpoints')
    if found:
        found_endpoints.append(endpoint)

print(f'\\n📈 Coverage: {len(found_endpoints)}/{len(critical_endpoints)} critical endpoints')
"
```

## Success Criteria (Minimal)

### ✅ Manifest Generation Success
- [x] 30+ routes detected dari Laravel app
- [x] Model schema extracted (minimal 1)
- [x] Response types properly inferred

### ✅ SDK Generation Success  
- [x] All core files generated (api.ts, types.ts, mappers/, contract/)
- [x] No TypeScript compilation errors
- [x] API methods properly exported

### ✅ Business Logic Coverage
- [x] Orders management endpoints
- [x] Cart operations (add/remove items)
- [x] Wishlist functionality
- [x] Payment processing
- [x] Authentication endpoints

### ✅ Type Safety Verification
- [x] Core business types defined (Order, Payment, Produk, User)
- [x] Proper import/export structure
- [x] Response type mapping working

## What NOT to Test (Skip)

### ❌ Full Integration Testing
- React/Vue hooks testing
- Authentication flow testing
- Database operations
- Frontend UI integration
- Real HTTP requests

### ❌ Environment Setup
- Laravel app configuration
- Database seeding
- Authentication tokens
- CORS setup

### ❌ Performance Testing
- Load testing
- Memory usage profiling
- Large dataset processing
- Concurrent requests

## Quick Verification Script

```bash
#!/bin/bash
# quick-test-toko.sh

echo "🚀 RouteSync Toko-Online Quick Test"
echo "==================================="

# 1. Generate manifest
echo "1️⃣ Generating manifest..."
cd /home/annas-zen/Documents/RouteSync
node dist/cli.js scan /home/annas-zen/Documents/laragon-docker/www/toko-online --models --output /tmp/toko-test.json

# 2. Generate SDK
echo "2️⃣ Generating SDK..."
node dist/cli.js generate-v2 --manifest /tmp/toko-test.json --output /tmp/toko-sdk-test

# 3. Quick validation
echo "3️⃣ Validation..."
cd /tmp/toko-sdk-test
files=(api.ts types.ts)
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file generated ($(wc -l < $file) lines)"
  else
    echo "❌ $file missing"
  fi
done

# 4. TypeScript check
echo "4️⃣ TypeScript compilation..."
npx tsc --noEmit --skipLibCheck *.ts && echo "✅ Compilation OK" || echo "❌ Compilation failed"

echo "✅ Quick test completed!"
```

## Troubleshooting Common Issues

### Issue: Manifest Generation Fails
```bash
# Check Laravel app accessibility
php /home/annas-zen/Documents/laragon-docker/www/toko-online/artisan route:list

# Check PHP path
which php
php --version
```

### Issue: SDK Generation Errors
```bash
# Check manifest structure
cat /tmp/toko-manifest.json | jq '.routes | length'
cat /tmp/toko-manifest.json | jq '.routes[0]'
```

### Issue: TypeScript Compilation Fails
```bash
# Check generated file syntax
node -c /tmp/toko-sdk/api.ts
node -c /tmp/toko-sdk/types.ts
```

## Final Checklist

Sebelum menyatakan RouteSync engine working untuk toko-online:

- [ ] ✅ Manifest generated dengan 30+ routes
- [ ] ✅ Core files (api.ts, types.ts) generated  
- [ ] ✅ TypeScript compilation successful
- [ ] ✅ Critical business endpoints covered (orders, cart, payment)
- [ ] ✅ Core business types defined
- [ ] ✅ No critical errors dalam generation process

**Goal**: Verify RouteSync engine capability, bukan full application readiness.