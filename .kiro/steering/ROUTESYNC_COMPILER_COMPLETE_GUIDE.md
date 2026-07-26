# RouteSync: Complete Compiler Architecture Guide

**Version:** IR v2 (July 2026)  
**Status:** Comprehensive Steering for AI Agents  
**Source:** 18+ compiler specification documents + active codebase analysis

This document provides complete architectural guidance for AI agents working with RouteSync. Use this as your primary reference for understanding the compiler, making changes, and avoiding architectural violations.

---

## 🏛️ THE EIGHT LAWS OF ROUTESYNC (CONSTITUTION)

**CRITICAL:** Every code change, refactoring, and implementation MUST comply with these laws:

### Law 1: Single Source of Truth
Laravel application is the ONLY source of truth. Compiler MUST NOT require manual metadata if it can be inferred from PHP source, Laravel reflection, or database schema.

### Law 2: Semantic Completeness  
ALL semantic resolution (business meaning, model relations, domain intent) MUST be completed in Middle-end passes. Backend generators are FORBIDDEN from doing semantic inference.

### Law 3: Stable IR
Changes to target generators (React, Vue, Flutter) MUST NOT change the structure of `routesync.manifest.json`. IR is a stable public API contract.

### Law 4: Platform Agnostic
Compiler IR MUST be clean of framework-specific terms (React, Vue, TanStack Query, Next.js, `useCreate`). Only abstract concepts: `operationId`, `aggregates`, `traits`, `capabilities`.

### Law 5: Zero Generator Intelligence
Generators are **dumb renderers**. They ONLY read IR, map types, emit code. NO database traversal, NO domain guessing, NO heuristics. If generator has `if (groupName === 'cart')`, middle-end is broken.

### Law 6: Pass Isolation
Each compiler pass has ONE isolated responsibility. NO validation in semantic resolution, NO optimization in backend generation.

### Law 7: Deterministic Compilation
Same Laravel input MUST produce identical binary output. NO random UUIDs during compilation, NO timestamps in output, NO variable object key ordering.

### Law 8: IR First
All new features MUST be modeled in IR first. If a feature cannot be represented declaratively in IR, it cannot be implemented in generators.

---

## 🏗️ COMPILER ARCHITECTURE OVERVIEW

RouteSync is a **compiler**, not a code generator. It follows traditional compiler architecture:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   FRONTEND   │ →   │  MIDDLE-END  │ →   │  BACKEND   │
│              │     │              │     │            │
│ annotate     │     │ scan         │     │ generate   │
│ (optional)   │     │ (IR + resolve)│     │ (emit TS)  │
└─────────────┘     └──────────────┘     └─────────────┘
  Mutate PHP          Extract + Resolve     Emit TypeScript
  Add attributes      Build manifest.json    13 generators
```

### Three Compilation Stages

1. **`routesync annotate`** (Optional, Frontend)
   - Mutates Laravel PHP source code  
   - Adds `#[Response(Model::class)]` attributes to controllers
   - Only stage that writes to Laravel codebase

2. **`routesync scan`** (Frontend + Middle-end)
   - **Extract:** PHP reflection against booted Laravel app
   - **Resolve:** Semantic analysis of all types/relations  
   - **Output:** `routesync.manifest.json` (IR) + `routesync.graph.json` (debug)

3. **`routesync generate`** (Backend)
   - **Input:** `routesync.manifest.json` only
   - **Process:** 13 independent generators emit TypeScript files
   - **Output:** Complete typed frontend SDK

---

## 📊 INTERMEDIATE REPRESENTATION (IR v2)

### Three IR Layers (Progressive Semantic Enrichment)

#### Layer 1: Raw Layer (`IRRawNode`)
```typescript
field.raw = "$this->product->user->created_at"  // PHP code string
field.hints = {
  pattern: "property_access",
  confidence: 80,
  nullable: true,
  framework_context: "eloquent"
}
```

#### Layer 2: Parsed AST (`ParsedASTNode`)
```typescript
field.ast = {
  kind: "property_access",
  target: { 
    kind: "property_access", 
    target: { kind: "variable", name: "$this->product" }, 
    property: "user" 
  },
  property: "created_at"
}
```

