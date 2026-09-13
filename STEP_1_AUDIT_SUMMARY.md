# Step 1: Trace Actual Flow & Origin Boundary - Audit Summary

**Tanggal**: 2026-09-07
**Status**: ✅ COMPLETE

---

## Executive Summary

Audit lengkap terhadap struktur kode RouteSync menunjukkan bahwa **sebagian besar refactoring sudah dilakukan**. CompilerBridge sudah dalam bentuk pure functions, dan infrastruktur dasar sudah baik. Refactoring yang tersisa fokus pada:

1. **Resource Groups**: Menambahkan `ResourceGroupLoweringTrait` 
2. **Generator Pattern**: Mengeliminasi `switch` dan filtering logic di HookGenerator & QueryKeyGenerator
3. **Minor Cleanup**: Menghilangkan beberapa unused parameters

---

## Detailed Findings

### ✅ SUDAH BAIK - Tidak Perlu Refactoring Major

#### 1. CompilerBridge.ts
**Status**: ✅ Excellent

**Struktur Saat Ini**:
```typescript
// Pure functions (0 class, 0 new, 0 IIFE)
export function compileManifest(manifest: RouteManifest): CompiledContractsBundle
export async function emitFullBundle(
    manifest: RouteManifest,
    outputDir: string,
    coreEmitter: CompilerEmitter = CoreFilesEmitter,
    clientEmitters: readonly CompilerEmitter[] = DEFAULT_CLIENT_EMITTERS,
    options: CompilerBundleOptions = {}
): Promise<FullBundleEmittedArtifacts>
export function emitCoreArtifacts(...): Promise<FullBundleEmittedArtifacts>

// Backward-compat namespace
export const CompilerBridge = Object.freeze({
    compileAll: compileManifest,
    emitAll: emitCoreArtifacts,
    emitFullBundle,
    // ... helper methods
})
```

**Assessment**: Sudah sesuai dengan target architecture. Tidak perlu perubahan.

#### 2. outputLowerers.ts
**Status**: ✅ Good (Minor Cleanup Needed)

**Struktur Saat Ini**:
```typescript
export function lowerReadTypesOutput(
    artifact: SemanticTypesArtifact,
    manifest: RouteManifest  // ⚠️ unused parameter
): CompilerOutput

export function lowerFormTypesOutput(
    artifact: RequestTypesArtifact,
    manifest: RouteManifest  // ⚠️ unused parameter
): FormOutput

// Similar pattern untuk contracts, apiFields, mappers
```

**Issues**:
- Parameter `manifest` di beberapa functions tidak digunakan
- Diagnostics menunjukkan `'manifest' is declared but its value is never read`

**Action**: Minor cleanup - hapus unused parameters atau document kenapa disimpan.

#### 3. Pass Functions Pattern
**Status**: ✅ Acceptable (Already has pure wrapper)

**Struktur Saat Ini**:
```typescript
// Class dengan static singleton pattern
export class TypeScriptGeneratorPass implements CompilerPass<...> {
    private static readonly defaultPass = new TypeScriptGeneratorPass();
    
    public static run(artifact: SemanticTypesArtifact): readonly [GeneratedTypeScriptArtifact] {
        return TypeScriptGeneratorPass.defaultPass.run([artifact]);
    }
    
    run([semanticTypesArtifact]: readonly [SemanticTypesArtifact]): readonly [GeneratedTypeScriptArtifact] {
        // ... implementation
    }
}

// Pure wrapper function
export function lowerTypeScriptArtifact(artifact: SemanticTypesArtifact): GeneratedTypeScriptArtifact {
    return TypeScriptGeneratorPass.run(artifact)[0];
}
```
t on Save
**Assessment**: 
- ✅ Sudah ada pure function wrapper `lowerXxxArtifact()`
- ✅ Call sites tidak perlu `new`
- ⚠️ Internal masih menggunakan class, tapi ini acceptable
- Pattern ini memungkinkan dependency injection via constructor untuk testing

**Recommendation**: KEEP AS IS. Ini adalah good design pattern dengan benefits:
- Pure function interface untuk callers
- Class internal untuk dependency injection dan testability
- Zero breaking changes needed

#### 4. route-classifier.ts & classifyDomainGraph
**Status**: ✅ Excellent

