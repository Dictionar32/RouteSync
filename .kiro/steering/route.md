# RouteSync: Panduan Sistem Tipe Route & Manifest

**Versi:** Route Types v2  
**Status:** Core Data Structure untuk AI Agent  
**Sumber:** `packages/core/src/types/route.ts` (85 baris)

Dokumen ini memberikan panduan lengkap untuk AI agent yang bekerja dengan tipe-tipe route dan manifest RouteSync. Ini adalah struktur data fundamental yang menghubungkan Laravel backend dengan frontend type generation.

---

## 🎯 ARSITEKTUR ROUTE SYSTEM OVERVIEW

RouteSync menggunakan **Manifest-Based Architecture** yang mengekstrak informasi dari Laravel dan mengkonversinya menjadi struktur data yang type-safe:

```
Laravel Application (Runtime)
    ↓
LaravelRouteParser (Reflection + Analysis)
    ↓
RouteManifest (Structured JSON)
    ├── ParsedRoute[] (API endpoints)
    ├── ParsedModel[] (Eloquent models)  
    ├── ParsedResource[] (API resources)
    └── ParsedChannel[] (Broadcasting channels)
    ↓
Code Generation Pipeline
    ↓
Type-Safe Frontend SDK
```

### Prinsip Desain Core

1. **Laravel-First**: Semua tipe deriva dari struktur Laravel yang sebenarnya
2. **Progressive Enrichment**: Raw data → Parsed → Resolved → Generated
3. **Semantic Metadata**: Setiap struktur data punya metadata resolusi semantik
4. **Backward Compatibility**: Support legacy naming conventions
5. **Runtime Traceability**: Setiap struktur dapat dilacak ke source code asli

---

## 🏗️ KOMPONEN ARSITEKTUR UTAMA

### 1. RouteManifest — Container Utama

**Tujuan:** Root container untuk semua metadata yang diekstrak dari Laravel application

```typescript
interface RouteManifest {
  version: string;           // Manifest format version
  baseURL: string;          // API base URL (e.g., "https://api.example.com")
  routes: ParsedRoute[];    // Semua API endpoints
  channels?: ParsedChannel[];  // Broadcasting channels (optional)
  models?: ParsedModel[];   // Eloquent models (optional)
  resources?: ParsedResource[]; // API resources (optional)
  generatedAt: string;      // ISO timestamp generation
  
  // Frontend-specific configuration
  frontend?: {
    router?: string;        // Frontend router type ("react-router", "next")
    groupAliases?: Record<string, string>; // Route group mappings
    domains?: Record<string, string | DomainIntentConfig>; // Domain configs
  };
  
  pages?: Record<string, any>; // Page metadata (for SSR/SSG)
}
```

**📋 Contoh RouteManifest:**
```typescript
const manifest: RouteManifest = {
  version: "2.1.0",
  baseURL: "https://api.myapp.com/v1",
  generatedAt: "2026-07-26T10:30:00Z",
  
  routes: [
    { name: "users.index", method: "GET", path: "/users", /* ... */ },
    { name: "users.show", method: "GET", path: "/users/{id}", /* ... */ }
  ],
  
  models: [
    { name: "User", table: "users", columns: [/* ... */] }
  ],
  
  resources: [
    { name: "UserResource", fields: { id: { kind: "primitive", type: "number" } } }
  ],
  
  frontend: {
    router: "react-router",
    domains: {
      "user": { type: "crud", operations: { list: "index", show: "show" } }
    }
  }
};
```

### 2. ParsedRoute — Representasi API Endpoint

**Tujuan:** Merepresentasikan satu endpoint API dengan semua metadata yang diperlukan

