# RouteSync Generator Refactor — Detailed Implementation Roadmap

**Document Version:** 2.0  
**Based On:** Engine.FIx.md audit (§0-§29)  
**Status:** Ready for Implementation Phase  
**Last Updated:** July 25, 2026

---

## EXECUTIVE SUMMARY

Your audit (Engine.FIx.md, §0-§29) revealed that the generator architecture has **one core problem: Duplicate Semantic Inference**. Rather than "God Object is the problem," the real problem is **no IR (Intermediate Representation) exists at the compiler level**.

### Root Cause (§23 Clarification)
- `routeResponseMap` exists but is scoped to `ZodTierGenerator` only — **not exported**
- `normalizeManifest()` runs but result is **discarded** (never passed to generators)
- Each generator independently re-infers: resource resolution, type mapping, action naming, field mapping
- This results in: **6 implementations of resource resolution**, **2 parallel type systems**, **~22 manual `camelCase()` calls**

### Solution Architecture
Instead of "split ZodTierGenerator into 6 classes," focus on:
1. **Unify IR** — Export `routeResponseMap` and resolved types from one compiler pass
2. **Make generators pure renderers** — All semantic inference happens once, all generators read the result
3. **Eliminate duplicate traversals** — One pass per semantic decision, immutable IR passed to all consumers

---

## PHASE 1: IR Infrastructure (2-3 days)

### Goal
Create a new layer that **computes all semantic decisions once**, generates an immutable IR, and makes it available to all generators.

### 1.1 Create `SemanticResolver.ts` (New Module)

**Purpose:** Single source of truth for all semantic decisions.

**File Path:** `packages/cli/src/generators/semantic-resolver.ts`

**Responsibilities:**
- Resolve resource aliasing (is this response Resource X, or fallback name Y?)
- Resolve type mapping (SQL `bigint` → TypeScript `number` & Zod `z.number()`)
- Resolve field naming (both snake_case preservation and camelCase transformation)
- Resolve action naming (POST → `create`, PUT/PATCH → `update`)
- Resolve response composition (collection? paginated? wrapped?)

**Key Interface:**
```typescript
export interface CompilerIR {
  // One entry per unique response type
  responseTypes: Map<string, ResolvedResponse>
  // One entry per action across all resources
  actionMappings: Record<string, string> // 'post' → 'Create'
  // One entry per model field
  fieldMappings: Map<string, FieldResolution>
  // Metadata cache for quick lookup
  resourceAliases: Map<string, string> // route → ResourceName
}

export interface ResolvedResponse {
  id: string // Stable identifier
  kind: 'primitive' | 'resource' | 'model' | 'custom'
  name: string // TypeScript class name
  fields: Map<string, ResolvedField>
  isCollection: boolean
  isPaginated: boolean
  isWrapped: boolean
  contractName: string // e.g., 'OrderResourceSchema'
  mapperName: string // e.g., 'toOrderResourceRead'
}

export interface ResolvedField {
  name: string // camelCase
  type: 'string' | 'number' | 'boolean' | 'null' | 'unknown' | 'object' | 'array'
  nullable: boolean
  zodType: string // 'z.string()', 'z.number()', etc
  tsType: string // 'string', 'number', etc
  sourceSnakeCase: string // Original snake_case name
}
```

**Implementation Strategy:**