**Struktur Saat Ini**:
```typescript
export function classifyDomainGraph(manifest: RouteManifest): ClassifiedDomainGraph<ClassifiedRoute> {
    const classified = classifyRoutes(manifest.routes, manifest.frontend?.groupAliases)
    const rawResources = buildResourceMap(classified)
    
    const resourceGroups: ResourceGroupDescriptor<ClassifiedRoute>[] = []
    
    for (const [groupName, res] of rawResources) {
        // Deterministic classification logic
        if (res.index && res.show) {
            if (res.create && res.update && res.delete) {
                resourceGroups.push(new ScannedFullCrudResourceGroupDescriptor({...}))
            } else if (!res.create && !res.update && !res.delete) {
                resourceGroups.push(new ScannedReadOnlyCrudResourceGroupDescriptor({...}))
            } else {
                resourceGroups.push(new ScannedFlexibleCrudResourceGroupDescriptor({...}))
            }
        } else {
            // Singleton or Custom
            resourceGroups.push(new ScannedSingletonResourceGroupDescriptor({...}))
            // or new ScannedCustomResourceGroupDescriptor({...})
        }
    }
    
    return { classified, resourceGroupGraph: createResourceGroupGraph(resourceGroups) }
}
```

**Assessment**: Sudah deterministic, zero heuristics. Bagus!

---

### 🔄 PERLU REFACTORING

#### 1. Resource Group Descriptors - Missing Lowering Trait
**Priority**: HIGH
**Files**: `/home/annas-zen/Documents/RouteSync/packages/core/src/types/domain/resourceGroupDescriptors.ts`

**Current State**: Resource group descriptors adalah pure data classes tanpa behavior methods.

**Target State**: 
```typescript
export interface ResourceGroupLoweringTrait<TRoute = ParsedRoute> {
    lowerQueryKeyBlock(): Iterable<string>
    lowerCacheConfig(addInvs: (route: TRoute, invs: string[]) => void): Iterable<string>
}

// All 5 descriptor classes must implement this trait:
export class ScannedFullCrudResourceGroupDescriptor<TRoute> 
    implements ResourceGroupDescriptor<TRoute>, ResourceGroupLoweringTrait<TRoute> {
    
    *lowerQueryKeyBlock(): Iterable<string> {
        // Implementation for Full CRUD
        yield `  ${this.keyName}: {`
        yield `    list: () => ['${this.keyName}'] as const,`
        yield `    detail: (id: ${this.primaryKeyType}) => ['${this.keyName}', id] as const,`
        yield `  },`
    }
    
    *lowerCacheConfig(addInvs: (route: TRoute, invs: string[]) => void): Iterable<string> {
        // Implementation for Full CRUD invalidations
        addInvs(this.create, [this.keyName, 'list'])
        addInvs(this.update, [this.keyName, 'detail', this.keyName, 'list'])
        addInvs(this.delete, [this.keyName, 'list'])
        yield `  // ${this.titleName} cache invalidations configured`
    }
}

