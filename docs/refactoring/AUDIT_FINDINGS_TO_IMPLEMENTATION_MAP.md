# Audit Findings to Implementation Map

**Document Version:** 1.0  
**Purpose:** Link specific findings from Engine.FIx.md (§0-§29) to concrete implementation tasks  
**Status:** Ready for developer reference

---

## TABLE 1: Duplicate ACTION_MAP — Fix Location (§3 Finding)

**Finding:** 6 identical ACTION_MAP declarations across 3 files

| Location | Current Code | Line(s) | After-Fix |
|---|---|---|---|
| `ZodTierGenerator.ts` | `CONTRACT_ACTION_MAP = {post: 'Create', ...}` | 112-120 | ❌ Delete, import from `canonical-names.ts` |
| `ZodTierGenerator.ts` | `SCHEMA_ACTION_MAP = {post: 'Create', ...}` | 200-208 | ❌ Delete, import from `canonical-names.ts` |
| `ZodTierGenerator.ts` | `MAPPER_ACTION_MAP = {post: 'Create', ...}` | 400-408 | ❌ Delete, import from `canonical-names.ts` |
| `ZodTierGenerator.ts` | `ACTION_IN_CRUD = {post: 'Create', ...}` | 500-508 | ❌ Delete, import from `canonical-names.ts` |
| `HookGenerator.ts` | `ACTION_TO_CRUD_HOOK = {post: 'Create', ...}` | 35-43 | ❌ Delete, import from `canonical-names.ts` |
| `SDKGenerator.ts` | `SDK_ACTION_MAP = {post: 'Create', ...}` | 24-26 | ❌ Delete, import from `canonical-names.ts` |

**Task:** Create `packages/cli/src/generators/canonical-names.ts` with single CANONICAL_ACTION_MAP definition

---

## TABLE 2: Resource Resolution Duplication — 6 Implementations (§3, §7 Findings)

**Finding:** Resource aliasing decision logic implemented 6 times independently

| Location | Function | Line Range | Logic | After-Fix |
|---|---|---|---|---|
| `ZodTierGenerator.ts` | `generateContract()` | 376-415 | `isResourceAlias` check, decision cached in `routeResponseMap` | ✅ Keep (source of truth) |
| `ZodTierGenerator.ts` | `generateMapper()` | 1250-1280 | `baseModel` / `kind` resolution, re-derives from `meta` | ❌ Use from IR |
| `HookGenerator.ts` | `resolveBaseResponseName()` | 15-40 | Different condition logic, same purpose | ❌ Delete, use IR |
| `HookGenerator.ts` | `resolveResponseInfo()` | 68-120 | Third reimplementation | ❌ Delete, use IR |
| `SDKGenerator.ts` | `getResponseInfo()` | 38-145 | Fourth reimplementation | ❌ Delete, use IR |

**Task:** Extract `ZodTierGenerator.generateContract()` logic (lines 376-415) into `SemanticResolver.resolveResourceName()` in Phase 1.1

**Verification:** After refactor, search for `meta.resource`, `meta.kind`, `meta.model` — should only appear in `SemanticResolver.ts`

---

## TABLE 3: Type Inference Duplication — 2 Parallel Systems (§6 Finding)

**Finding:** SQL→Zod and SQL→TypeScript type mapping logic identical but separate

| System | Location | Lines | Maps |
|---|---|---|---|
| Zod | `ZodTierGenerator.mapSqlTypeToZod()` | 835-864 | SQL type → Zod syntax |
| Zod | `ZodTierGenerator.mapCastToZod()` | 857-890 | Laravel cast → Zod syntax |
| TypeScript | `ZodTierGenerator.mapSqlTypeToTs()` | 1148-1180 | SQL type → TS syntax (DUPLICATE LOGIC) |
| TypeScript | `ZodTierGenerator.mapCastToTs()` | 1170-1202 | Laravel cast → TS syntax (DUPLICATE LOGIC) |
| TypeScript | `ZodTierGenerator.mapResolvedToTsType()` | 1633-1690 | Response meta → TS syntax |
| Zod | `ZodTierGenerator.buildResponseZodType()` | 512-610 | Response meta → Zod syntax (PARALLEL LOGIC) |

