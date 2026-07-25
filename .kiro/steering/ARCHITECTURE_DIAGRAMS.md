# VISUAL ARCHITECTURE DIAGRAMS — ROUTESYNC GENERATOR

Visual reference untuk memahami alur dan dependencies di generator pipeline.

---

## DIAGRAM 1: MANIFEST FLOW (End-to-End)

```
┌─────────────────────────────────────────────────────────────────┐
│                          Laravel Runtime                        │
│  (Routes, Models, Resources, Eloquent Accessors)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ LaravelRouteParser
                    │ (reflection-based)
                    │ spawnSync routesync-dump.php
                    └────────┬────────┘
                             │
                    ┌────────▼─────────────────────┐
                    │ routesync.manifest.json      │
                    ├──────────────────────────────┤
                    │ routes: ParsedRoute[]        │
                    │ models: ParsedModel[]        │
                    │ resources: ParsedResource[]  │
                    └────────┬─────────────────────┘
                             │
                    ┌────────▼─────────────┐
                    │ generate.ts (command)│
                    │ (entry point)        │
                    └────────┬─────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
      ┌────▼──────┐  ┌──────▼──────────┐  ┌──▼──────────┐
      │normalizer  │  │NormalizedManifest
(IR) │(NOT USED)  │  └──────────────────┘  │Generator 1-11
      └────┬──────┘                         └──┬──────────┘
           │                                   │
      [IR DIBUANG]                        ┌────▼───────────────┐
                                          │  Masih baca         │
                                          │  ParsedRoute mentah │
                                          │  (bukan            │
                                          │   NormalizedRoute)  │
                                          └────┬───────────────┘
                                               │
                            ┌──────────────────┼──────────────────┐
                            │                  │                  │
                     ┌──────▼──────┐    ┌─────▼────┐    ┌────────▼────────┐
                     │   SDK/Hooks  │    │  Types   │    │ ZodTierGenerator│
                     │  Re-infer    │    │  (simple)│    │ (6 methods)     │
                     │  Response    │    └─────┬────┘    ├──────────┬──────┤
                     │  Type 3x     │          │         │ contract │read  │
                     │  Independently
                     └──────┬───────┘          │         │ schema   │form  │
                            │                 │         │ field    │mapper│
                     ┌──────▼─────┐           │         └──────────┴──────┘
                     │ api.ts      │    ┌─────▼────────┐
                     │ hooks.ts    │    │ types/index  │
                     └─────────────┘    │ api.ts       │
                                        │ hooks.ts     │
                                        │ mappers/     │
                                        │ contracts/   │
                                        └──────────────┘
```

---