#### Layer 3: Semantic Layer (`SemanticNode`)
```typescript
field.resolved = {
  status: "resolved",
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

### Contract Graph Structure (6 Node Types)

1. **OperationNode** - API endpoints (HTTP routes, GraphQL mutations)
2. **AggregateNode** - Domain boundaries (Cart, Order, User management)
3. **TraitNode** - Reusable capabilities (Collection, Promotion, Authentication)
4. **WorkflowNode** - Multi-step processes (Checkout, Registration)  
5. **EventNode** - Async triggers (WebSocket, Webhook, Queue events)
6. **SchemaNode** - Data structures (Request/Response shapes, Validation rules)

---

## 🔄 SEMANTIC RESOLUTION ENGINE

### Two Semantic Kernels (ARCHITECTURAL DEBT)

**PROBLEM:** Two independent implementations with diverging rules:

1. **`SemanticKernelV2`** (Production) - Used by `scan`
   - Location: `packages/core/src/semantic/SemanticKernelV2.ts` (599 lines)
   - Single large `resolve()` method with 40+ rules
   - Pattern matching on AST node kinds

2. **`SemanticResolutionKernel`** (Introspection) - Used by `audit`/`explain`  
   - Location: `packages/cli/src/resolvers/SemanticResolutionKernel.ts` (87 lines)
   - Plugin-based architecture with separate resolver classes
   - Different confidence gating rules, different helper allowlists

**FIX NEEDED:** Unify into single kernel implementation (R2 in refactoring plan)

### Resolution Rule Categories (40+ Rules)

1. **Primitive Resolution** - Direct type casting, literal values
2. **Variable Resolution** - `$this`, local assignments, model name matching
3. **Property Access** - Model fields, relations, accessors (case-insensitive)
4. **Method Calls** - Eloquent queries, Carbon dates, conditional wrappers
5. **Framework Helpers** - `auth()->user()`, `asset()`, `url()`, `route()`  
6. **Resource/Model Detection** - `new XxxResource()`, collection patterns
7. **Type Casting** - `(int)`, `(string)`, `(bool)` explicit casts
8. **Binary/Ternary** - `??` null coalescing, conditional expressions

### Evidence Trail System
Every resolution MUST provide trace evidence:
```typescript
trace: [
  { rule: "ModelColumnResolver", input: "created_at", output: "datetime" },
  { rule: "CarbonDateMethod", input: "toISOString", output: "string" },
  { rule: "ConfidenceBoost", reason: "Direct DB column", confidence: 100 }
]
```

---

## 🏭 GENERATOR PIPELINE (13 Generators)

### Execution Order (Fixed Dependencies)
```
1.  TypeGenerator          → types/index.ts (framework wrappers)
2.  SDKGenerator           → api.ts (HTTP client)  
3.  QueryKeyGenerator      → query-key.ts (TanStack Query keys)
4.  HookGenerator          → hooks.ts (React/Vue hooks)
5.  NextActionGenerator    → actions.ts (Server Actions)
6.  MswGenerator           → mocks.ts (Mock Service Worker)
7.  EchoGenerator          → echo.ts (WebSocket subscriptions)
8.  ModelGenerator         → core/models.ts (raw DB shapes)
9.  ZodTierGenerator       → 6 files (contract/types/mappers)
10. RoutesGenerator        → routes.ts (frontend routing)
11. ConstantsGenerator     → constants.ts (API constants)
12. IndexGenerator         → index.ts (barrel exports)
13. SchemaGenerator        → schemas.ts (LEGACY, to be deprecated)
```

### ZodTierGenerator (The God Object - 1890 Lines)
**LARGEST GENERATOR** with 6 internal responsibilities:

1. **generateContract()** → `contract/api-contract.ts` (Zod schemas, snake_case)
2. **generateSchema()** → `contract/api-schema.ts` (Form validation)  
3. **generateField()** → `contract/api-field.ts` (Field name mappings)
4. **generateRead()** → `types/api-read.ts` (TypeScript types, camelCase)
5. **generateForm()** → `types/api-form.ts` (Form request shapes)
6. **generateMapper()** → `mappers/api-mapper.ts` (Runtime transforms)

**REFACTORING NEEDED:** Split into 6 focused modules (R6 in plan)

---

## 🚨 ARCHITECTURAL PROBLEMS & TECHNICAL DEBT

### P1: ACTION_MAP Duplication (CRITICAL)
**Problem:** CRUD mapping (`post→Create`, `put→Update`) defined **6 times**
- `ZodTierGenerator`: 4 copies  
- `HookGenerator`: 1 copy
- `SDKGenerator`: 1 copy  
**Risk:** Change one, forget others → silent inconsistency  
**Fix:** Consolidate to `canonical-names.ts` single source (R1)

### P2: Resource/Model Resolution (CRITICAL)  
**Problem:** "Is this response a Resource or Model?" decided **3-4 times independently**
- `ZodTierGenerator.generateContract()` (isResourceAlias logic)
- `HookGenerator.resolveBaseResponseName()` (different logic)
- `HookGenerator.resolveResponseInfo()` (third implementation)  
- `SDKGenerator.getResponseInfo()` (fourth implementation)
**Risk:** Silent divergence, root cause of alias schema bugs  
**Fix:** Extract to shared `resource-resolution.ts` (R2)

### P3: Type Inference Parallel Systems (HIGH)
**Problem:** Zod vs TypeScript type mapping in 2 parallel systems:
- `buildResponseZodType()` → `z.number()`, `z.string()`
- `mapSqlTypeToTs()` → `number`, `string`  
**Risk:** Add new SQL type to one, forget the other → Zod/TS mismatch  
**Fix:** Single resolution, dual renderers (R3)

### P4: IR Not Fully Used (HIGH)
**Problem:** `normalizeManifest()` creates complete IR but generators receive raw manifest  
**Current:** Each generator re-infers from scratch  
**Should be:** All generators read shared IR decisions  
**Fix:** Thread `normalizedManifest` to all generators (R5)

### P5: Dead Code Backends
**Problem:** Complete unused generation pipeline exists:
- `CompilerBackendGenerator.ts`
- `SdkGenerator` in `packages/sdk/src/generator.ts`
- `ZodToTSEmitIR.ts` + `TSPrinter.ts`  
**Fix:** Delete or document as experimental

---

## 🎯 TYPE SYSTEM & MAPPINGS

### SQL Type → Zod → TypeScript Resolution
```typescript
// SQL Column Type
'int' | 'varchar' | 'json' | 'datetime' | 'boolean' | 'text'

