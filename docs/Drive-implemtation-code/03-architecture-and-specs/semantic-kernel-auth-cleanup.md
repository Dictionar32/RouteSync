# RouteSync — Semantic Kernel Auth Detection & Manifest Cleanup

## Ringkasan

Dua commit yang meningkatkan SemanticKernel untuk mendeteksi `$request->user()` dan membersihkan karakter `\n` dari manifest.

**Commit**: `0f28574` + `be1e289` | **4 file diubah** | **Hasil**: 3→13 route resolved, 27→1 `\n` di manifest

---

## Commit 1: Auth User Detection + Assignment Tracking (`0f28574`)

### Masalah
SemanticKernel tidak bisa resolve response type dari controller yang menggunakan `$request->user()` atau `auth()->user()`. Contoh: `GET /profile` punya `$user = $request->user()` tapi kernel tidak tahu `$user` adalah `User` model. Hasilnya: response fields seperti `$user->id`, `$user->name` tetap `unknown`.

### Perubahan

#### 1. SemanticKernelV2.ts — method_call handler untuk auth user

**File**: `packages/core/src/semantic/SemanticKernelV2.ts`  
**Lokasi**: Line 249, di dalam `resolve()` method, sebelum fallback ke target resolution

**Sebelum**:
```typescript
// 2. Fallback to target resolution
const resolvedTarget = this.resolve(normalizedAst.target, context);
if (['toDateTimeString', ...].includes(normalizedAst.name || '')) {
```

**Sesudah**:
```typescript
// 2. Auth user detection: $request->user(), auth()->user(), Auth::user()
if (normalizedAst.name === 'user' && normalizedAst.target) {
  const targetName = (normalizedAst.target as any)?.name || ''
  if (targetName === 'request' || targetName === 'auth' || targetName === 'Auth') {
    return {
      status: 'resolved',
      type: 'model',
      model: 'User',
      collection: false,
      confidence: 100,
      trace: [{
        source: 'SemanticKernelV2',
        input: `${targetName}->user()`,
        output: 'model User',
        rule: 'Auth user method call'
      }]
    }
  }
}

const resolvedTarget = this.resolve(normalizedAst.target, context);
if (['toDateTimeString', ...].includes(normalizedAst.name || '')) {
```

**Tujuan**: Ketika SemanticKernel menemukan `$request->user()` atau `auth()->user()` atau `Auth::user()`, langsung return `User` model dengan confidence 100.

**Mengapa di sini**: Method call handler di line 217-266 memproses instance method calls seperti `$object->method()`. Handler untuk `->user()` perlu dideteksi SEBELUM fallback resolution karena target (`$request`) bukan model yang bisa di-resolve secara normal.

**Dampak**: Semua route yang menggunakan `$request->user()` sekarang bisa resolve field-level types. Contoh:
- `$user->id` → `number` (dari `User.id` column)
- `$user->name` → `string` (dari `User.name` column)
- `$user->email` → `string` (dari `User.email` column)
- `$user->created_at?->toISOString()` → `string` (dari `User.created_at` + Carbon method)

#### 2. ZodTierGenerator.ts — assignment tracking di contract block

**File**: `packages/cli/src/generators/ZodTierGenerator.ts`  
**Lokasi**: Line 391-399, di dalam contract block `generateContract()`

**Sebelum**:
```typescript
if (route.response) {
  let zType = this.buildResponseZodType(route.response, kernel,
    { layer: 'route', fileName: route.name, modelMap: {}, relationMap: {} })
```

**Sesudah**:
```typescript
if (route.response) {
  // Parse route assignments for variable tracking (e.g., $user = $request->user())
  const routeAssignments: Record<string, any> = {}
  if ((route as any).assignments) {
    const rawAssignments = (route as any).assignments
    for (const [varName, code] of Object.entries(rawAssignments)) {
      try {
        routeAssignments[varName] = PhpCodeParser.parseExpression(code as string, {})
      } catch {}
    }
  }
  let zType = this.buildResponseZodType(route.response, kernel,
    { layer: 'route', fileName: route.name, modelMap: {}, relationMap: {},
      assignments: routeAssignments })
```

