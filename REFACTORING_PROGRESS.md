# Pure End-to-End Dataflow Pipelines - Progress Tracking

**Target**: Refactor RouteSync dari imperative/procedural ke Pure Functional Dataflow Pipelines

**Tanggal Mulai**: 2026-09-07

---

## Status Saat Ini

### ✅ Sudah Selesai (Pre-existing)
- ✅ CompilerBridge sudah dalam bentuk pure functions (`compileManifest`, `emitFullBundle`, `emitCoreArtifacts`)
- ✅ Backward-compatible namespace `CompilerBridge` untuk tests
- ✅ Output lowerers sudah ada di `outputLowerers.ts`
- ✅ Pass functions sudah ada wrapper `lowerXxxArtifact()` functions
- ✅ `CoreFilesEmitter` dan `DEFAULT_CLIENT_EMITTERS` sudah terstruktur dengan baik

### ✅ Sudah Selesai

#### Step 1: Trace Actual Flow & Origin Boundary
**Status**: ✅ COMPLETE
**Completion Date**: 2026-09-07

**Temuan Audit**:

1. **CompilerBridge.ts**: ✅ Excellent - Sudah refactored, tidak perlu perubahan
   - Pure functions: `compileManifest()`, `emitFullBundle()`, `emitCoreArtifacts()`
   - Backward-compat namespace tersedia
   - Zero breaking changes needed

2. **outputLowerers.ts**: ✅ Good - Minor cleanup needed
   - Sudah pure functions
   - Unused `manifest` parameter di beberapa functions (diagnostic warning)

3. **Pass Functions**: ✅ Acceptable - KEEP AS IS
   - Pattern saat ini: Class dengan static singleton + pure wrapper function
   - Benefits: Dependency injection untuk testing, pure interface untuk callers
   - **Decision**: Tidak perlu refactor, pattern ini sudah baik

4. **route-classifier.ts**: ✅ Excellent
   - `classifyDomainGraph()` sudah deterministic
   - Zero heuristics, path-driven grouping
   - Tidak perlu perubahan

5. **Resource Groups**: 🔄 PERLU REFACTORING
   - ⚠️ Belum ada `ResourceGroupLoweringTrait`
   - 🎯 **Action Required**: Implement trait pada 5 descriptor classes

6. **HookGenerator.ts**: 🔄 CONFIRMED NEEDS REFACTORING
   - ❌ Line 158: `switch (group.kind)` dengan 5 cases
   - ❌ Line 184-194: Filtering loop `for (const route of group.all) { if (route.method === 'GET') continue; ... }`
   - ❌ Mutable `Set<string> handledActionKeys` untuk tracking
   - 🎯 **Action Required**: Replace dengan trait delegation

**Deliverable**: Comprehensive audit document → `STEP_1_AUDIT_SUMMARY.md`

---

### ✅ Sudah Selesai

#### Step 2: Determine Type Family
**Status**: ✅ COMPLETE
**Completion Date**: 2026-09-07

**Deliverable**: Type family design document → `STEP_2_TYPE_FAMILY_DESIGN.md`

**Key Outputs**:
1. **ResourceGroupLoweringTrait Interface** - Complete design dengan 2 methods:
   - `lowerQueryKeyBlock(): Iterable<string>`
   - `lowerCacheConfig(addInvs): Iterable<string>`

2. **Implementation Specs** untuk 5 descriptor variants:
   - ScannedFullCrudResourceGroupDescriptor
   - ScannedReadOnlyCrudResourceGroupDescriptor
   - ScannedFlexibleCrudResourceGroupDescriptor
   - ScannedSingletonResourceGroupDescriptor
   - ScannedCustomResourceGroupDescriptor

3. **Helper Method Design** - `lowerMutationSlot()` di base class

4. **Type-Level Guarantees** - Compile-time exhaustiveness checks

5. **Generator Refactoring Preview** - Before/after comparison

**Design Decisions**:
- ✅ Use `Iterable<string>` untuk zero-allocation streaming
- ✅ Shared helpers di abstract base class
- ✅ Self-projecting ADT pattern
- ✅ Type-safe dengan compile-time enforcement

---

### 🔄 Sedang Dikerjakan

#### Step 3: Type Vocabulary Design (TTD)
**Status**: 🟡 Ready to Start

### 📋 Belum Dikerjakan

#### Step 2: Determine Type Family
- [ ] Audit dan kategorisasi semua type families
- [ ] Verifikasi ADT variants