// ↓ Semantic Resolution ↓
type: "number" | "string" | "object" | "datetime" | "boolean" | "string"

// ↓ Zod Renderer ↓  
'z.number()' | 'z.string()' | 'z.record(z.unknown())' | 'z.date()' | 'z.boolean()'

// ↓ TypeScript Renderer ↓
'number' | 'string' | 'Record<string, unknown>' | 'Date' | 'boolean'
```

### Confidence Scoring (Explicit, Advisory Only)
- **100:** Direct evidence (DB column, PHP attribute, type cast)
- **90:** Strong pattern (Resource suffix, Eloquent methods)  
- **80:** Case-insensitive model name match
- **70:** Capitalized variable fallback
- **50:** Primitive resolver default floor
- **0:** Unknown/unresolved

**NOTE:** Confidence currently not used by generators (opportunity for improvement)

---

## 📁 KEY FILE LOCATIONS & ENTRY POINTS

### Compiler Core
- **Main CLI:** `packages/cli/src/index.ts`
- **Scan Command:** `packages/cli/src/commands/scan.ts`
- **Generate Command:** `packages/cli/src/commands/generate.ts`  
- **IR Specification:** `packages/core/src/types/semantic.ts`
- **Manifest Structure:** `packages/core/src/types/route.ts`

### Semantic Resolution
- **Production Kernel:** `packages/core/src/semantic/SemanticKernelV2.ts` 
- **Introspection Kernel:** `packages/cli/src/resolvers/SemanticResolutionKernel.ts`
- **Resolver Plugins:** `packages/cli/src/resolvers/plugins/`

### Code Generation  
- **Generator Directory:** `packages/cli/src/generators/`
- **Main Generator:** `ZodTierGenerator.ts` (1890 lines)
- **Route Classification:** `packages/cli/src/generators/route-classifier.ts`
- **Naming Utilities:** `packages/cli/src/generators/names.ts`

### Runtime Dependencies (Ship to Frontend)
- **HTTP Client:** `packages/core/src/client/HttpClient.ts`
- **SDK Runtime:** `packages/sdk/src/defineApi.ts`  
- **React Hooks:** `packages/react/src/hooks/`
- **Vue Composables:** `packages/vue/src/composables/`

---

## 🛠️ COMMON DEVELOPMENT TASKS

### Adding New SQL Type Support
1. **Update SemanticKernelV2:** Add SQL type → semantic type mapping  
2. **Update Both Renderers:** Zod renderer + TypeScript renderer
3. **Add Tests:** Unit tests for resolution + integration tests for output
4. **Verify:** No divergence between Zod schema and TS types

### Adding New Generator
1. **Create Class:** `packages/cli/src/generators/MyGenerator.ts`
2. **Implement Interface:** `static generate(manifest, outputDir, options)`
3. **Update Pipeline:** Add to `packages/cli/src/commands/generate.ts` order
4. **Update Index:** Add to `IndexGenerator.ts` exports
5. **Add Tests:** Both unit and integration tests

### Debugging Type Resolution Issues  
1. **Check Resolution:** `routesync explain <path>` for trace evidence
2. **Check Kernel:** Compare SemanticKernelV2 vs SemanticResolutionKernel  
3. **Check Confidence:** Low confidence may indicate guessing
4. **Check IR:** Verify `resolved` field populated correctly
5. **Check Generators:** Verify generators read `resolved`, not re-infer

### Fixing Generator Output Issues
1. **Check Classification:** `route-classifier.ts` grouping logic
2. **Check Dependencies:** Generator execution order in `generate.ts`
3. **Check Imports:** Verify naming conventions between generators
4. **Check IR Usage:** Ensure reading from manifest, not deriving

---

## 🚀 COMPILER ROADMAP & VISION

### Current Phase: IR v2 (Stable)
- ✅ Three-layer IR architecture  
- ✅ Contract Graph with 6 node types
- ✅ 13 generator pipeline  
- ✅ React target fully implemented

### Phase 1-6 Refactoring (Active)
- **R1-R7:** Consolidate duplicate logic, unify semantic kernels
- **R6:** Split ZodTierGenerator God Object  
- **Target:** Single IR source of truth, no re-inference

### Vision 2030: Multi-Target Compiler
**Target Sequence:**
1. **React** ✅ (Reference implementation)  
2. **Vue** 🔄 (Test of generator boundary)
3. **OpenAPI** 📋 (Lower effort, high value)
4. **Mobile** 📱 (React Native, Flutter)  
5. **CLI/SDK** 💻 (Backend-to-backend)
6. **AI Agent/MCP** 🤖 (Tool calling from IR traces)

---

## 🔍 DEBUGGING & TROUBLESHOOTING

### Common Issues & Solutions

**Q: Types don't match between Zod and TypeScript**  
A: Check dual type inference systems (P3). Likely missing mapping in one renderer.

**Q: Resource resolution inconsistent across generators**  
A: Check resource/model resolution duplication (P2). Different generators using different logic.

**Q: Generator produces wrong output**  
A: Check IR usage. Generator may be re-inferring instead of reading resolved data.

**Q: Confidence always shows 50**  
A: Check SemanticKernelV2 rules. May be hitting default fallback instead of specific rules.

**Q: New Laravel feature not detected**  
A: Check extraction in `LaravelRouteParser.ts`. May need new PHP reflection or regex pattern.

### Verification Commands
```bash
# Check type resolution trace
routesync explain users.show.data.created_at