```typescript
export class SemanticResolver {
  static resolve(manifest: RouteManifest): CompilerIR {
    const ir = {
      responseTypes: new Map(),
      actionMappings: CANONICAL_ACTION_MAP, // Centralized
      fieldMappings: new Map(),
      resourceAliases: new Map(),
    }

    // Pass 1: Collect all response types
    for (const route of manifest.routes) {
      this.resolveResponseType(route, ir)
    }

    // Pass 2: Normalize field mappings
    for (const model of manifest.models) {
      this.resolveModelFields(model, ir)
    }

    // Pass 3: Resolve action names
    for (const route of manifest.routes) {
      const action = ir.actionMappings[route.method.toLowerCase()]
      route._resolvedAction = action
    }

    return ir
  }

  private static resolveResponseType(
    route: GeneratedRoute,
    ir: CompilerIR
  ): void {
    // Logic from ZodTierGenerator.generateContract() lines 376-415
    // But extracted into pure, deterministic function
    const resourceName = this.resolveResourceName(route, ir)
    const responseId = `${route.name}Response`

    if (!ir.responseTypes.has(responseId)) {
      ir.responseTypes.set(responseId, {
        id: responseId,
        kind: this.deriveResponseKind(route),
        name: resourceName,
        fields: this.buildFieldMap(route),
        isCollection: route.response?.collection ?? false,
        isPaginated: route.response?.paginated ?? false,
        isWrapped: route.response?.wrapped ?? false,
        contractName: `${resourceName}Schema`,
        mapperName: `to${resourceName}Read`,
      })
      ir.resourceAliases.set(route.name, resourceName)
    }
  }

  private static resolveResourceName(
    route: GeneratedRoute,
    ir: CompilerIR
  ): string {
    // All resource-aliasing logic from ZodTierGenerator
    // Currently: 6 different implementations across 3 files
    // After: SINGLE implementation, deterministic, testable
    const meta = route.response
    if (!meta) return `${toTypeName(route.name)}Response`

    // Check if it's an alias to existing resource
    if (meta.resource && !meta.fields) {
      return `${toTypeName(meta.resource)}Resource`
    }

    // Fallback: derive from route name + action
    return `${toTypeName(route.name)}${CANONICAL_ACTION_MAP[route.method.toLowerCase()]}`
  }
}
```

**Key Principle:** All decisions made here are **deterministic, testable, cacheable**. No side effects, no mutable state.

### 1.2 Create `CANONICAL_NAMES.ts` (Shared Constants)

**Purpose:** Eliminate all duplicate ACTION_MAP declarations.

**File Path:** `packages/cli/src/generators/canonical-names.ts`

**Content:**
```typescript
// The ONE place where semantic naming decisions live
export const CANONICAL_ACTION_MAP = {
  'post': 'Create',
  'put': 'Update',
  'patch': 'Update',
  'delete': 'Delete',
  'get': 'Get', // For form mapping, though routes use `list`/`show` semantically
} as const

export const CANONICAL_HTTP_METHODS = {
  create: 'POST',
  read: 'GET',
  update: 'PUT', // or PATCH, but normalized here
  delete: 'DELETE',
} as const

// Type mappings that should be used by BOTH Zod and TypeScript emitters
export const SQL_TO_TYPE_MAP = {
  'string': { zod: 'z.string()', ts: 'string' },
  'text': { zod: 'z.string()', ts: 'string' },
  'bigint': { zod: 'z.number()', ts: 'number' },
  'integer': { zod: 'z.number()', ts: 'number' },
  'boolean': { zod: 'z.boolean()', ts: 'boolean' },
  'json': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>' },
  'datetime': { zod: 'z.string()', ts: 'string' },
  'date': { zod: 'z.string()', ts: 'string' },
} as const

export const CAST_TO_TYPE_MAP = {
  'string': { zod: 'z.string()', ts: 'string' },
  'integer': { zod: 'z.number()', ts: 'number' },
  'float': { zod: 'z.number()', ts: 'number' },
  'boolean': { zod: 'z.boolean()', ts: 'boolean' },
  'array': { zod: 'z.array(z.unknown())', ts: 'unknown[]' },
  'json': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>' },
} as const

// Centralized enum for action types
export enum ActionType {
  Create = 'Create',
  Read = 'Read',
  Update = 'Update',
  Delete = 'Delete',
}
```