```typescript
interface ParsedRoute {
  name: string;           // Laravel route name (e.g., "users.show")
  method: string;         // HTTP method ("GET", "POST", "PUT", "DELETE", "PATCH")
  path: string;          // URL path dengan parameters (e.g., "/users/{id}")
  auth: boolean;         // Apakah memerlukan authentication
  middleware: string[];   // Applied middleware
  
  // Optional metadata
  schema?: Record<string, any>;    // Request validation schema
  group?: string;                  // Route group (e.g., "api.v1")
  action?: string;                 // Controller action (e.g., "show")
  response?: ResponseMetadata;     // Expected response structure
  assignments?: Record<string, string>; // Variable assignments
  stableHash?: string;             // Content hash untuk caching
  
  // Source code traceability
  sourceFile?: string | null;      // Controller file path
  sourceLine?: number | null;      // Line number di controller
  
  // Legacy compatibility (masih digunakan di fixtures)
  uri?: string;                    // Legacy alias untuk path
  actionName?: string;             // Legacy alias untuk action
  controllerName?: string;         // Legacy alias untuk controller
}
```

**📋 Route HTTP Method Classification:**
```typescript
// Standard REST patterns
const routePatterns = {
  "GET /users": { action: "index", intent: "list" },
  "GET /users/{id}": { action: "show", intent: "retrieve" },
  "POST /users": { action: "store", intent: "create" },
  "PUT /users/{id}": { action: "update", intent: "replace" },
  "PATCH /users/{id}": { action: "update", intent: "modify" },
  "DELETE /users/{id}": { action: "destroy", intent: "delete" }
};
```

### 3. ResponseMetadata — Response Structure Analysis

**Tujuan:** Menganalisis struktur response yang akan dikembalikan endpoint

```typescript
type ResponseMetadata = (
  | { kind: 'model'; model: string; collection: boolean; paginated?: boolean }
  | { kind: 'resource'; resource: string; collection: boolean; paginated?: boolean }
  | { kind: 'object'; fields: Record<string, ResponseMetadata | { kind: 'primitive'; type: string }>; collection?: boolean; paginated?: boolean }
  | { kind: 'unknown' }
) & {
  // Semantic resolution metadata
  resolved?: SemanticResolution & { 
    kind?: string; 
    type?: string; 
    fields?: Record<string, any>; 
    wrapped?: boolean 
  };
  semantic?: SemanticResolution & { 
    kind?: string; 
    type?: string; 
    fields?: Record<string, any>; 
    wrapped?: boolean 
  };
  
  // Runtime enrichment (by SemanticKernelV2)
  collection?: boolean;    // Array of items
  paginated?: boolean;     // Laravel pagination wrapper
  type?: string;          // Resolved type
  wrapped?: boolean;      // Laravel $wrap behavior ({ data: ... })
};
```

**📋 Response Metadata Examples:**
```typescript
// Single model response: User
const singleModel: ResponseMetadata = {
  kind: "model",
  model: "User",
  collection: false,
  paginated: false
};

// Collection response: User[]
const modelCollection: ResponseMetadata = {
  kind: "model", 
  model: "User",
  collection: true,
  paginated: false
};

// Paginated response: { data: User[], links: {...}, meta: {...} }
const paginatedCollection: ResponseMetadata = {
  kind: "model",
  model: "User", 
  collection: true,
  paginated: true,
  wrapped: true
};

// API Resource response
const resourceResponse: ResponseMetadata = {
  kind: "resource",
  resource: "UserResource",
  collection: false,
  resolved: {
    status: "resolved",
    confidence: 95,
    trace: [{ rule: "ResourceAnalyzer", evidence: "UserResource::toArray()" }]
  }
};

// Custom object response
const objectResponse: ResponseMetadata = {
  kind: "object",
  fields: {
    status: { kind: "primitive", type: "string" },
    message: { kind: "primitive", type: "string" },
    data: {
      kind: "model",
      model: "User",
      collection: false
    }
  }
};
```

### 4. ParsedModel — Eloquent Model Representation

**Tujuan:** Merepresentasikan Eloquent model dengan semua metadata field dan relasi