## DIAGRAM 2: ZodTierGenerator — Internal Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ZodTierGenerator.ts (1890 baris)                 │
│  Private Static State: knownSchemas, graph (dead)                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼──────────────────┐
                    │ generate(manifest)               │
                    ├──────────────────────────────────┤
                    │ 1. knownSchemas.clear()          │
                    │ 2. graph = new ContractGraph()   │
                    │ 3. Populate knownSchemas (models │
                    │    + resources)                  │
                    │ 4. normalize(manifest, kernel)   │
                    │ 5. Call 6 generate* methods      │
                    └───────────────┬──────────────────┘
                                    │
                    ┌───────────────▼──────────────────────────────┐
                    │ generateContract()                           │
                    ├──────────────────────────────────────────────┤
                    │ • Loop routes, decide: resource alias        │
                    │   atau route-named fallback?                 │
                    │                                              │
                    │ • Emit: ${model}Schema (per model)           │
                    │ • Emit: ${resource}Schema (per resource)     │
                    │ • Emit: ${respName}ResponseSchema (fallback) │
                    │                                              │
                    │ • RETURN: routeResponseMap                   │
                    │   Map<string, RouteResponseComposition>      │
                    │                                              │
                    │ Files: contract/api-contract.ts             │
                    └───────────┬──────────────────────────────────┘
                                │
                ┌───────────────┴───────────────────────────┐
                │                                           │
        ┌───────▼──────────────┐                    ┌──────▼────────────┐
        │ generateSchema()      │                    │ generateRead()     │
        ├────────────────────────┤                    ├────────────────────┤
        │ • Loop routes          │                    │ • Receive:         │
        │ • Emit: ${action}      │                    │   routeResponseMap │
        │   Payload schemas      │                    │   (CORRECT!)       │
        │   (form validation)    │                    │                    │
        │                        │                    │ • Re-infer:        │
        │ • File: contract/      │                    │   SQL → TS types   │
        │   api-schema.ts        │                    │   (DUPLICATE!)     │
        │                        │                    │                    │
        │ • Problem: NOT baca    │                    │ • Emit: Transformed│
        │   routeResponseMap     │                    │   types (camelCase)│
        │   re-infer dari nol    │                    │                    │
        └────────────────────────┘                    │ • File: types/     │
                │                                     │   api-read.ts      │
        ┌───────▼──────────────┐                    └────────────────────┘
        │ generateField()       │
        ├────────────────────────┤
        │ • Emit: ApiField      │
        │   lookup table        │
        │   camelCase ↔         │
        │   snake_case          │
        │                        │
        │ • File: contract/      │
        │   api-field.ts        │
        │                        │
        │ • Problem: NOT baca    │
        │   routeResponseMap     │
        └────────────────────────┘

                │
        ┌───────▼──────────────────────────────┐
        │ generateForm()  +  generateMapper()   │
        ├────────────────────────────────────────┤
        │ generateForm():                        │
        │   • Emit: Form request schemas         │
        │   • File: types/api-form.ts            │
        │   • Problem: NOT baca routeResponseMap │
        │                                        │
        │ generateMapper():                      │
        │   • Receive: routeResponseMap (✓)      │
        │   • Emit: Transform functions          │
        │   • File: mappers/api-mapper.ts        │
        │   • Problem: Duplikasi traversal       │
        │     contractResponseCount vs           │
        │     mapperAllRespCount                 │
        └────────────────────────────────────────┘
```

---

## DIAGRAM 3: Naming Derivation — Duplikasi di 6 Tempat

```
┌──────────────────────────────────────────────────────────────────┐
│               ACTION_MAP Duplication — 6 Tempat                  │
│              Input: post, put, patch, delete, get                │
│              Output: Create, Update, Delete, Get                 │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ #1 CONTRACT_ACTION_MAP                          │
│     (ZodTierGenerator.generateContract)          │
│ { post: 'Create', put: 'Update', ... }          │
└─────────────────────────────────────────────────┘
        │
        ├─────────────────────────────────────────────┐
        │                                             │
┌───────▼────────────────────┐    ┌─────────────────▼─────┐
│ #2 SCHEMA_ACTION_MAP       │    │ #3 MAPPER_ACTION_MAP  │
│  (ZodTierGenerator.        │    │ (ZodTierGenerator.    │
│   generateSchema)          │    │  generateMapper)      │
│                            │    │                       │
│ { post: 'Create', ... }    │    │ { post: 'Create', ...}│
└───────┬────────────────────┘    └─────────────┬─────────┘
        │                                       │
        │         ┌──────────────────────┬──────┘
        │         │                      │
        │    ┌────▼─────────┐  ┌────────▼──────┐
        │    │ #4 ACTION_IN │  │ #5 ACTION_TO_ │
        │    │ CRUD (ZodT.  │  │ CRUD_HOOK     │
        │    │ generateForm)│  │ (HookGenerator)
        │    │              │  │                │
        │    │ {post:       │  │ {post:         │
        │    │  'Create'...}│  │  'Create'...}  │
        │    └────┬─────────┘  └────────┬───────┘
        │         │                      │
        │         └──────────────┬───────┘
        │                        │
        └───────────────┬────────┼────────────────┐
                        │        │                │
                   ┌────▼────────▼─────────────┐ │
                   │ #6 SDK_ACTION_MAP         │ │
                   │ (SDKGenerator)            │ │
                   │                           │ │
                   │ {post: 'Create'...}       │ │
                   └───────────────────────────┘ │
                                                 │
                                    [6 tempat total]
                                    