**Task:** Create `CompilerIR.ResolvedField` with both `.zodType` and `.tsType` pre-computed in Phase 1.1

**Verification:** After refactor, `mapSqlTypeToZod()` and `mapSqlTypeToTs()` called exactly once each during IR computation, not in generators

---

## TABLE 4: Duplicate Traversals — Same Loop Twice (§3 Finding)

**Finding:** Full manifest traversal duplicated to count responses per resource

| Location | Variable | Lines | Purpose |
|---|---|---|---|
| `ZodTierGenerator.generateContract()` | `contractResponseCount` | 294-298 | Count responses per resource for dedup |
| `ZodTierGenerator.generateMapper()` | `mapperAllRespCount` | 1206-1213 | Count responses per resource (SAME LOOP) |

**Loop Structure (identical in both):**
```typescript
for (const route of routes) {
  const key = deriveGroupName(route)
  count[key] = (count[key] ?? 0) + 1
}
```

**Task:** Add `responseCountByGroup: Map<string, number>` to `CompilerIR` in Phase 1.1

**Usage After:** Both generators read `ir.responseCountByGroup` instead of calculating

---

## TABLE 5: Mutable State — `knownSchemas` Class-Static (§8 Finding)

**Finding:** Mutable shared state at class level, reset with `.clear()` at method start

| State | Type | Scope | Used By | Problem |
|---|---|---|---|---|
| `knownSchemas` | `Set<string>` | class-static | `generateContract()` (7 reads) | Reset required at start, temporal coupling |
| `graph` | dead field | class-static | None (dead code) | Removed in prior session |
| `routeResponseMap` | `Map` | local variable | `generateRead()`, `generateMapper()` (passed as param) | Correct pattern, but scope only within class |

**Location:** `ZodTierGenerator.ts` class declaration (top of file, ~lines 50-70)

**Task:** Phase 2 — remove `knownSchemas`, all logic moved to IR phase

**Verification:** Search for `knownSchemas` in source — should have zero results after refactor

---

## TABLE 6: Nested Object/Array Indentation Bug (§17, §20 Finding)

**Finding:** `z.array(z.object({...}))` indentation is incorrect in `api-schema.ts` and `api-form.ts`

| File | Example Route | Field | Issue |
|---|---|---|---|
| `api-schema.ts` | `CheckoutCreate` | `items` | Nested object fields aligned with outer fields, not indented further |
| `api-form.ts` | `CheckoutForm.Create` | `items` | Same indentation bug |
| `mappers/api-mapper.ts` | `CheckoutCreate` | `items` | **Correct indentation** — nested field indented properly |

**Location:** Search for `z.array(z.object` in codebase

**Root Cause:** Different code path for array-of-object payload than for flat object — likely in `generateForm()` or `generateSchema()` method

**Task:** Phase 5.1 — Trace through nested object builder, fix indentation logic

**Verification:** Generate test manifest with nested array payload, verify indent levels match mappers output

---

## TABLE 7: Duplicate Action Keys — PUT vs PATCH (§24.3, §28.3 Finding)

**Finding:** `profile.put` and `profile.patch` registered separately in `api.ts` and `hooks.ts`

| File | Keys | Issue | Should Be |
|---|---|---|---|
| `api.ts` | `profile.put`, `profile.patch` | Two entries, identical contract/mapper | One entry: `profile.update` |
| `hooks.ts` | `actionKeys.put`, `actionKeys.patch` | Two entries, identical invalidation | One entry: `actionKeys.update` |
| `hooks.ts` | `cache.put`, `cache.patch` | Two entries, identical invalidation logic | One entry: `cache.update` |