```typescript
interface ParsedModel {
  name: string;        // Model class name (e.g., "User")
  table: string;       // Database table name (e.g., "users")
  columns: ParsedColumn[]; // Database columns
  
  // Eloquent-specific metadata
  hidden?: string[];   // $hidden fields
  appends?: string[];  // $appends accessors
  casts?: Record<string, string>; // $casts type conversions
  accessors?: Record<string, any>; // Accessor methods
  relations?: Record<string, { type: string; model: string }>; // Model relations
}

interface ParsedColumn {
  name: string;        // Column name (e.g., "email")
  type: string;        // SQL type (e.g., "varchar", "int", "timestamp")
  nullable: boolean;   // Can be null
}
```

**📋 Model dengan Relations:**
```typescript
const userModel: ParsedModel = {
  name: "User",
  table: "users", 
  columns: [
    { name: "id", type: "bigint", nullable: false },
    { name: "email", type: "varchar", nullable: false },
    { name: "created_at", type: "timestamp", nullable: true }
  ],
  hidden: ["password", "remember_token"],
  appends: ["full_name"],
  casts: {
    "created_at": "datetime",
    "settings": "array"
  },
  accessors: {
    "full_name": "getFullNameAttribute"
  },
  relations: {
    "posts": { type: "hasMany", model: "Post" },
    "profile": { type: "hasOne", model: "Profile" }
  }
};
```

### 5. ParsedResource — API Resource Representation

**Tujuan:** Merepresentasikan Laravel API Resource dengan field mapping

```typescript
interface ParsedResource {
  name: string;        // Resource class name (e.g., "UserResource")
  fields: Record<string, ResourceFieldKind>; // Field definitions
  assignments?: Record<string, string>; // Variable assignments dari toArray()
  sourceFile?: string | null;   // Source file path
  sourceLine?: number | null;   // Line number
}

type ResourceFieldKind = (
  | { kind: 'primitive'; type: string }
  | { kind: 'model'; model: string; collection: boolean }
  | { kind: 'resource'; resource: string; collection: boolean }
  | { kind: 'object'; fields: Record<string, ResourceFieldKind> }
  | { kind: 'unknown' }
) & {
  resolved?: SemanticResolution;
  semantic?: SemanticResolution;
};
```

**📋 Resource dengan Nested Fields:**
```typescript
const userResource: ParsedResource = {
  name: "UserResource",
  fields: {
    id: { kind: "primitive", type: "number" },
    email: { kind: "primitive", type: "string" },
    profile: { 
      kind: "resource", 
      resource: "ProfileResource", 
      collection: false 
    },
    posts: { 
      kind: "resource", 
      resource: "PostResource", 
      collection: true 
    },
    metadata: {
      kind: "object",
      fields: {
        last_login: { kind: "primitive", type: "datetime" },
        preferences: { kind: "primitive", type: "array" }
      }
    }
  },
  assignments: {
    "$user": "$this->resource"
  },
  sourceFile: "/app/Http/Resources/UserResource.php",
  sourceLine: 15
};
```

### 6. DomainIntentConfig — Frontend Configuration

**Tujuan:** Mengkonfigurasi intent domain untuk frontend generation

```typescript
interface DomainIntentConfig {
  type: string;        // Domain type (e.g., "crud", "auth", "search")
  operations: Record<string, string>; // Operation mappings
  config: Record<string, string>;     // Additional configuration
}
```

**📋 Domain Intent Examples:**
```typescript
// CRUD domain configuration
const crudDomain: DomainIntentConfig = {
  type: "crud",
  operations: {
    list: "index",      // GET /users → list operation
    show: "show",       // GET /users/{id} → show operation  
    create: "store",    // POST /users → create operation
    update: "update",   // PUT /users/{id} → update operation
    delete: "destroy"   // DELETE /users/{id} → delete operation
  },
  config: {
    "pagination": "true",
    "sort": "created_at",
    "filters": "name,email"
  }
};

// Authentication domain
const authDomain: DomainIntentConfig = {
  type: "auth",
  operations: {
    login: "authenticate",
    logout: "logout", 
    register: "register",
    refresh: "refresh"
  },
  config: {
    "tokenStorage": "localStorage",
    "redirectAfterLogin": "/dashboard"
  }
};
```