#### Step 3: Type Vocabulary Design (TTD)
- [ ] Update type exports di `packages/core/src/compiler/passes/index.ts`
- [ ] Update resource group types
- [ ] Update route descriptor types

#### Step 4: Type Contract Tests
- [ ] Buat `packages/sdk/tests/pureDataflowTypeContracts.spec.ts`
- [ ] Verifikasi pure functions (0 `new`, 0 IIFE, 0 `?`)
- [ ] Verifikasi resource groups implement trait
- [ ] Verifikasi zero `null` in routes

#### Step 5: Flow Tests & Origin Tests
- [ ] Flow tests untuk `compileManifest`
- [ ] Flow tests untuk `lowerXxxArtifact` functions
- [ ] Flow tests untuk `classifyDomainGraph`
- [ ] Flow tests untuk resource group lowering

#### Step 6: Refactor Implementation
- [ ] Refactor Pass functions ke pure functions
- [ ] Refactor Route Descriptors dengan explicit factories
- [ ] Refactor Resource Groups dengan lowering trait
- [ ] Update HookGenerator dan QueryKeyGenerator

#### Step 7: Run Regression Tests
- [ ] `npm run build`
- [ ] `cd packages/sdk && npx vitest run --reporter=verbose`
- [ ] Verifikasi 100% GREEN

#### Step 8: Compare Output Before vs After
- [ ] Generate test outputs
- [ ] Compare deterministic output
- [ ] Verify 100% identical structure

---

## Action Items - Prioritas Tinggi

### 1. Audit Route Classifier (Next)
**File**: `/home/annas-zen/Documents/RouteSync/packages/cli/src/generators/route-classifier.ts`
**Tujuan**: Memahami struktur resource groups saat ini

### 2. Audit Resource Group Descriptors
**File**: `/home/annas-zen/Documents/RouteSync/packages/core/src/types/domain/resourceGroupDescriptors.ts`
**Tujuan**: Memahami ADT variants dan determine lowering trait design

### 3. Audit HookGenerator & QueryKeyGenerator
**Files**: 
- `/home/annas-zen/Documents/RouteSync/packages/cli/src/generators/HookGenerator.ts`
- `/home/annas-zen/Documents/RouteSync/packages/cli/src/generators/QueryKeyGenerator.ts`
**Tujuan**: Identifikasi `switch` statements dan filtering logic yang perlu dieliminasi

---

## Notes & Decisions

### Design Decisions
- **Pure Functions over Classes**: Semua pass functions akan direfactor menjadi pure functions
- **Explicit over Implicit**: Route creation menggunakan explicit semantic factories
- **Non-nullable Contracts**: Semua `| null` dan `?` akan dieliminasi dengan sentinel values
- **Self-Projecting ADT**: Resource groups implement lowering methods, bukan external switch/if

### Technical Constraints
- **100% Backward Compatibility**: CompilerBridge namespace harus tetap berfungsi untuk existing tests
- **Zero Breaking Changes**: Output files harus identik sebelum dan sesudah refactoring
- **Performance**: Tidak boleh ada performance regression

---

## Metrics

### Code Quality Metrics (Target)
- 0 IIFE `(() => ...)()` in pipeline
- 0 `class` instantiation dengan `new` di pipeline orchestration
- 0 `?` optional parameters di pure transform functions
- 0 `null` di route parameters, policies, rate limits
- 0 `switch` statements di generators (diganti dengan self-projecting ADT)
- 0 multiple filtering `for` loops dengan nested `if (…) continue`

### Test Coverage
- Target: 100% GREEN pada semua 99 test files
- Zero regression failures
- Identical generated output

---

## Timeline Estimate

- **Step 1 (Audit)**: 1-2 hours - IN PROGRESS
- **Steps 2-3 (Type Design)**: 2-3 hours
- **Step 4 (Type Tests)**: 2-3 hours
- **Step 5 (Flow Tests)**: 2-3 hours
- **Step 6 (Implementation)**: 8-12 hours
- **Steps 7-8 (Verification)**: 2-3 hours

**Total**: ~20-30 hours

---

## References

- Main Plan: `/home/annas-zen/Documents/RouteSync/implementation_plan.md`
- Architecture Docs: `/home/annas-zen/Documents/RouteSync/docs/architecture/`
- Test Suite: `/home/annas-zen/Documents/RouteSync/packages/sdk/tests/`