PROBLEM: Kalau format berubah (post→Build),
         harus update di 6 tempat, atau ada bug.
         Tidak ada type-safety atau compiler check.
```

---

## DIAGRAM 4: Type Inference — Sistem Paralel

```
┌──────────────────────────────────────────────────┐
│ Input: SQL Column Type (int, varchar, json, etc) │
│ Input: Laravel Cast (datetime, boolean, etc)     │
│ Input: Metadata (nullable, collection, etc)      │
└──────────────────┬───────────────────────────────┘
                   │
       ┌───────────┴────────────┐
       │                        │
       │ SISTEM #1              │ SISTEM #2
       │ (buildResponseZodType) │ (mapSqlTypeToTs)
       │                        │
   ┌───▼──────────────────┐  ┌──▼───────────────────┐
   │ mapSqlTypeToZod()    │  │ mapSqlTypeToTs()     │
   ├──────────────────────┤  ├──────────────────────┤
   │ if 'int'             │  │ if 'int'             │
   │ → z.number()         │  │ → number             │
   │                      │  │                      │
   │ if 'varchar'         │  │ if 'varchar'         │
   │ → z.string()         │  │ → string             │
   │                      │  │                      │
   │ if 'json'            │  │ if 'json'            │
   │ → z.record(...)      │  │ → Record<...>        │
   │                      │  │                      │
   │ if 'datetime'        │  │ if 'datetime'        │
   │ → z.date()           │  │ → Date               │
   │                      │  │                      │
   │ ... lebih banyak ... │  │ ... lebih banyak ... │
   └───┬──────────────────┘  └──┬───────────────────┘
       │                        │
       │ STRUKTUR IDENTIK       │ STRUKTUR IDENTIK
       │ LOGIC IDENTIK          │ LOGIC IDENTIK
       │ HANYA OUTPUT BEDA      │ HANYA OUTPUT BEDA
       │                        │
   ┌───▼──────────────────┐  ┌──▼───────────────────┐
   │ Zod Output:          │  │ TS Output:           │
   │ z.number().nullable()│  │ number | null        │
   │ z.string()           │  │ string               │
   │ z.array(z.object({  │  │ Array<{user_id...}> │
   │   user_id: z.number │  │                      │
   │ }))                  │  │                      │
   └──────────────────────┘  └──────────────────────┘
       │                        │
       ├────────────┬───────────┤
       │            │           │
   ┌───▼────────────▼───────────▼────┐
   │  api-contract.ts (Zod schemas)  │
   │  api-read.ts (TS types)         │
   │  Can diverge silently!          │
   │  TypeScript won't catch it.     │
   └─────────────────────────────────┘

PROBLEM: 2 sistem tipe, independent, bisa diverge.
         Kalau ada SQL type baru (e.g., 'year'):
         - Add ke mapSqlTypeToZod() ✓
         - LUPA add ke mapSqlTypeToTs() ✗
         - Result: Zod correct, TS wrong
         - No compiler warning, silent bug.
```

---

## DIAGRAM 5: Resource Resolution — 3-4 Implementasi

```
"Apakah response ini Resource yang sudah ada, atau fallback ke Model?"

┌──────────────────────────────────────────────────────────────┐
│ Input: route.response metadata (type, kind, model, resource) │
└──────────────────┬───────────────────────────────────────────┘
                   │
       ┌───────────┴────────────────────────┐
       │                                    │
