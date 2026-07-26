# RouteSync Compiler: 5-Minute Quick Start

## What is RouteSync?

RouteSync is a **compiler** that transforms Laravel routes into type-safe TypeScript SDKs.

```
Laravel Code  →  Compiler  →  TypeScript SDK
(PHP)            (Node.js)     (React/Vue hooks + types)
```

Not a code generator. A **contract compiler** — like TypeScript is a compiler for JavaScript.

---

## Three Compilation Stages

```
┌─────────────┐     ┌──────────┐     ┌──────────┐
│  annotate   │ →   │   scan   │ →   │ generate │
│ (optional)  │     │ (IR gen) │     │ (codegen)│
└─────────────┘     └──────────┘     └──────────┘
  Add PHP attrs   Extract types       Emit TS files
  to Laravel      Resolve meanings    With validation
```

### Stage 1: Annotate (Optional, One-Time)
```bash
routesync annotate
```
- Mutates your Laravel source code
- Adds `#[Response(Model::class)]` attributes to controllers
- Optional — `scan` can infer without it
- Only done once per codebase

### Stage 2: Scan (Front-end + Middle-end)
```bash
routesync scan
```
**Input:** Running Laravel app (needs `php artisan serve`)
**Process:**
1. Reflect over routes, models, resources (via PHP reflection)
2. Parse route handlers, resource fields (via regex + tokenizer)
3. Read database schema (via Laravel Schema API)
4. Resolve all types (model? resource? primitive? nullable?)
5. Serialize to **Intermediate Representation (IR)**

**Output:** 
- `routesync.manifest.json` — IR (types fully resolved)
- `routesync.graph.json` — IR with extra debugging info (elaborated)

### Stage 3: Generate (Back-end)
```bash
routesync generate
```
**Input:** `routesync.manifest.json` (the IR)
**Process:** 13 independent generators emit TypeScript files
**Output:**
```
src/api/
├── contract/api-*.ts     (Zod schemas)
├── types/api-*.ts        (TypeScript types)
├── mappers/api-mapper.ts (runtime transformation functions)
├── api.ts                (HTTP client)
├── hooks.ts              (React Query hooks)
├── query-key.ts          (cache key generation)
└── constants.ts          (API constants)
```

---

## Key Concepts (60 Seconds)

### 1. Intermediate Representation (IR)
**Manifest = Resolved Type Information**

The compiler computes, once, during `scan`:
- What is each route's response? (model? resource? collection? nullable?)
- What are the field types? (int? string? datetime? custom object?)
- How should validation work? (required_if? unique? custom rules?)

All generators **read** this IR (manifest.json), don't re-derive.

### 2. Three IR Layers

**Layer 1: Raw**
```typescript
field.raw = "$this->product->user->created_at"  // PHP code string
```

**Layer 2: Parsed AST**
```typescript
field.ast = {
  kind: "property_access",
  target: { kind: "property_access", target: "$this->product", property: "user" },
  property: "created_at"
}
```

**Layer 3: Semantic (Final)**
```typescript
field.resolved = {
  type: "datetime",           // Carbon instance
  nullable: true,             // nullable DB column
  confidence: 95,
  trace: [
    "Column 'created_at' in 'products' table → datetime",
    "Carbon cast on Eloquent model → datetime",
    "Carbon.toJSON() → ISO 8601 string"
  ]
}
```

### 3. Semantic Resolution
The compiler has rules for:
- **Eloquent Models**: Column types from schema
- **Accessors**: `public function getFullNameAttribute()` → string
- **Casts**: `protected $casts = ['settings' => 'array']` → array
- **Resources**: `JsonResource::toArray()` → nested object
- **Relationships**: `belongsTo`, `hasMany`, `morphTo` → collection/single
- **Date Methods**: `created_at->format('Y-m-d')` → string
- **Auth**: `auth()->user()` → User model

---

## Current Architecture (Real)