**Location:** `SDKGenerator.ts` (line ~160+), output in `api.ts`

**Root Cause:** `route-classifier.ts` (`deriveGroupName`) not deduplicating PUT/PATCH as same semantic action

**Task:** Phase 5.2 — In `SemanticResolver`, detect PUT/PATCH pair targeting same handler, merge to single action

**Verification:** After refactor, search `api.ts` output for `.put` — should find zero or only intentional override routes

---

## TABLE 8: Query Key Naming Inconsistency (§28.5 Finding)

**Finding:** `list` (singular) vs `lists` (plural) used for same concept

| Resource | Exact Key | Family Key | Issue |
|---|---|---|---|
| `produk` | `QueryKey.produk.list` | `QueryKey.produk.lists` | Why both? Intentional? |
| `orders` | `QueryKey.orders.list` | `QueryKey.orders.lists` | Same pattern |
| `profile` | `QueryKey.profile.list` | `QueryKey.profile.list` | Wait, inconsistent! |

**Location:** `QueryKeyGenerator.ts` output

**Verification:** Phase 5.3 — Document intentionality in IR and add explicit fields for exact vs family keys

---

## TABLE 9: Implied Dependencies — Who Imports Whom (§2 Finding)

**Finding:** Generators re-derive names independently, not importing shared decision

| Generator | Imports From | What | Should Import |
|---|---|---|---|
| `SDKGenerator.ts` | `ConstantsGenerator` | ✅ Only valid cross-import | Continue |
| `HookGenerator.ts` | `ZodTierGenerator` | ❌ Nothing (re-derives) | ✅ After refactor: IR only |
| `SDKGenerator.ts` | `ZodTierGenerator` | ❌ Nothing (re-derives `getResponseInfo()`) | ✅ After refactor: IR only |
| `QueryKeyGenerator.ts` | `route-classifier` | ✅ Appropriate | Continue |

**Task:** After Phase 1.1, add import: `import { CompilerIR } from './semantic-resolver'` to all generators

**Verification:** Grep for `resolveResourceName`, `getResponseInfo`, `resolveBaseResponseName` — delete from all files except `SemanticResolver`



---

## TABLE 10: Manifest IR Not Used — Dead Code Path (§10 Finding)

**Finding:** `normalizeManifest()` runs but result discarded

| File | Line(s) | Current | After-Fix |
|---|---|---|---|
| `generate.ts` (sync.ts) | 47-50 | `const normalizedManifest = normalizeManifest(...)`<br/>`// never used` | ✅ Pass to all generators |

**Task:** Phase 1.3 — Update `sync.ts` line 48 to pass `normalizedManifest` result to generators

**Before:**
```typescript
const normalizedManifest = normalizeManifest(manifest, kernel)
await ZodTierGenerator.generate(dir, manifest)
await HookGenerator.generate(dir, manifest)
```

**After:**
```typescript
const normalizedManifest = normalizeManifest(manifest, kernel)
const compilerIR = SemanticResolver.resolve(normalizedManifest)

await ZodTierGenerator.generate(dir, compilerIR, manifest)
await HookGenerator.generate(dir, compilerIR, manifest)
// ... all generators
```

---

## TABLE 11: `camelCase()` Over-Called (§3, §19 Finding)

**Finding:** `camelCase()` called ~22 times independently, should be called once per field during IR compute

| Location | Calls | For What |
|---|---|---|
| `generateRead()` | ~12 | Transforming each model column to camelCase |
| `names.ts` / `route-classifier.ts` | ~10 | Route naming derivation |

**Task:** Phase 1.1 — Compute all field camelCase mappings once in `SemanticResolver`, store in `CompilerIR.fieldMappings`

**Verification:** Search for `.camelCase(` in generated code — verify it's called exactly once during IR phase, zero times in emitters

---