┌──────▼────────────────────────────┐  ┌───▼──────────────────────┐
│ IMPLEMENTASI #1                   │  │ IMPLEMENTASI #2          │
│ ZodTierGenerator                  │  │ HookGenerator            │
│ .generateContract()               │  │ .resolveBaseResponseName()
│                                   │  │                          │
│ const isResourceAlias =           │  │ if (meta.kind === 'model')
│   (baseMeta?.type === 'resource'  │  │   const resourceName = 
│    || baseMeta?.kind === 'res...' │  │     `${meta.model}Resource`
│    || respMeta?.type === 'res...  │  │   if (known.has(resourceName))
│    || respMeta?.kind === 'res...' │  │     return resourceName
│   )                               │  │   else return modelName
│   && resourceRef                  │  │
│   && knownSchemas.has(            │  │ else if (meta.kind === 'resource')
│     `${resourceRef}Schema`        │  │   return meta.resource
│   )                               │  │                          │
└──────┬────────────────────────────┘  └───┬────────────────────┘
       │                                    │
       │         ┌─────────────────┬────────┘
       │         │                 │
       │    ┌────▼──────────────┐ ┌▼─────────────────────┐
       │    │ IMPLEMENTASI #3   │ │ IMPLEMENTASI #4      │
       │    │ HookGenerator     │ │ SDKGenerator         │
       │    │ .resolveResponse  │ │ .getResponseInfo()   │
       │    │ Info()            │ │                      │
       │    │                   │ │ let baseModel = ''   │
       │    │ const resolved =  │ │ let isModel = false  │
       │    │   raw.resolved ||  │ │ let isResource = ... │
       │    │   raw.semantic    │ │                      │
       │    │                   │ │ const resolvedKind = │
       │    │ if (meta.kind === │ │   meta.kind ||       │
       │    │   'model')        │ │   meta.type          │
       │    │   const resourceN │ │                      │
       │    │   = ...           │ │ if (resolvedKind ===  │
       │    │   if known.has    │ │   'model')           │
       │    │   (resourceN) ... │ │   baseModel = meta... │
       │    │                   │ │   etc                │
       │    └───────────────────┘ └──────────────────────┘
       │              │                     │
       └──────────────┼─────────────────────┘
                      │
         ┌────────────▼──────────────┐
         │ 3-4 KEPUTUSAN INDEPENDEN  │
         │                           │
         │ Bisa DIVERGE antar:       │
         │ - ZodTierGenerator        │
         │ - HookGenerator (2 versi) │
         │ - SDKGenerator            │
         │                           │
         │ Root cause dari bug       │
         │ OrdersGetResponseSchema   │
         │ = OrderResourceSchema     │
         └───────────────────────────┘

SOLUTION: Harus ada 1 IR pass yang compute ini sekali,
          immutable, di-pass ke semua generator.
```

---

## DIAGRAM 6: Current vs Ideal Architecture

### CURRENT (MASALAH)

```
RouteManifest (raw)
    │
    ├─→ TypeGenerator (re-infer)
    ├─→ SDKGenerator (re-infer action map, response type)
    ├─→ HookGenerator (re-infer resource resolution 2x)
    ├─→ QueryKeyGenerator (re-infer)
    ├─→ ConstantsGenerator (re-infer)
    └─→ ZodTierGenerator
        ├─ generateContract (infer response composition)
        ├─ generateSchema (re-infer dari nol)
        ├─ generateField (re-infer dari nol)
        ├─ generateRead (re-infer SQL→TS, baca partial IR)
        ├─ generateForm (re-infer dari nol)
        └─ generateMapper (baca partial IR)

Problems:
✗ 10+ implementasi dari keputusan yang sama
✗ Bisa silent diverge
✗ IR ada (NormalizedManifest) tapi dibuang
✗ Partial IR (routeResponseMap) tidak di-export
✗ Mutable state (knownSchemas) dengan risk
```

### IDEAL (SOLUTION)

```
RouteManifest (raw)
    │
    ▼