# Audit resolution health  
routesync audit --verbose

# Generate with debug info
routesync generate --debug

# Verify no duplicate ACTION_MAP
grep -r "ACTION_MAP" packages/cli/src/generators/ | wc -l  # Should be 1 after R1
```

---

## 📋 COMPLIANCE CHECKLIST

Before making changes, ensure:

- [ ] **Law Compliance:** Change follows all 8 constitutional laws
- [ ] **IR First:** New features modeled in IR before implementation  
- [ ] **No Re-inference:** Generators read IR, don't derive independently
- [ ] **Deterministic:** Same input produces identical output
- [ ] **Evidence Trail:** All resolutions carry trace information  
- [ ] **Platform Agnostic:** No framework-specific terms in IR
- [ ] **Single Source:** No duplicate logic across codebase
- [ ] **Tests Updated:** Unit + integration tests for changes

---

## 🎯 KEY SUCCESS PATTERNS

### ✅ Correct Approaches
- Read resolved types from manifest IR  
- Use evidence-based resolution with confidence scores
- Follow generator pipeline execution order
- Implement pure functions with no side effects  
- Use semantic kernels for type decisions
- Follow camelCase/snake_case boundary rules

### ❌ Anti-Patterns to Avoid
- Re-inferring types in generators (violates Law 5)
- Hardcoding domain logic in generators (violates Law 2)  
- Framework-specific terms in IR (violates Law 4)
- Duplicate resolution logic (violates Law 1)
- Mutable state across generator runs (violates Law 7)
- Silent failures without trace evidence (violates Constitution §3)

---

**This document is your authoritative guide to RouteSync compiler architecture. Consult it before making architectural decisions, fixing bugs, or adding features. When in doubt, follow the Eight Laws and trace the evidence.**

**Last Updated:** July 25, 2026  
**IR Version:** v2  
**Compiler Status:** Production with active refactoring