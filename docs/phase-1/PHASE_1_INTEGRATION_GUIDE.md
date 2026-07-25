# Phase 1 Integration Guide

**Objective:** Integrate `canonical-names.ts` dan `semantic-resolver.ts` ke dalam existing codebase  
**Status:** Step-by-step implementation instructions  
**Estimated Time:** 4-6 hours

---

## Step 1: Copy Files to Repository

### 1.1 Create canonical-names.ts

File telah dibuat di: `/home/annas-zen/Documents/RouteSync/packages/cli/src/generators/canonical-names.ts`

**Actions:**
```bash
# Verify file exists
ls -lh packages/cli/src/generators/canonical-names.ts

# If not exists, copy from documentation
cp PHASE_1_STARTER_CODE.md packages/cli/src/generators/canonical-names.ts
# (Edit manual, ambil bagian "File 1: canonical-names.ts")
```

### 1.2 Create semantic-resolver.ts

File telah dibuat di: `/home/annas-zen/Documents/RouteSync/packages/cli/src/generators/semantic-resolver.ts`

**Actions:**
```bash
# Verify file exists
ls -lh packages/cli/src/generators/semantic-resolver.ts

# If not exists, copy from documentation
cp PHASE_1_STARTER_CODE.md packages/cli/src/generators/semantic-resolver.ts
# (Edit manual, ambil bagian "File 2: semantic-resolver.ts")
```

---

## Step 2: Update sync.ts

**File:** `packages/cli/src/sync.ts` (atau `packages/cli/src/generate.ts`, tergantung struktur)

### 2.1 Locate Current Code

Search untuk section yang memanggil `ZodTierGenerator.generate()`:

```bash
grep -n "ZodTierGenerator.generate\|normalizeManifest" packages/cli/src/sync.ts
```

Expected hasil (kurang lebih):
```
47: const normalizedManifest = normalizeManifest(manifest, kernel)
50: await ZodTierGenerator.generate(dir, manifest)
```

### 2.2 Apply Changes

**BEFORE:**
```typescript
// packages/cli/src/sync.ts (lines 47-50)

const normalizedManifest = normalizeManifest(manifest, kernel)
// ... other code ...
await ZodTierGenerator.generate(dir, manifest)
await HookGenerator.generate(dir, manifest)
await SDKGenerator.generate(dir, manifest)
```

**AFTER:**
```typescript
// packages/cli/src/sync.ts (lines 47-50)

import { SemanticResolver, type CompilerIR } from './generators/semantic-resolver'

// ... existing imports ...

const normalizedManifest = normalizeManifest(manifest, kernel)
const compilerIR = SemanticResolver.resolve(normalizedManifest)

// NEW: Pass compilerIR to ALL generators
await ZodTierGenerator.generate(dir, compilerIR, manifest)
await HookGenerator.generate(dir, compilerIR, manifest)
await SDKGenerator.generate(dir, compilerIR, manifest)
await QueryKeyGenerator.generate(dir, compilerIR, manifest)
await ConstantsGenerator.generate(dir, compilerIR, manifest)
```

### 2.3 Verify Changes

```bash
# Check syntax
npx tsc --noEmit packages/cli/src/sync.ts

# Search untuk normalizedManifest usage
grep -n "normalizedManifest" packages/cli/src/sync.ts
```

---

## Step 3: Update Generator Signatures

### 3.1 ZodTierGenerator

**Current:**
```typescript
export class ZodTierGenerator {
  static async generate(
    dir: string,
    manifest: RouteManifest
  ): Promise<void> {
    // ...
  }
}
```

**Change To:**
```typescript
import { type CompilerIR } from './semantic-resolver'

export class ZodTierGenerator {
  static async generate(
    dir: string,
    ir: CompilerIR,     // ← NEW parameter
    manifest: RouteManifest
  ): Promise<void> {
    // Implementation akan di-update di Phase 2
    // For now, just accept parameter but don't use it
    // (Jangan remove old inference logic yet)
  }
}
```

**Search untuk existing signature:**
```bash
grep -A 3 "static async generate" packages/cli/src/generators/ZodTierGenerator.ts | head -10
```