---

## 🚨 POLA PENGGUNAAN KRITIS

### ✅ Implementasi yang Benar

**1. Progressive Metadata Enrichment:**
```typescript
// BENAR: Enrichment step-by-step tanpa mutasi
function enrichResponseMetadata(
  base: ResponseMetadata, 
  semantic: SemanticResolution
): ResponseMetadata {
  return {
    ...base,                    // Preserve base structure
    resolved: semantic,         // Add semantic resolution
    confidence: semantic.confidence,
    type: semantic.type         // Runtime enrichment
  };
}
```

**2. Route Classification dengan Pattern Matching:**
```typescript
// BENAR: Pattern-based classification
function classifyRoute(route: ParsedRoute): string {
  const pattern = `${route.method} ${route.path}`;
  
  if (pattern.match(/^GET \/\w+$/)) return "index";           // GET /users
  if (pattern.match(/^GET \/\w+\/\{.+\}$/)) return "show";   // GET /users/{id}
  if (pattern.match(/^POST \/\w+$/)) return "store";         // POST /users
  if (pattern.match(/^PUT \/\w+\/\{.+\}$/)) return "update"; // PUT /users/{id}
  if (pattern.match(/^DELETE \/\w+\/\{.+\}$/)) return "destroy"; // DELETE /users/{id}
  
  return "custom";
}
```

**3. Type-Safe Field Resolution:**
```typescript
// BENAR: Type-safe field traversal
function resolveResourceField(
  resource: ParsedResource,
  fieldPath: string[]
): ResourceFieldKind | null {
  let current: ResourceFieldKind | undefined = resource.fields[fieldPath[0]];
  
  for (let i = 1; i < fieldPath.length; i++) {
    if (!current || current.kind !== "object") return null;
    current = current.fields[fieldPath[i]];
  }
  
  return current || null;
}
```

**4. Manifest Validation:**
```typescript
// BENAR: Comprehensive validation
function validateRouteManifest(manifest: RouteManifest): string[] {
  const errors: string[] = [];
  
  // Version validation
  if (!manifest.version || !manifest.version.match(/^\d+\.\d+\.\d+$/)) {
    errors.push("Invalid version format");
  }
  
  // Route validation
  manifest.routes.forEach((route, index) => {
    if (!route.name) errors.push(`Route ${index}: missing name`);
    if (!route.method) errors.push(`Route ${index}: missing method`);
    if (!route.path) errors.push(`Route ${index}: missing path`);
    
    // Method validation
    const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
    if (!validMethods.includes(route.method)) {
      errors.push(`Route ${route.name}: invalid method ${route.method}`);
    }
  });
  
  return errors;
}
```

### ❌ Anti-Pattern yang Harus Dihindari

**1. Mutasi Direct pada Manifest:**
```typescript
// SALAH: Mutating existing manifest
function addRouteToManifest(manifest: RouteManifest, route: ParsedRoute) {
  manifest.routes.push(route); // JANGAN! Manifest harus immutable
}

// BENAR: Create new manifest
function addRouteToManifest(manifest: RouteManifest, route: ParsedRoute): RouteManifest {
  return {
    ...manifest,
    routes: [...manifest.routes, route]
  };
}
```

**2. String-Based Type Checking:**
```typescript
// SALAH: String comparison untuk type checking
function isModelResponse(response: ResponseMetadata): boolean {
  return response.kind === "model"; // Fragile, tidak type-safe
}

// BENAR: Type-safe checking dengan discriminated union
function isModelResponse(response: ResponseMetadata): response is ResponseMetadata & { kind: 'model' } {
  return response.kind === "model";
}
```