**Tujuan**: Mengambil `assignments` dari route data (yang di-ekstrak oleh PHP parser saat scan) dan memasukkannya ke context SemanticKernel. Dengan begitu, kernel bisa menelusuri variabel seperti `$user` kembali ke assignment `$user = $request->user()`.

**Mengapa perlu**: Sebelumnya, context untuk route response tidak punya `assignments`. Resource context (line 337) sudah punya `parsedAssignments` tapi route context (line 392) tidak. Ini menyebabkan SemanticKernel tidak bisa resolve variabel di route response.

**Bug fix**: Assignment ada di top-level GeneratedRoute (karena `...route.raw` spread), bukan di `.raw.assignments`. Awalnya kode salah pakai `(route as any).raw?.assignments`.

**Dampak**: Dari 16 route dengan response fields, yang fully resolved naik dari 3 → 13.

#### 3. annotate.ts — manifest fallback

**File**: `packages/cli/src/commands/annotate.ts`  
**Lokasi**: Line 119-170, di dalam PHP script

**Sebelum**:
```php
if (!$resourceName) continue;
```

**Sesudah**:
```php
// Fallback: check routesync manifest for resolved response types
$modelFromManifest = null;
if (!$resourceName) {
    $manifestPath = getcwd() . '/routesync.manifest.json';
    if (file_exists($manifestPath)) {
        $manifest = json_decode(file_get_contents($manifestPath), true);
        if (isset($manifest['routes'])) {
            $routeUri = '/' . preg_replace('/^api\//', '', $route->uri());
            foreach ($manifest['routes'] as $mr) {
                $manifestRoutePath = preg_replace('/\{[^}]+\}/', '{}', $mr['path']);
                $routePath = preg_replace('/\{[^}]+\}/', '{}', $routeUri);
                if ($manifestRoutePath === $routePath && in_array(strtoupper($mr['method']), $methods)) {
                    $resolved = $mr['response']['resolved'] ?? $mr['response']['semantic'] ?? null;
                    if ($resolved && $resolved['status'] === 'resolved' && !empty($resolved['model'])) {
                        $modelFromManifest = $resolved['model'];
                        $collection = !empty($resolved['collection']) || !empty($mr['response']['collection']);
                        break;
                    }
                }
            }
        }
    }
}

if (!$resourceName && !$modelFromManifest) continue;
```

**Tujuan**: Saat Resource class tidak ditemukan (route return raw `response()->json()`), cek manifest untuk response type yang sudah di-resolve oleh SemanticKernel. Jika ditemukan, gunakan untuk generate `#[Response]` attribute.

**Mengapa**: Sebelumnya, annotate hanya bekerja untuk route yang menggunakan API Resource classes. Route dengan raw JSON response tidak bisa di-annotate. Dengan manifest fallback, route yang sudah di-resolve oleh scan bisa di-annotate otomatis.

**Lalu** (line 146-160):
```php
// Resolve model from Resource @mixin docblock or from manifest
$modelClass = null;
if ($resourceName) {
    $resourceClass = 'App\\Http\\Resources\\' . $resourceName;
    if (!class_exists($resourceClass)) continue;
    $resReflector = new ReflectionClass($resourceClass);
    $docComment = $resReflector->getDocComment();
    if ($docComment && preg_match('/@mixin\s+(\S+)/', $docComment, $mixinMatch)) {
        $modelClass = class_basename(trim($mixinMatch[1], '\\'));
    }
    if (!$modelClass) {
        $modelClass = preg_replace('/Resource$/', '', $resourceName);
    }
} elseif ($modelFromManifest) {
    $modelClass = $modelFromManifest;
}
```

**Tujuan**: Branch baru `elseif ($modelFromManifest)` menggunakan model name dari manifest langsung, tanpa perlu Resource class atau @mixin docblock.