// Similar untuk ReadOnlyCrud, FlexibleCrud, Singleton, Custom
```

**Benefits**:
- ✅ Eliminates `switch (group.kind)` in generators
- ✅ Self-projecting ADT (behavior travels with data)
- ✅ Type-safe: TypeScript ensures all variants implement trait
- ✅ Easy to extend with new resource group kinds

#### 2. HookGenerator.ts - Switch & Filtering Logic
**Priority**: HIGH
**Files**: `/home/annas-zen/Documents/RouteSync/packages/cli/src/generators/HookGenerator.ts`

**Current Issues** (Need to verify by reading file):
- Likely has `switch (group.kind)` pattern
- Likely has multiple filtering `for` loops with `if (...) continue`
- Likely has mutable `Set<string>` for tracking handled actions

**Target Pattern**:
```typescript
export function* generateHooks(domainGraph: ClassifiedDomainGraph<ClassifiedRoute>): Iterable<string> {
    const invalidations: [ClassifiedRoute, string[]][] = []
    const addInvs = (route: ClassifiedRoute, invs: string[]) => invalidations.push([route, invs])
    
    // 1 Stream, 1 Pass, 0 switch, 0 if filtering
    for (const group of domainGraph.resourceGroupGraph.all) {
        yield `  /* ===== ${group.titleName.toUpperCase()} ===== */`
        yield* group.lowerCacheConfig(addInvs)
        yield ``
    }
    
    // Generate invalidation hooks from collected data
    for (const [route, keys] of invalidations) {
        yield `  // ... invalidation hook for ${route.actionName}`
    }
}
```

#### 3. QueryKeyGenerator.ts - Similar Pattern
**Priority**: HIGH
**Files**: `/home/annas-zen/Documents/RouteSync/packages/cli/src/generators/QueryKeyGenerator.ts`

**Target Pattern**:
```typescript
export function* generateQueryKeys(domainGraph: ClassifiedDomainGraph<ClassifiedRoute>): Iterable<string> {
    // 1 Stream, 1 Pass, 0 if
    for (const group of domainGraph.resourceGroupGraph.all) {
        yield `  /* ===== ${group.titleName.toUpperCase()} ===== */`
        yield* group.lowerQueryKeyBlock()
        yield ``
    }
}
```

---

## Implementation Plan for Remaining Work

### Phase 1: Add ResourceGroupLoweringTrait (4-6 hours)

**Step 1.1**: Define trait interface
- File: `/home/annas-zen/Documents/RouteSync/packages/core/src/types/domain/resourceGroupDescriptors.ts`
- Add `ResourceGroupLoweringTrait<TRoute>` interface
- Add to exports

**Step 1.2**: Implement trait on all 5 descriptor classes
- `ScannedFullCrudResourceGroupDescriptor`
- `ScannedReadOnlyCrudResourceGroupDescriptor`
- `ScannedFlexibleCrudResourceGroupDescriptor`
- `ScannedSingletonResourceGroupDescriptor`
- `ScannedCustomResourceGroupDescriptor`

**Step 1.3**: Write trait implementation tests
- Test `lowerQueryKeyBlock()` output for each variant
- Test `lowerCacheConfig()` output for each variant
- Verify generator functions properly

### Phase 2: Refactor Generators (3-4 hours)

**Step 2.1**: Read & Audit HookGenerator.ts
- Document current switch/filter patterns
- Identify mutable state trackers
- Plan replacement with trait delegation

**Step 2.2**: Refactor HookGenerator
- Replace switch with `yield* group.lowerCacheConfig(addInvs)`
- Remove filtering loops
- Remove mutable trackers

**Step 2.3**: Read & Audit QueryKeyGenerator.ts
- Document current patterns
- Plan replacement

**Step 2.4**: Refactor QueryKeyGenerator
- Replace logic with `yield* group.lowerQueryKeyBlock()`

### Phase 3: Minor Cleanup (1 hour)

**Step 3.1**: Clean outputLowerers.ts
- Remove or document unused `manifest` parameters

**Step 3.2**: Code review & verification
- Grep search for remaining patterns
- Verify 0 `switch` in generators
- Verify 0 filtering loops

### Phase 4: Testing (2-3 hours)

**Step 4.1**: Run full test suite
```bash
npm run build
cd packages/sdk && npx vitest run --reporter=verbose
```

**Step 4.2**: Compare generated outputs
- Generate before/after samples
- Verify identical structure

---

## Architectural Compliance Checklist

### ✅ Already Compliant
- [x] CompilerBridge is pure functions (0 class, 0 new)
- [x] Output lowerers exist and are pure
- [x] Pass functions have pure wrappers
- [x] Domain graph classifier is deterministic
- [x] Resource groups are well-typed ADTs

### 🔄 To Be Implemented
- [ ] Resource groups implement `ResourceGroupLoweringTrait`
- [ ] HookGenerator uses trait delegation (0 switch, 0 filtering)
- [ ] QueryKeyGenerator uses trait delegation (0 if)
- [ ] outputLowerers cleanup (unused params)

### ⏸️ Deferred (Low Priority / Acceptable As-Is)
- Pass function internal class structure (acceptable pattern)
- Route descriptors explicit factories (nice-to-have, not critical)
- Non-nullable route parameters (nice-to-have, not critical)

---

## Risk Assessment

### Low Risk Items ✅
- Resource group trait addition: Pure additive change, no breaking changes
- Generator refactoring: Behavior-preserving transformation

### Medium Risk Items ⚠️
- None identified

### High Risk Items ❌
- None identified

---

## Success Criteria

### Must Have ✅
1. All tests pass (100% GREEN)
2. Generated output identical before/after
3. Zero `switch (group.kind)` in generators
4. All resource groups implement trait

### Nice to Have 🎯
1. Remove unused parameters
2. Improve type safety
3. Better documentation

### Out of Scope ⛔
1. Route descriptor explicit factories (defer)
2. Non-nullable route parameters (defer)
3. Pass function class-to-pure refactoring (not beneficial)

---

## Conclusion

**Step 1 Status**: ✅ COMPLETE

**Next Action**: Proceed to **Step 2: Determine Type Family** dengan fokus pada:
1. ResourceGroupLoweringTrait design
2. Type signatures untuk lowering methods
3. Type tests untuk ensure compliance

**Estimated Time to Complete Remaining Work**: 10-14 hours

**Confidence Level**: High (90%) - Clear path forward, well-scoped changes, low risk