**3. Ignoring Semantic Resolution:**
```typescript
// SALAH: Ignore semantic metadata
function getResponseType(response: ResponseMetadata): string {
  return response.kind; // Mengabaikan resolved type!
}

// BENAR: Prioritize resolved semantic information
function getResponseType(response: ResponseMetadata): string {
  return response.resolved?.type || response.semantic?.type || response.kind;
}
```

---

## 🔍 DEBUGGING & TRACEABILITY

### Source Code Traceability

**Source Reference Fields:**
```typescript
interface TraceableRoute extends ParsedRoute {
  sourceFile?: string | null;    // Controller file (/app/Http/Controllers/UserController.php)
  sourceLine?: number | null;    // Line number di controller (42)
  stableHash?: string;           // Content-based hash untuk change detection
}
```

**📋 Debug Route Resolution:**
```typescript
// Trace route kembali ke source code
function debugRouteResolution(route: ParsedRoute) {
  console.group(`Route Debug: ${route.name}`);
  
  if (route.sourceFile && route.sourceLine) {
    console.log(`Source: ${route.sourceFile}:${route.sourceLine}`);
  }
  
  console.log(`Method: ${route.method} ${route.path}`);
  console.log(`Auth Required: ${route.auth}`);
  console.log(`Middleware: [${route.middleware.join(', ')}]`);
  
  if (route.response) {
    console.log(`Response Kind: ${route.response.kind}`);
    if (route.response.resolved) {
      console.log(`Resolved Type: ${route.response.resolved.type}`);
      console.log(`Confidence: ${route.response.resolved.confidence}%`);
    }
  }
  
  console.groupEnd();
}
```

### Manifest Diff Analysis

```typescript
// Compare dua manifest untuk change detection
function diffManifests(oldManifest: RouteManifest, newManifest: RouteManifest) {
  const changes = {
    added: [] as ParsedRoute[],
    removed: [] as ParsedRoute[],
    modified: [] as { old: ParsedRoute; new: ParsedRoute }[]
  };
  
  const oldRoutes = new Map(oldManifest.routes.map(r => [r.name, r]));
  const newRoutes = new Map(newManifest.routes.map(r => [r.name, r]));
  
  // Find added routes
  for (const [name, route] of newRoutes) {
    if (!oldRoutes.has(name)) {
      changes.added.push(route);
    }
  }
  
  // Find removed routes  
  for (const [name, route] of oldRoutes) {
    if (!newRoutes.has(name)) {
      changes.removed.push(route);
    }
  }
  
  // Find modified routes
  for (const [name, newRoute] of newRoutes) {
    const oldRoute = oldRoutes.get(name);
    if (oldRoute && oldRoute.stableHash !== newRoute.stableHash) {
      changes.modified.push({ old: oldRoute, new: newRoute });
    }
  }
  
  return changes;
}
```

---

## 🎯 INTEGRASI DENGAN PIPELINE ROUTESYNC

### Manifest Processing Pipeline

```typescript
// 1. Laravel Scanner → RouteManifest
class LaravelRouteParser {
  generateManifest(laravelApp: any): RouteManifest {
    return {
      version: "2.1.0",
      baseURL: this.extractBaseURL(laravelApp),
      routes: this.extractRoutes(laravelApp),
      models: this.extractModels(laravelApp),
      resources: this.extractResources(laravelApp),
      generatedAt: new Date().toISOString()
    };
  }
}

// 2. RouteManifest → Normalized IR  
class ManifestNormalizer {
  normalize(manifest: RouteManifest): NormalizedManifest {
    return {
      routes: manifest.routes.map(route => this.normalizeRoute(route)),
      models: manifest.models?.map(model => this.normalizeModel(model)) || [],
      resources: manifest.resources?.map(res => this.normalizeResource(res)) || []
    };
  }
}

// 3. Normalized IR → Generated Code
class CodeGenerator {
  generateFromManifest(manifest: RouteManifest): GeneratedOutput {
    const normalized = this.normalizer.normalize(manifest);
    
    return {
      types: this.typeGenerator.generate(normalized),
      sdk: this.sdkGenerator.generate(normalized),
      hooks: this.hookGenerator.generate(normalized)
    };
  }
}
```