```
/compiler                 — Specifications (30 .md files)
  ├─ CompilerArchitecture.md
  ├─ IntermediateRepresentation.md
  ├─ Nodes.md
  ├─ Passes.md
  └─ ... (reference docs)

packages/cli/src/
  ├─ commands/
  │   ├─ annotate.ts         ← Stage 1
  │   ├─ scan.ts             ← Stage 2
  │   └─ generate.ts         ← Stage 3
  ├─ parsers/
  │   ├─ LaravelRouteParser.ts    (PHP reflection)
  │   └─ PhpCodeParser.ts         (expression → AST)
  ├─ resolvers/
  │   ├─ SemanticResolutionKernel.ts  (for audit/explain)
  │   └─ plugins/*.ts              (resolver rules)
  └─ generators/
      ├─ ZodTierGenerator.ts       (1890 lines, 6 responsibilities)
      ├─ HookGenerator.ts
      ├─ SDKGenerator.ts
      └─ ... (10 others)

packages/core/src/
  ├─ semantic/
  │   └─ SemanticKernelV2.ts   ← Main resolver (used by scan)
  ├─ types/
  │   ├─ semantic.ts           (IR v2 spec)
  │   └─ route.ts              (Manifest structure)
  ├─ client/
  │   └─ HttpClient.ts         (Axios wrapper)
  └─ routing/
      └─ PathResolver.ts

/docs/compiler                — This documentation (generated from /compiler)
  ├─ INDEX.md              ← Start here
  ├─ QUICK_START.md        ← You are here
  ├─ ARCHITECTURE.md
  ├─ IR_SPECIFICATION.md
  └─ ...
```

---

## What Happens In Each Stage

### Scan Output: routesync.manifest.json
```json
{
  "version": "2.0",
  "routes": [
    {
      "name": "posts.show",
      "method": "GET",
      "path": "/posts/{id}",
      "response": {
        "type": "model",
        "model": "Post",
        "nullable": false,
        "resolved": {
          "type": "model",
          "model": "Post",
          "fields": {
            "id": { "type": "number" },
            "title": { "type": "string" },
            "body": { "type": "string" },
            "created_at": { "type": "datetime" },
            "author": {
              "type": "model",
              "model": "User",
              "nullable": true
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "name": "Post",
      "fields": {
        "id": { "type": "number" },
        "title": { "type": "string" },
        "body": { "type": "string" },
        "created_at": { "type": "datetime" },
        "author_id": { "type": "number", "nullable": true }
      }
    }
  ]
}
```

### Generate Output: api.ts
```typescript
// From the manifest above, generates:
export const postsApi = {
  show: async (id: number) => {
    const response = await client.get(`/posts/${id}`)
    return response.data as {
      id: number
      title: string
      body: string
      created_at: Date
      author?: {
        id: number
        name: string
      }
    }
  }
}
```

### Generate Output: hooks.ts (React)
```typescript
// Wraps generated api.ts with TanStack Query
export const usePostsShow = (id: number) => {
  return useQuery({
    queryKey: ['posts', 'show', id],
    queryFn: () => postsApi.show(id),
  })
}
```

---

## Problem This Solves

**Without RouteSync:**
```typescript
// types.ts — manually written, must stay in sync with backend
interface Post {
  id: number
  title: string
  body: string
  created_at: Date   // ← Must remember to convert string to Date
  author?: User
}

// api.ts — manually written
export async function getPost(id: number): Promise<Post> {
  const res = await fetch(`/api/posts/${id}`)
  const data = await res.json()
  return {
    ...data,
    created_at: new Date(data.created_at)  // ← Manual conversion
  }
}

// Backend changes: add field `slug` to Post
// You must:
// 1. Update Laravel migration/model
// 2. Update Post interface in TypeScript
// 3. Update getPost to return slug
// 4. Update components that use Post
// Risk: You forget step 2 or 3 → type mismatch
```

**With RouteSync:**
```typescript
// 1. Update Laravel migration/model
// 2. Run: routesync scan && routesync generate
// 3. Done! types + api + hooks all updated automatically
// 4. TypeScript errors guide you to update components
```

---

## Running the Compiler

```bash
# Install
npm install -g routesync

# Or use locally
npm run build
./dist/cli.js --help

# Scan (requires running Laravel app)
php artisan serve         # Terminal 1
routesync scan            # Terminal 2

# Generate (no Laravel needed)
routesync generate

# Or both together
routesync sync --zod

# Watch mode (re-runs on file change)
routesync watch
```

---

## Next Steps

- **Understand the IR:** Read [IR_SPECIFICATION.md](IR_SPECIFICATION.md)
- **Understand generators:** Read [GENERATOR_SPECIFICATION.md](GENERATOR_SPECIFICATION.md)
- **Fix a bug:** Read [SEMANTIC_SPECIFICATION.md](SEMANTIC_SPECIFICATION.md)
- **Add a generator:** Read [PLUGIN_API.md](PLUGIN_API.md)
- **Optimize performance:** Read [OPTIMIZER.md](OPTIMIZER.md)

---

**See also:** [INDEX.md](INDEX.md) for full documentation roadmap