## TABLE 12: `api-field.ts` Purpose & Consumer (§19 Finding)

**Finding:** Previously thought orphan, actually has consumer

| Consumer | How Used | Location |
|---|---|---|
| Form mapper functions | Key reference: `[ApiApiField.NAME]` | `mappers/api-mapper.ts` form-transform section |
| Frontend form component | Static const reference | Unknown (not in audit scope) |

**Verification:** Search codebase for `ApiApiField` usage (not just definition)

**Task:** Phase 1.1 — Ensure `ApiApiField` stays in `contract/api-field.ts`, but verify it's exported correctly

**Note:** Not a bug, just needed verification. Update any misleading docs claiming it's orphan.

---

## TABLE 13: Form Mapper Location — False Positive in Audit (§21, §26 Finding)

**Finding:** Form mapper functions (`toApiXCreate`) location was uncertain

| Actual Location | Reported in Audit | Verified |
|---|---|---|
| `mappers/api-mapper.ts` | ✓ Correct (§26.2 confirmed) | ✅ |
| ~~`api-schema.ts`~~ | ✗ Incorrect (sample was stale) | ❌ Rejected |

**Task:** None required — audit corrected in §26. Generator already emits to correct location.

**Lesson:** Always verify file paths in final output, don't assume from partial samples.

---

## TABLE 14: Type Declaration in TypeGenerator — Re-export Pattern (§5 Finding)

**Finding:** `TypeGenerator.ts` doesn't write to `api-read.ts` or `api-form.ts`, only re-exports them

| File | Generated By | Re-exported By |
|---|---|---|
| `types/api-read.ts` | `ZodTierGenerator.generateRead()` | `TypeGenerator.ts` (barrel) |
| `types/api-form.ts` | `ZodTierGenerator.generateForm()` | `TypeGenerator.ts` (barrel) |
| `types/index.ts` | `TypeGenerator.ts` | `IndexGenerator.ts` (barrel) |

**Verification:** Grep `TypeGenerator.ts` for `writeFile` — should only write to `types/index.ts`

**Task:** No change required. Pattern is correct re-export architecture.

---

## CHECKLIST: Before/After Verification

Use this checklist to verify each phase completion:

### Phase 1: IR Infrastructure
- [ ] `semantic-resolver.ts` created with `SemanticResolver.resolve()` method
- [ ] `semantic-resolver.ts` handles all 6 resource-resolution cases from audit
- [ ] `canonical-names.ts` created with CANONICAL_ACTION_MAP + SQL_TO_TYPE_MAP
- [ ] `canonical-names.ts` imported by all 6 generator files (search for old ACTION_MAP, should be zero results)
- [ ] `sync.ts` passes `compilerIR` to all generators
- [ ] Type definition `CompilerIR` satisfies all fields needed by Table 2-4 findings

### Phase 2: ZodTierGenerator Refactor
- [ ] `ZodTierGenerator.generate()` accepts `ir: CompilerIR` parameter
- [ ] `ZodTierGenerator.knownSchemas` removed completely
- [ ] All 6 `generate*` methods refactored to read from IR instead of inferring
- [ ] Test: Generate test manifest, diff output before/after — should be identical
- [ ] `mapSqlTypeToZod()` called only during IR phase, zero times in emit phase
- [ ] `mapSqlTypeToTs()` called only during IR phase, zero times in emit phase

### Phase 3: Other Generators
- [ ] `HookGenerator.resolveBaseResponseName()` deleted
- [ ] `HookGenerator.resolveResponseInfo()` deleted
- [ ] `SDKGenerator.getResponseInfo()` deleted
- [ ] All three generators accept `ir: CompilerIR` parameter
- [ ] Grep for remaining duplicate naming logic — should be zero in non-resolver files

### Phase 4: Consolidate Duplicates
- [ ] `contractResponseCount` logic removed from `generateContract()`
- [ ] `mapperAllRespCount` logic removed from `generateMapper()`
- [ ] Both generators use `ir.responseCountByGroup` instead
- [ ] Grep for duplicate manifest traversals — should be zero