### Generator Integration Points

**Route-Based Generation:**
```typescript
// Generate API client methods dari routes
class APIClientGenerator {
  generateFromRoutes(routes: ParsedRoute[]): string {
    return routes.map(route => {
      const methodName = this.deriveMethodName(route);
      const params = this.extractParameters(route.path);
      const responseType = this.resolveResponseType(route.response);
      
      return `
        async ${methodName}(${params}): Promise<${responseType}> {
          return this.request('${route.method}', '${route.path}', data);
        }
      `;
    }).join('\n');
  }
  
  private deriveMethodName(route: ParsedRoute): string {
    // users.show → getUserById
    // users.index → getUsers  
    // users.store → createUser
    const [resource, action] = route.name.split('.');
    const actionMap = {
      index: `get${this.pluralize(resource)}`,
      show: `get${this.singularize(resource)}ById`,
      store: `create${this.singularize(resource)}`,
      update: `update${this.singularize(resource)}`,
      destroy: `delete${this.singularize(resource)}`
    };
    return actionMap[action] || `${action}${this.singularize(resource)}`;
  }
}
```

**Type Generation dari Models:**
```typescript
// Generate TypeScript interfaces dari ParsedModel
class TypeScriptGenerator {
  generateModelTypes(models: ParsedModel[]): string {
    return models.map(model => {
      const fields = model.columns.map(col => {
        const tsType = this.sqlTypeToTsType(col.type);
        const optional = col.nullable ? '?' : '';
        return `  ${col.name}${optional}: ${tsType};`;
      }).join('\n');
      
      return `
        export interface ${model.name} {
        ${fields}
        }
      `;
    }).join('\n');
  }
  
  private sqlTypeToTsType(sqlType: string): string {
    const typeMap = {
      'varchar': 'string',
      'text': 'string', 
      'int': 'number',
      'bigint': 'number',
      'decimal': 'number',
      'boolean': 'boolean',
      'timestamp': 'Date',
      'json': 'Record<string, unknown>'
    };
    return typeMap[sqlType] || 'unknown';
  }
}
```

---

## 📋 EXTENSION GUIDELINES

### Menambah Route Metadata Baru

**1. Extend ParsedRoute Interface:**
```typescript
interface ParsedRoute {
  // ... existing fields
  customMetadata?: {
    rateLimit?: number;
    cacheTime?: number;
    permissions?: string[];
  };
}
```

**2. Update Route Parser:**
```typescript
class LaravelRouteParser {
  extractRoutes(laravelApp: any): ParsedRoute[] {
    return laravelApp.routes.map(route => ({
      name: route.name,
      method: route.method,
      path: route.path,
      // ... existing extraction
      customMetadata: this.extractCustomMetadata(route) // New extraction
    }));
  }
}
```

**3. Update Generators:**
```typescript
// Update semua generator untuk handle new metadata
class SDKGenerator {
  generate(route: ParsedRoute): string {
    if (route.customMetadata?.rateLimit) {
      // Handle rate limiting in generated client
    }
  }
}
```

### Menambah Response Metadata Type

**1. Extend ResponseMetadata Union:**
```typescript
type ResponseMetadata = 
  | { kind: 'model'; model: string; collection: boolean; paginated?: boolean }
  | { kind: 'resource'; resource: string; collection: boolean; paginated?: boolean }
  | { kind: 'object'; fields: Record<string, ResponseMetadata | { kind: 'primitive'; type: string }>; collection?: boolean; paginated?: boolean }
  | { kind: 'stream'; contentType: string; streaming: boolean } // New type
  | { kind: 'unknown' }
```