### 3.2 HookGenerator, SDKGenerator, QueryKeyGenerator, ConstantsGenerator

**Apply sama seperti ZodTierGenerator:**
```typescript
import { type CompilerIR } from './semantic-resolver'

export class HookGenerator {
  static async generate(
    dir: string,
    ir: CompilerIR,     // ← NEW parameter
    manifest: RouteManifest
  ): Promise<void> {
    // For now, accept but don't use
    // Akan di-update di Phase 3
  }
}
```

---

## Step 4: Replace Duplicate ACTION_MAP Definitions

### 4.1 Find All Duplicates

```bash
# Search untuk ACTION_MAP definitions
grep -n "ACTION_MAP\|ACTION_IN_CRUD\|ACTION_TO_CRUD_HOOK" \
  packages/cli/src/generators/*.ts
```

Expected hasil (kurang lebih):
```
ZodTierGenerator.ts:112: CONTRACT_ACTION_MAP = {
ZodTierGenerator.ts:200: SCHEMA_ACTION_MAP = {
ZodTierGenerator.ts:400: MAPPER_ACTION_MAP = {
ZodTierGenerator.ts:500: ACTION_IN_CRUD = {
HookGenerator.ts:35: ACTION_TO_CRUD_HOOK = {
SDKGenerator.ts:24: SDK_ACTION_MAP = {
```

### 4.2 Replace Each One

For each occurrence:

**BEFORE:**
```typescript
const CONTRACT_ACTION_MAP = {
  post: 'Create',
  put: 'Update',
  patch: 'Update',
  delete: 'Delete',
}
```

**AFTER:**
```typescript
import { CANONICAL_ACTION_MAP } from './canonical-names'

// Delete local definition, use import instead
```

### 4.3 Verify Replacement

```bash
# Should show ZERO results for old definitions
grep -n "CONTRACT_ACTION_MAP\|SCHEMA_ACTION_MAP\|MAPPER_ACTION_MAP\|SDK_ACTION_MAP\|ACTION_TO_CRUD_HOOK" \
  packages/cli/src/generators/*.ts

# Should show multiple imports
grep -n "from './canonical-names'" packages/cli/src/generators/*.ts
```

---

## Step 5: Compilation & Testing

### 5.1 Check TypeScript Compilation

```bash
# Build generator module
npx tsc --noEmit packages/cli/src/generators/*.ts

# Full project build
npm run build
```

### 5.2 Run Existing Tests

```bash
# Unit tests
npm test

# Generator tests specifically
npm test -- generators
```

### 5.3 Test Full Sync

```bash
# Create test route
# (gunakan test manifest dari routing.manifest.json atau create new test)

# Run routesync sync
npm run dev -- sync --manifest test-manifest.json

# Verify output files generated
ls -la generated/contract/
ls -la generated/types/
ls -la generated/mappers/
```

### 5.4 Diff Output (Regression Test)

```bash
# Generate output BEFORE any code change (save as baseline)
# cp generated-before/* backup/

# Generate output AFTER changes
# diff -r generated-before/ generated/

# Should show ZERO differences (output identical)
```

---

## Step 6: Verify Success Criteria

### Checklist:

- [ ] `canonical-names.ts` exists at `packages/cli/src/generators/canonical-names.ts`
- [ ] `semantic-resolver.ts` exists at `packages/cli/src/generators/semantic-resolver.ts`
- [ ] `sync.ts` imports both files
- [ ] `sync.ts` calls `SemanticResolver.resolve()` before generators
- [ ] All generators accept `ir: CompilerIR` parameter (signatures updated)
- [ ] TypeScript compilation succeeds (`npx tsc --noEmit`)
- [ ] All tests pass (`npm test`)
- [ ] Generator output identical before/after (regression test passes)
- [ ] No duplicate ACTION_MAP definitions remain (grep shows 0 results for old definitions)
- [ ] All imports use `CANONICAL_ACTION_MAP` from `canonical-names.ts`

---

## Step 7: Code Search Commands (for Verification)

Run these after changes to verify success:

```bash
# ✅ Should return MULTIPLE results (imports from canonical-names)
grep -r "import.*CANONICAL_ACTION_MAP" packages/cli/src/generators/

# ❌ Should return ZERO results (no local definitions)
grep -r "const.*ACTION_MAP\s*=" packages/cli/src/generators/ | grep -v "CANONICAL_ACTION_MAP"

# ❌ Should return ZERO results (old names)
grep -r "CONTRACT_ACTION_MAP\|SCHEMA_ACTION_MAP\|SDK_ACTION_MAP" \
  packages/cli/src/generators/ | grep -v "CANONICAL_ACTION_MAP"

# ✅ Should return entries for all 5 generators
grep -r "static async generate.*CompilerIR" packages/cli/src/generators/

# ✅ Should show SemanticResolver imported
grep -r "from './semantic-resolver'" packages/cli/src/

# ✅ Should show CompilerIR used
grep -r "SemanticResolver.resolve" packages/cli/src/
```

---

## Troubleshooting

### Issue 1: TypeScript Compilation Error

**Error:** `Cannot find module './canonical-names'`

**Solution:**
```bash
# Check file exists
ls packages/cli/src/generators/canonical-names.ts

# Check imports path is correct (relative path)
grep "from './canonical-names'" packages/cli/src/generators/*.ts

# Re-run build
npm run build
```

### Issue 2: Tests Failing

**Error:** `CANONICAL_ACTION_MAP is not defined`

**Solution:**
```bash
# Verify import statement
grep "import.*CANONICAL_ACTION_MAP" packages/cli/src/generators/*.ts

# Verify export exists
grep "export const CANONICAL_ACTION_MAP" packages/cli/src/generators/canonical-names.ts

# Check file syntax
npx tsc --noEmit packages/cli/src/generators/canonical-names.ts
```

### Issue 3: Output Files Different

**Error:** Generated files differ before/after changes

**Solution:**
- This should NOT happen in Phase 1 (we're only adding IR layer, not using it yet)
- Verify all generator signatures updated to accept `ir` parameter
- Verify generators don't use `ir` parameter yet (Phase 2 will use it)
- Check if old ACTION_MAP references remain (should be replaced)

---

## What's NOT Changed Yet (Phase 2 Will Do This)

These are intentionally NOT changed in Phase 1:

- ❌ Generator logic (still uses old inference)
- ❌ `knownSchemas` removal (still used by ZodTierGenerator)
- ❌ `resourceAliasing` consolidation (still 6 implementations)
- ❌ Type inference unification (still 2 systems)

**Phase 1 goal is infrastructure only:**
- ✅ Create IR infrastructure
- ✅ Pass IR to all generators
- ✅ Consolidate ACTION_MAP definitions
- ✅ Prepare for Phase 2 generator refactoring

---

## Next Phase

After Phase 1 verification passes:

1. **Commit** to branch `refactor/phase-1-ir-infrastructure`
2. **Create PR** untuk team review
3. **Merge** setelah approval
4. **Proceed to Phase 2**: Refactor ZodTierGenerator to USE CompilerIR

---

## Progress Tracking

| Step | Status | Notes |
|---|---|---|
| 1.1 - canonical-names.ts | ⏳ | File created, ready to copy |
| 1.2 - semantic-resolver.ts | ⏳ | File created, ready to copy |
| 2.x - sync.ts integration | ⏳ | Changes documented above |
| 3.x - Generator signatures | ⏳ | Instructions provided |
| 4.x - ACTION_MAP consolidation | ⏳ | Search/replace guide above |
| 5.x - Testing | ⏳ | Test commands provided |
| 6.x - Success verification | ⏳ | Checklist above |

---

## Estimated Timeline

- Step 1: 30 min (copy files)
- Step 2-3: 1 hour (update signatures)
- Step 4: 1 hour (replace duplicates, search/replace)
- Step 5-6: 2 hours (testing, verification)
- **Total: 4-6 hours**

---

## Success Confirmation

When done, you should see:

```
✅ TypeScript compilation: SUCCESS
✅ All tests: PASSING
✅ Generator output: IDENTICAL (regression test)
✅ ACTION_MAP duplicates: ZERO
✅ IR infrastructure: READY
⏳ Phase 2: Can proceed to generator refactoring
```

Then proceed to **IMPLEMENTATION_ROADMAP_DETAILED.md §2** for Phase 2.