Compiler Pass (compute all decisions once)
    ├─ Resolve response type (resource/model/object)
    ├─ Infer type schema (primitive/object/model/resource)
    ├─ Compute action mapping (post→Create)
    ├─ Resolve camelCase transform
    └─ Normalize collection/pagination metadata
    │
    ▼
CompilerIR (immutable, complete, single source of truth)
    {
      routes: Route[] with fully-resolved response types
      models: Model[] with canonical field types
      resources: Resource[] with canonical field types
      actionMap: { post: 'Create', ... }
      fieldTransforms: { user_name: 'userName', ... }
    }
    │
    ├─→ Zod Renderer (emit z.number(), z.string(), etc)
    ├─→ TS Renderer (emit number, string, etc)
    ├─→ Mapper Renderer (emit transform functions)
    ├─→ SDK Renderer (emit typed client)
    ├─→ Hook Renderer (emit query hooks)
    └─→ Others (query-key, constants, etc)

Benefits:
✓ Setiap keputusan dihitung 1x
✓ Semua renderer melihat same IR
✓ Immutable → no risk dari mutable state
✓ Single source of truth
✓ Update logic → semua renderer otomatis benar
✓ Type-safe by construction
```

---

## DIAGRAM 7: IR Gap — Where It Should Be

```
normalizer.ts → normalizeManifest()
├─ Pass 1: ModelGraphBuilderPass
├─ Pass 2: SemanticResolutionPass
├─ Pass 3: NormalizationPass
├─ Pass 4: ValidationPass
└─ Result: NormalizedManifest
   {
     routes: NormalizedRoute[]  ← FULLY RESOLVED response types
     models: NormalizedModel[]  ← FULLY RESOLVED field types
     resources: NormalizedResource[]
   }
   │
   ├─ Line 50: saved to normalizedManifest variable
   │
   └─ Line 51+: GENERATORS RECEIVE manifest (raw), NOT normalizedManifest!

THE GAP:
┌────────────────────────────────────┐
│ normalizedManifest exists,         │
│ tapi tidak di-pass ke generator.   │
│                                    │
│ Should be:                         │
│ await Generator.generate(          │
│   normalizedManifest               │
│ )                                  │
│                                    │
│ Actually:                          │
│ await Generator.generate(          │
│   manifest  ← raw, not normalized  │
│ )                                  │
└────────────────────────────────────┘
```

---

## DIAGRAM 8: Dependency Graph Antar Generator

```
generateCommand()
    │
    ├─→ normalizeManifest()
    │   (IR generated, result dibuang)
    │
    ├─→ TypeGenerator    ─→ types/index.ts
    │   (independen)
    │
    ├─→ SDKGenerator     ─→ api.ts
    │   (independen, re-infer response)
    │   (import dari ConstantsGenerator)
    │
    ├─→ HookGenerator    ─→ hooks.ts
    │   (independen, re-infer response 2x)
    │
    ├─→ QueryKeyGenerator ─→ query-key.ts
    │   (independen)
    │
    ├─→ ConstantsGenerator ─→ constants.ts
    │   (independen)
    │   (exported untuk SDKGenerator)
    │
    ├─→ ModelGenerator ─→ models.ts
    │   (independen)
    │
    └─→ ZodTierGenerator ─→ 6 files
        (independen)
        ├─ generateContract() → routeResponseMap (IR lokal)
        │  (read knownSchemas, graph)
        │
        ├─ generateSchema()   (tidak baca IR, re-infer)
        ├─ generateField()    (tidak baca IR, re-infer)
        ├─ generateRead()     (BACA routeResponseMap ✓)
        ├─ generateForm()     (tidak baca IR, re-infer)
        └─ generateMapper()   (BACA routeResponseMap ✓)

Pattern: Semua generator independent.
         Tidak ada explicit IR sharing antar-generator.
         Implicit contract by naming convention.
         No compile-time check for consistency.
```

---

Gunakan diagram ini sebagai reference saat eksplorasi kode.