**2. Update Response Analyzers:**
```typescript
class ResponseAnalyzer {
  analyzeResponse(controllerMethod: any): ResponseMetadata {
    if (this.isStreamResponse(controllerMethod)) {
      return {
        kind: 'stream',
        contentType: this.getStreamContentType(controllerMethod),
        streaming: true
      };
    }
    // ... existing analysis
  }
}
```

---

## 🚀 PERFORMANCE & VALIDATION

### Manifest Size Optimization

```typescript
// Optimize manifest size untuk large applications
class ManifestOptimizer {
  optimize(manifest: RouteManifest): RouteManifest {
    return {
      ...manifest,
      routes: this.deduplicateRoutes(manifest.routes),
      models: this.compressModels(manifest.models),
      resources: this.compressResources(manifest.resources)
    };
  }
  
  private deduplicateRoutes(routes: ParsedRoute[]): ParsedRoute[] {
    const seen = new Set<string>();
    return routes.filter(route => {
      const key = `${route.method}:${route.path}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
```

### Schema Validation

```typescript
// Runtime validation untuk manifest integrity
import Joi from 'joi';

const RouteSchema = Joi.object({
  name: Joi.string().required(),
  method: Joi.string().valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE').required(),
  path: Joi.string().required(),
  auth: Joi.boolean().required(),
  middleware: Joi.array().items(Joi.string()),
  response: Joi.object().optional()
});

const ManifestSchema = Joi.object({
  version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).required(),
  baseURL: Joi.string().uri().required(),
  routes: Joi.array().items(RouteSchema).required(),
  generatedAt: Joi.string().isoDate().required()
});

function validateManifest(manifest: RouteManifest): boolean {
  const { error } = ManifestSchema.validate(manifest);
  if (error) {
    console.error('Manifest validation error:', error.message);
    return false;
  }
  return true;
}
```

---

## 🎯 METRICS & SUCCESS INDICATORS

### Route Quality Metrics

| Metric | Baik | Warning | Kritis |
|--------|------|---------|--------|
| Route Coverage | >95% | 85-95% | <85% |
| Response Type Resolution | >90% | 75-90% | <75% |
| Source Traceability | >90% | 70-90% | <70% |
| Semantic Confidence Avg | >85% | 70-85% | <70% |
| Manifest Size | <2MB | 2-5MB | >5MB |
| Generation Time | <10s | 10-30s | >30s |

### Data Quality Indicators

- **Route Completeness**: Semua Laravel routes ter-ekstrak dengan benar
- **Type Accuracy**: Response metadata match dengan actual Laravel output  
- **Metadata Richness**: Source file/line information tersedia
- **Semantic Resolution**: Minimal 85% routes punya semantic resolution
- **Backward Compatibility**: Legacy naming conventions tetap support

---

## 🔗 KOMPONEN TERKAIT

### Dependencies (Upstream)
- `packages/cli/src/parsers/LaravelRouteParser.ts` - Manifest generation dari Laravel
- `packages/cli/src/resolvers/` - Semantic resolution untuk response metadata

### Consumers (Downstream)
- `packages/cli/src/generators/` - Code generation dari RouteManifest
- `packages/cli/src/generators/layers/` - Layer-based code generation
- `packages/react/` - React-specific SDK generation
- `packages/vue/` - Vue-specific SDK generation

### Configuration Files  
- `routesync.manifest.json` - Generated manifest file
- `packages/core/tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Test configuration

---

**Sistem tipe route ini adalah jantung dari RouteSync's Laravel-to-Frontend bridge. Memahami struktur manifest dan route metadata ini essential untuk menjaga type safety dan code generation accuracy.**

**Last Updated:** Juli 26, 2026  
**Route Types Version:** v2  
**Status:** Production dengan active development