**Migration Plan:**
- Replace all 6 ACTION_MAP declarations with imports from this file
- Update tests to import from `CANONICAL_NAMES`
- Verify no behavioral change (it's just consolidation)

### 1.3 Update `sync.ts` to Pass IR

**File Path:** `packages/cli/src/sync.ts`

**Current State (lines 47-50):**
```typescript
const normalizedManifest = normalizeManifest(manifest, kernel)
// Result discarded, not passed to generators
```

**Change To:**
```typescript
const normalizedManifest = normalizeManifest(manifest, kernel)
const compilerIR = SemanticResolver.resolve(normalizedManifest)

// Pass IR to all generators
await ZodTierGenerator.generate(dir, compilerIR, manifest)
await HookGenerator.generate(dir, compilerIR, manifest)
await SDKGenerator.generate(dir, compilerIR, manifest)
// ... etc for all generators
```

**Key Change:** All generators now receive both `compilerIR` (decisions) and `manifest` (facts).

---

## PHASE 2: Refactor ZodTierGenerator (3-4 days)

### Goal
Convert `ZodTierGenerator` from "all-in-one semantic-inference" to "pure renderer that reads IR."

### 2.1 Remove Duplicate State

**Current:** Private static fields `knownSchemas`, `graph`, `routeResponseMap`

**New:** Accept IR as parameter, all state is immutable

```typescript
export class ZodTierGenerator {
  static async generate(
    dir: string,
    ir: CompilerIR,  // ← NEW: All decisions already made
    manifest: RouteManifest
  ): Promise<void> {
    // No more .clear() or mutable state setup
    // Just read IR and render
    await this.generateContract(dir, ir, manifest)
    await this.generateSchema(dir, ir, manifest)
    // ... etc
  }

  private static async generateContract(
    dir: string,
    ir: CompilerIR,
    manifest: RouteManifest
  ): Promise<void> {
    const lines: string[] = []

    // BEFORE: Had to calculate resource name, check collection, infer types
    // AFTER: All pre-computed in ir.responseTypes
    for (const [responseId, resolved] of ir.responseTypes) {
      lines.push(`export const ${resolved.contractName} = z.object({`)
      for (const [fieldName, field] of resolved.fields) {
        lines.push(`  ${fieldName}: ${field.zodType},`)
      }
      lines.push(`})`)
    }

    await fs.writeFile(path.join(dir, 'contract', 'api-contract.ts'), lines.join('\n'))
  }
}
```

**Key Benefits:**
- No more duplicate type inference in `generateRead()`
- `mapSqlTypeToZod()` result is used by both `generateContract()` and `generateRead()` via IR
- `knownSchemas` no longer needed (all collection/resource logic pre-resolved in IR)

### 2.2 Split into Focused Emitters (Optional, Can Be Deferred)

**Note:** This is a "nice-to-have" for Phase 2. The refactor is complete once generators become pure renderers.

If splitting is desired:
- `ContractEmitter.ts` (200 lines): Just render `ir.responseTypes` to Zod syntax
- `SchemaEmitter.ts` (150 lines): Just render `ir.responseTypes` to react-hook-form syntax
- `ReadEmitter.ts` (250 lines): Just render `ir.responseTypes` to TypeScript interface syntax
- `MapperEmitter.ts` (300 lines): Just render transform functions

Each emitter is **stateless**, receives pre-computed IR, outputs syntax.

---

## PHASE 3: Refactor Other Generators (2-3 days)

### Goal
Update `HookGenerator`, `SDKGenerator` to read IR instead of re-inferring.

### 3.1 HookGenerator

**Before:**
```typescript
export class HookGenerator {
  private static resolveBaseResponseName(meta: ResponseMetadata): string {
    // ~30 lines of resource-resolution logic
    // Duplicates ZodTierGenerator.generateContract() logic
  }

  private static resolveResponseInfo(meta: ResponseMetadata): ResponseInfo {
    // ~40 lines of different logic, same purpose
    // Another duplicate implementation
  }
}
```

**After:**
```typescript
export class HookGenerator {
  static async generate(
    dir: string,
    ir: CompilerIR,  // ← NEW
    manifest: RouteManifest
  ): Promise<void> {
    // No more resolveBaseResponseName() or resolveResponseInfo()
    // Just read ir.resourceAliases, ir.responseTypes
    for (const route of manifest.routes) {
      const responseId = `${route.name}Response`
      const resolved = ir.responseTypes.get(responseId)!

      // Hook definition uses pre-resolved names
      hooks[route.name] = defineHook({
        endpoint: `api.${route.name}`,
        contractName: resolved.contractName,
        mapperName: resolved.mapperName,
      })
    }
  }
}
```

### 3.2 SDKGenerator

**Similar refactor:** Remove `getResponseInfo()`, use `ir.resourceAliases` instead.

**Before:** 100+ lines of response-resolution logic  
**After:** Just loop through IR, render endpoint definitions

---

## PHASE 4: Consolidate Duplicate Traversals (1 day)

### Goal
Remove duplicate loops over manifest (e.g., `contractResponseCount` vs `mapperAllRespCount`).

### Current Duplicates (§3)
```typescript
// In generateContract(), lines 294-298
const contractResponseCount = {}
for (const route of routes) {
  const key = deriveGroupName(route)
  contractResponseCount[key] = (contractResponseCount[key] ?? 0) + 1
}

// In generateMapper(), lines 1206-1213
const mapperAllRespCount = {}
for (const route of routes) {
  const key = deriveGroupName(route)
  mapperAllRespCount[key] = (mapperAllRespCount[key] ?? 0) + 1
}
// Same loop, same logic
```

### Solution
Add to `CompilerIR`:
```typescript
export interface CompilerIR {
  // ...existing fields...
  
  // One computation instead of two
  responseCountByGroup: Map<string, number>
}
```

Update `SemanticResolver.resolve()`:
```typescript
private static buildResponseCounts(manifest: RouteManifest): Map<string, number> {
  const counts = new Map<string, number>()
  for (const route of manifest.routes) {
    const key = deriveGroupName(route)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}
```

Then both `generateContract()` and `generateMapper()` use: `ir.responseCountByGroup`.

---

## PHASE 5: Fix Known Bugs (1-2 days)

### 5.1 Nested Array Indentation (§17, §20)

**Issue:** `CheckoutForm.Create.items` has incorrect indentation in nested `z.array(z.object({...}))`.

**Root Cause:** Separate code path for array-of-object payload that doesn't match flat object handling.

**Fix:** Use `CompilerIR.ResolvedField` type info instead of re-inferring:
```typescript
// In SchemaEmitter.ts / FormEmitter.ts
for (const field of resolvedResponse.fields) {
  if (field.type === 'array') {
    // Reuse same indent logic as flat objects
    lines.push(`  ${field.name}: z.array(z.object({`)
    // ... element fields with consistent +1 indent
    lines.push(`  })),`)
  }
}
```

### 5.2 Inconsistent Action Keys (§24.3, §28.3)

**Issue:** `profile.put` and `profile.patch` as separate entries for same operation.

**Fix:** In IR resolution phase, detect and merge duplicate actions:
```typescript
// In SemanticResolver
private static deduplicateActions(manifest: RouteManifest): Route[] {
  const deduped = new Map<string, Route>()
  for (const route of manifest.routes) {
    const actionKey = `${deriveGroupName(route)}.${ir.actionMappings[route.method.toLowerCase()]}`
    if (deduped.has(actionKey)) {
      // Merge: keep PUT, ignore PATCH (or vice versa)
      continue
    }
    deduped.set(actionKey, route)
  }
  return Array.from(deduped.values())
}
```

### 5.3 Rename vs Plural Inconsistency (§28.5)

**Issue:** `QueryKey.produk.list` vs `QueryKey.produk.lists` (singular vs plural).

**Fix:** This is **intentional** (exact key vs family key for broad invalidation), but needs documentation:
- Add to IR: `exact: string` vs `family: string` for each query key
- Update generators to explicitly distinguish in comments

---

## PHASE 6: Testing & Validation (1-2 days)

### 6.1 Unit Tests for SemanticResolver

```typescript
describe('SemanticResolver', () => {
  describe('resolveResourceName', () => {
    it('should return ResourceClass for aliased responses', () => {
      const route = { name: 'orders.get', response: { resource: 'OrderResource' } }
      const result = SemanticResolver.resolveResourceName(route, new Map())
      expect(result).toBe('OrderResource')
    })

    it('should return fallback name for non-aliased responses', () => {
      const route = { name: 'orders.get', response: { fields: [...] } }
      const result = SemanticResolver.resolveResourceName(route, new Map())
      expect(result).toMatch(/OrderResponse/)
    })
  })

  describe('CANONICAL_ACTION_MAP consistency', () => {
    it('should have all HTTP methods mapped', () => {
      const methods = ['post', 'put', 'patch', 'delete', 'get']
      for (const method of methods) {
        expect(CANONICAL_ACTION_MAP[method]).toBeDefined()
      }
    })
  })
})
```

### 6.2 Integration Tests

```typescript
describe('Generator Integration', () => {
  it('should produce consistent names across all generators', async () => {
    const ir = SemanticResolver.resolve(testManifest)

    const contractOutput = await ContractEmitter.generate(ir)
    const schemaOutput = await SchemaEmitter.generate(ir)
    const apiOutput = await SDKGenerator.generate(ir)
    const hooksOutput = await HookGenerator.generate(ir)

    // All generated names should be consistent
    expect(extractNames(contractOutput)).toEqual(extractNames(schemaOutput))
    expect(extractNames(contractOutput)).toEqual(extractNames(apiOutput))
  })
})
```

### 6.3 Regression Tests

Run full manifest from existing project, verify output is identical before/after refactor.

---

## Timeline & Dependencies

```
Day 1-2: Phase 1 (IR Infrastructure)
  ├─ 1.1 SemanticResolver.ts
  ├─ 1.2 CANONICAL_NAMES.ts
  └─ 1.3 Update sync.ts

Day 3-5: Phase 2 (ZodTierGenerator Refactor)
  ├─ 2.1 Remove mutable state, accept IR
  ├─ 2.2 Update all 6 generate* methods
  └─ Test & verify

Day 6-8: Phase 3 (HookGenerator, SDKGenerator)
  ├─ 3.1 HookGenerator refactor
  ├─ 3.2 SDKGenerator refactor
  └─ Test cross-generator consistency

Day 9: Phase 4 (Consolidate Duplicates)
  ├─ Remove contractResponseCount duplication
  ├─ Update Phase 2-3 generators
  └─ Test

Day 10-11: Phase 5 (Fix Known Bugs)
  ├─ 5.1 Nested array indentation
  ├─ 5.2 Duplicate action keys
  └─ 5.3 Query key naming

Day 12-13: Phase 6 (Testing & Validation)
  ├─ Unit tests for SemanticResolver
  ├─ Integration tests
  └─ Regression tests

Total: ~2 weeks (13 days)
```

---

## Rollout Strategy

### Option A: Big Bang
- Implement all 6 phases in feature branch
- Full test suite green
- Merge to main

**Pros:** Clean, atomic  
**Cons:** Long branch, complex merge, risky if issues found mid-way

### Option B: Incremental (Recommended)
1. **Week 1:** Phase 1-2 in feature branch
   - SemanticResolver + ZodTierGenerator refactor
   - All output files identical to before
   - Merge to main once tests pass

2. **Week 2:** Phase 3-4 in new feature branch
   - HookGenerator + SDKGenerator refactor
   - Consolidate duplicates
   - Merge once tests pass

3. **Week 3:** Phase 5-6
   - Fix known bugs
   - Full regression testing
   - Merge

**Pros:** Lower risk, easier rollback, incremental validation  
**Cons:** Multiple branches to track

---

## Success Criteria

✅ All output files identical before/after refactor (verified with diff)  
✅ No more duplicate ACTION_MAP declarations (search results zero)  
✅ No more duplicate resource-resolution logic (search results zero)  
✅ SemanticResolver unit tests all pass  
✅ Integration tests verify name consistency across generators  
✅ Full regression test suite passes  
✅ ZodTierGenerator file size reduced from 1890 → ~400 lines (if split in Phase 2.2)  
✅ All 6 generators accept `compilerIR` parameter  
✅ `normalizeManifest()` result actually used (passed to generators)  
✅ Nested array indentation bug fixed  
✅ Duplicate action keys resolved  

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Generator output changes (regression) | Full diff before/after, regression test suite |
| Type safety of IR pass-through | TypeScript strict mode, exhaust checks on CompilerIR fields |
| Performance regression | Benchmark compile time before/after on 500+ model manifests |
| Incomplete migration | Code search for old duplicates (ACTION_MAP, resolveResourceName, etc) |
| Missed dependencies | Full import graph analysis before Phase 2 merge |

---

## Deferred Items (Post-MVP)

- Split ZodTierGenerator into individual emitters (nice-to-have, can defer to Phase 2.2)
- Incremental compilation (requires file hashing + cache layer, separate epic)
- Valibot support (will be simpler once IR provides resolved types, just new emitter)
- Performance profiling (baseline first, then optimize)

---

## Reference to Audit Findings

This roadmap directly addresses the findings from Engine.FIx.md:

| Finding | Section | Solution |
|---|---|---|
| God Object (1890 lines) | §1, §5 | Phase 2.2 (split into emitters, after IR is pure) |
| 6x ACTION_MAP duplication | §3 | Phase 1.2 (CANONICAL_NAMES.ts) |
| 6x resource resolution | §3, §7 | Phase 1.1 (SemanticResolver) |
| 2x type inference systems | §6 | Phase 1.1 (SQL_TO_TYPE_MAP, used by both Zod + TS renderers) |
| IR unused (normalizeManifest) | §10, §14 | Phase 1.3 (Pass IR to all generators) |
| Duplicate traversals | §3 | Phase 4 (responseCountByGroup in IR) |
| Nested array indentation bug | §17, §20 | Phase 5.1 |
| Duplicate action keys | §24.3, §28.3 | Phase 5.2 |
| Query key singular/plural | §28.5 | Phase 5.3 (documentation) |

---

## Files to Create/Modify

### New Files
- `packages/cli/src/generators/semantic-resolver.ts` (300-400 lines)
- `packages/cli/src/generators/canonical-names.ts` (50-100 lines)
- `packages/cli/src/generators/__tests__/semantic-resolver.test.ts` (200+ lines)
- `packages/cli/src/generators/__tests__/integration.test.ts` (200+ lines)

### Modified Files
- `packages/cli/src/sync.ts` (lines 47-50, pass IR to generators)
- `packages/cli/src/generators/ZodTierGenerator.ts` (refactor to accept IR, remove state)
- `packages/cli/src/generators/HookGenerator.ts` (refactor to read IR)
- `packages/cli/src/generators/SDKGenerator.ts` (refactor to read IR)
- `packages/cli/src/generators/QueryKeyGenerator.ts` (no major changes, just receive IR for future use)

---

## Questions for Review

1. **Scope:** Should Phase 2.2 (splitting into individual emitters) be in MVP or deferred?
2. **Incremental compilation:** Should Phase 4 include file-hash-based caching, or just consolidate duplicates?
3. **Ordering:** Is Option B (incremental rollout) acceptable, or prefer Option A (big bang)?
4. **Type safety:** Is `compilerIR: CompilerIR` parameter acceptable, or prefer passing full context?

