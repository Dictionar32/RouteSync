# Phase 2 Integration Steps

**Tujuan**: Integrate refactored emitters ke dalam production pipeline  
**Waktu Estimasi**: ~45 menit  
**Risk Level**: 🟢 LOW

---

## Step 1: Verify Current Implementation (5 min)

### 1.1 Check All Emitter Files Exist

```bash
cd /home/annas-zen/Documents/RouteSync

# Verify layer files
ls -la packages/cli/src/generators/layers/
# Expected: types.ts, helpers.ts, ContractEmitter.ts, SchemaEmitter.ts, FieldEmitter.ts, ReadEmitter.ts, MapperEmitter.ts

# Verify orchestrator
ls -la packages/cli/src/generators/ZodTierGeneratorRefactored.ts

# Verify test file
ls -la packages/cli/src/generators/__tests__/emitters.integration.test.ts
```

### 1.2 Run TypeScript Validation

```bash
npx tsc --noEmit packages/cli/src/generators/layers/*.ts packages/cli/src/generators/ZodTierGeneratorRefactored.ts
# Expected: No errors
```

### 1.3 Verify No `any` Types

```bash
grep -r " any" packages/cli/src/generators/layers/
grep -r " any" packages/cli/src/generators/ZodTierGeneratorRefactored.ts
# Expected: No matches (or only in comments)
```

---

## Step 2: Update Main ZodTierGenerator (10 min)

### 2.1 Create Adapter/Wrapper

Update `ZodTierGenerator.ts` untuk delegate ke refactored emitters:

```typescript
// packages/cli/src/generators/ZodTierGenerator.ts

import { ZodTierGeneratorRefactored } from './ZodTierGeneratorRefactored'
import { ContractEmitter } from './layers/ContractEmitter'
import { ReadEmitter } from './layers/ReadEmitter'
import { SchemaEmitter } from './layers/SchemaEmitter'
import { FieldEmitter } from './layers/FieldEmitter'
import { MapperEmitter } from './layers/MapperEmitter'

export class ZodTierGenerator {
  static async generate(outputDir: string, context: LayerContext): Promise<void> {
    // Use refactored emitters
    await ZodTierGeneratorRefactored.generate(outputDir, context)
  }
}
```

### 2.2 Verify Exports Compatibility

Make sure `ZodTierGeneratorRefactored.generate()` signature matches current code calling pattern:

**Current calling code** (expected):
```typescript
import { ZodTierGenerator } from './generators/ZodTierGenerator'

await ZodTierGenerator.generate(outputDir, context)
```

**ZodTierGeneratorRefactored implementation** harus support ini.

---

## Step 3: Build & Test (15 min)

### 3.1 Clean Build

```bash
cd /home/annas-zen/Documents/RouteSync

# Clean previous build
npm run clean

# Build project
npm run build
# Expected: Build succeeds without errors
```

### 3.2 Run Test Suite

```bash
# Run integration tests
npm test -- emitters.integration.test.ts --run

# Or run all tests
npm test -- --run
```

### 3.3 Check Output Files

Jika build sukses, verifikasi output files dihasilkan:

```bash
# Check if emitter output files exist
ls -la dist/contract/
ls -la dist/types/
ls -la dist/mappers/

# Inspect one file untuk verify quality
head -30 dist/contract/api-contract.ts
```

---

## Step 4: Regression Testing (15 min)

### 4.1 Compare dengan Original (if maintaining both)

Jika masih ingin maintain original `ZodTierGenerator.ts` untuk comparison:

```bash
# Keep copy of original
cp packages/cli/src/generators/ZodTierGenerator.ts ZodTierGenerator.ORIGINAL.ts

# Generate with both implementations
# Compare output files line-by-line

diff -u original-output/contract/api-contract.ts new-output/contract/api-contract.ts
```

### 4.2 Verify Output Quality

For each emitter output, check:

```bash
# ✅ Valid TypeScript syntax
npx tsc --noEmit dist/contract/api-contract.ts
npx tsc --noEmit dist/types/api-read.ts

# ✅ No `any` types
grep " any" dist/contract/api-contract.ts
grep " any" dist/types/api-read.ts

# ✅ Check file sizes (should be reasonable)
wc -l dist/contract/*.ts dist/types/*.ts dist/mappers/*.ts
```

### 4.3 Test Data Processing

With real `routesync.manifest.json`:

```bash
# Verify manifest loads correctly
node -e "const m = require('./routesync.manifest.json'); console.log('Routes:', m.routes?.length, 'Models:', m.models?.length)"

# Run emitters against real manifest
# (test infrastructure dari Step 3)
```

---

## Step 5: Documentation Update (5 min)

### 5.1 Update PHASE_2_COMPLETION_REPORT.md