### Phase 5: Bug Fixes
- [ ] Nested array indentation test case added, bug verified fixed
- [ ] `profile.put` and `profile.patch` merged to single `update` action
- [ ] Query key naming documented (intentional vs bug)

### Phase 6: Testing
- [ ] `semantic-resolver.test.ts` unit tests all pass
- [ ] `integration.test.ts` verifies name consistency across generators
- [ ] Regression test suite passes on real project manifest
- [ ] Line count: ZodTierGenerator reduced from 1890 → ~400 lines (if split)

---

## Code Search Commands

Use these to verify progress (run from repo root):

```bash
# Find remaining ACTION_MAP duplicates
grep -r "ACTION_MAP\|ACTION_IN_CRUD\|ACTION_TO_CRUD_HOOK\|SDK_ACTION_MAP" \
  packages/cli/src/generators/*.ts | grep -v "canonical-names"
# Expected: 0 results (all should be imports from canonical-names)

# Find remaining resource resolution logic
grep -r "resolveResourceName\|getResponseInfo\|resolveBaseResponseName\|resolveResponseInfo" \
  packages/cli/src/generators/*.ts | grep -v "semantic-resolver"
# Expected: 0 results (all should be only in semantic-resolver.ts)

# Find remaining type inference duplication
grep -r "mapSqlTypeToZod\|mapSqlTypeToTs\|mapCastToZod\|mapCastToTs" \
  packages/cli/src/generators/*.ts | grep -v "semantic-resolver"
# Expected: only in ZodTierGenerator for backward compat if needed, or 0 if fully moved to IR phase

# Verify CANONICAL_ACTION_MAP is imported everywhere
grep -r "CANONICAL_ACTION_MAP" packages/cli/src/generators/*.ts
# Expected: multiple results, all imports

# Find remaining knownSchemas references
grep -r "knownSchemas" packages/cli/src/generators/*.ts
# Expected: 0 results

# Verify generators accept ir: CompilerIR parameter
grep -r "ir: CompilerIR" packages/cli/src/generators/*.ts
# Expected: in ZodTierGenerator, HookGenerator, SDKGenerator, QueryKeyGenerator, ConstantsGenerator, etc
```

---

## Rollback Plan

If any phase fails:

1. **Checkpoint:** Before starting each phase, commit to branch (e.g., `refactor/phase-1`, `refactor/phase-2`)
2. **If regression detected:** `git reset --hard HEAD~1` to revert phase
3. **Investigate:** Determine root cause using tests
4. **Retry:** Re-implement with fix

**Key:** Keep phases independent so phase N failure doesn't invalidate phase N-1.

---

## Cross-Reference to Audit Document

| Audit Section | Finding | Implementation Phase |
|---|---|---|
| §0-§2 | ZodTierGenerator architecture overview | Background |
| §3 | Duplicate ACTION_MAP (6x) | Phase 1.2 |
| §3 | Duplicate resource resolution (6x) | Phase 1.1 |
| §3 | Duplicate manifest traversal (2x) | Phase 4 |
| §6 | Parallel type inference systems | Phase 1.1 |
| §7 | IR only scoped to ZodTierGenerator | Phase 1.3 + 2 + 3 |
| §8 | knownSchemas mutable state | Phase 2 |
| §10 | normalizeManifest result unused | Phase 1.3 |
| §12 | Scalability (incremental compilation) | Deferred post-MVP |
| §17 | Nested array indentation bug | Phase 5.1 |
| §19 | api-field.ts consumer verification | Verification only |
| §20 | api-schema.ts content | Unchanged |
| §24.3 | Duplicate action keys | Phase 5.2 |
| §26 | Form mapper location verification | Complete (false positive) |
| §28.5 | Query key singular/plural | Phase 5.3 |