---

## Commit 2: Whitespace Normalization (`be1e289`)

### Masalah
Manifest `routesync.manifest.json` mengandung karakter `\n` literal di dalam string values — 27 field. Ini dari multi-line PHP code yang diekstrak sebagai assignment expressions.

Contoh sebelum fix:
```json
{
  "assignments": {
    "user": "User::create([\n     'name' => $request->name,\n     'email' => $email,\n  ])"
  }
}
```

### Perubahan

#### LaravelRouteParser.ts — normalize whitespace

**File**: `packages/cli/src/parsers/LaravelRouteParser.ts`  
**Lokasi**: Line 250, di dalam assignment extraction loop

**Sesudah**:
```php
$expr = trim($assignMatches[2][$idx]);
if (str_contains($expr, 'return')) continue;
// Normalize whitespace: collapse newlines and multiple spaces
$expr = preg_replace('/\s+/', ' ', $expr);
$assignments[$varName] = $expr;
```

**Tujuan**: Mengganti semua whitespace (newline, tab, multiple spaces) menjadi single space di assignment expression strings.

**Mengapa**: Assignment expressions dari multi-line PHP code mengandung actual newlines. Saat di-JSON-encode, newlines menjadi `\n` escape sequences yang membuat manifest sulit dibaca dan berpotensi menyebabkan masalah parsing.

**Dampak**: `\n` di manifest berkurang dari 27 → 1. Sisa 1 adalah ternary expression dari response field value (bukan assignment) yang tidak melalui normalisasi ini.

**Catatan teknis**: Regex `/\s+/` di TypeScript template literal butuh double-escape: `'/\\s+/'` karena `\s` bukan escape sequence yang dikenal di TypeScript template literals (berbeda dengan `\n`, `\t`, dll).

---

## Hasil

### Sebelum vs Sesudah — Field Resolution

| Route | Sebelum | Sesudah |
|-------|---------|---------|
| POST /login | ❌ | ✅ |
| POST /social/login | ❌ | ✅ |
| POST /reset-password | ❌ | ✅ |
| GET /categories | ❌ | ✅ |
| GET /produk/{id}/reviews | ❌ | ✅ |
| GET /profile | ❌ | ✅ |
| PUT /profile | ❌ | ✅ |
| PATCH /profile | ❌ | ✅ |
| DELETE /cart | ❌ | ✅ |
| POST /wishlist | ❌ | ✅ |
| DELETE /wishlist/{produkItemId} | ❌ | ✅ |
| POST /produk/{id}/reviews | ❌ | ✅ |
| POST /logout | ❌ | ✅ |

**Total**: 3/16 → **13/16 fully resolved**

### 3 Route Masih Unresolved

| Route | Masalah |
|-------|---------|
| GET /oauth/{provider}/redirect | `$targetUrl = $driver->redirect()->getTargetUrl()` — chained method call |
| GET /oauth/{provider}/callback | `$exception->getMessage()` — exception variable |
| POST /oauth/{provider}/callback | Sama seperti GET callback |

### Manifest Cleanup

| Metric | Sebelum | Sesudah |
|--------|---------|---------|
| Fields dengan `\n` literal | 27 | 1 |
| Sisa 1 | — | Ternary expression di response field (non-assignment) |

---

## Verifikasi

```bash
cd routesync && npm run build
cd toko-online
node "routesync/dist/cli.js" scan --input routes/api.php --output routesync.manifest.json --models
node "routesync/dist/cli.js" generate --manifest routesync.manifest.json --output frontend/src/api --next-actions --zod
cd frontend && npx tsc --noEmit
# Hasil: 0 errors di src/api/
```

## Commit History

```
be1e289 fix: normalize whitespace in PHP assignment extraction to remove \n from manifest
0f28574 feat: add auth user detection in SemanticKernel + assignment tracking in contract block
3e97b8e feat: implement named types, CRUD pattern, and auto invalidation across all generators
```