Add section:
```markdown
## Integration Completed

- ✅ Emitters integrated into main ZodTierGenerator
- ✅ All tests passing
- ✅ Output verified against manifest
- ✅ Performance baseline established
```

### 5.2 Update README

Add note about Phase 2 architecture:
```markdown
## Architecture

The generator uses a **layered emitter pattern** for code generation:

- **ContractEmitter**: Generates Zod schemas for backend responses
- **ReadEmitter**: Generates TypeScript interfaces for frontend
- **MapperEmitter**: Generates transform functions
- **SchemaEmitter**: Generates form validation schemas
- **FieldEmitter**: Generates field metadata

This architecture ensures single source of truth (IR) for type inference.
See PHASE_2_COMPLETION_REPORT.md for details.
```

---

## Step 6: Deployment (5 min)

### 6.1 Choose Deployment Strategy

**Option A: Immediate (Recommended if tests pass)**
```bash
# Commit changes
git add packages/cli/src/generators/layers/
git add packages/cli/src/generators/ZodTierGeneratorRefactored.ts
git add packages/cli/src/generators/ZodTierGenerator.ts  # (if updated)
git commit -m "feat: phase 2 - integrate refactored emitters"

# Deploy
npm publish
```

**Option B: Gradual (if needed)**
```bash
# Keep both implementations during transition period
# Original ZodTierGenerator as fallback
# Refactored as primary
# Can switch via environment variable
```

### 6.2 Tag Release

```bash
git tag -a v1.0.50 -m "Phase 2: Refactored emitters - single source of truth IR pattern"
git push origin v1.0.50
```

---

## Troubleshooting

### Issue: Test Failures

**Symptom**: `npm test` reports failures  
**Solution**:
1. Check test error message untuk specific failing test
2. Update test mock data jika manifest format berubah
3. Verify emitter implementation mengikuti LayerContext interface

### Issue: Build Errors

**Symptom**: `npm run build` fails  
**Solution**:
1. Run `npx tsc --noEmit` untuk lihat type errors
2. Check import paths (relative imports correct?)
3. Verify all dependencies imported (`fs-extra`, `path`, etc)

### Issue: Output Quality

**Symptom**: Generated code has `any` types atau invalid TypeScript  
**Solution**:
1. Check emitter helper functions (mapSqlTypeToZod, mapSqlTypeToTs)
2. Verify no unsafe type assertions (`as` yang bukan `as const`)
3. Debug specific route/model causing issue dengan console logs

---

## Validation Checklist

Before final deployment:

- [ ] All TypeScript files compile without errors
- [ ] No `any` types dalam generated output
- [ ] All tests passing (npm test -- --run)
- [ ] Output files generated correctly
- [ ] File sizes reasonable (not duplicating content)
- [ ] Performance same or better than original
- [ ] Documentation updated
- [ ] Commit message clear dan descriptive

---

## Expected Timeline

| Step | Time | Status |
|------|------|--------|
| 1. Verification | 5 min | 🟢 Ready |
| 2. ZodTierGenerator Update | 10 min | 🟡 In Progress |
| 3. Build & Test | 15 min | 🟡 Pending Build |
| 4. Regression Testing | 15 min | 🟡 Pending |
| 5. Documentation | 5 min | 🟡 Pending |
| 6. Deployment | 5 min | 🟡 Pending |
| **TOTAL** | **~45 min** | |

---

## Success Criteria ✅

Integration is successful when:

1. ✅ All TypeScript files compile
2. ✅ All tests pass
3. ✅ Generated code has zero `any` types
4. ✅ routeResponseMap immutability maintained
5. ✅ Output files generated in correct directories
6. ✅ Performance unchanged or improved
7. ✅ Documentation updated
8. ✅ Changes committed and tagged

---

## Next Phase (Phase 3)

After Phase 2 integration complete, consider:

### 3.1: Consolidate Duplicate Naming Derivations

**Current Duplications**:
- `HookGenerator.ts` - re-derives naming from routes
- `SDKGenerator.ts` - re-derives naming and response info
- `QueryKeyGenerator.ts` - re-derives naming

**Phase 3 Goal**: Centralize all naming derivations, pass as IR parameter

### 3.2: Form Mapper Split

**Current**: `generateForm()` masih di `ZodTierGenerator.ts`  
**Phase 3 Goal**: Extract ke `FormEmitter.ts` (similar pattern)

### 3.3: Performance Optimization

**Measure**: Baseline performance sekarang  
**Optimize**: Cache semantic decisions, parallel emitter execution

---

## Questions?

Refer to:
- `PHASE_2_COMPLETION_REPORT.md` - Architecture overview
- `PHASE_2_FILES_CREATED.md` - File-by-file breakdown
- `Engine.FIx.md` - Deep architecture analysis with examples

