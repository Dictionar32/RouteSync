# SSOT Integration Guide

**Status**: Phase 1 Complete - Foundation Ready  
**Date**: August 3, 2026

## What Was Done

### Phase 1: Foundation
✅ Created `ResponseAnalysisPass` - Compiler pass that analyzes routes for response characteristics  
✅ Created `ResponseAnalysisHelper` - CLI integration helper to build ResponseArtifactMap from RouteManifest  
✅ ResponseArtifact already exists in compiler IR layer  
✅ Updated documentation with implementation plan

### How It Works

#### Step 1: Build ResponseArtifactMap (NEW)
```typescript
// In CLI layer (ZodTierGenerator, SDKEmitter, etc)
import { ResponseAnalysisHelper } from './response-analysis-helper'

const manifest = await scanLaravelRoutes(...)
const responseArtifactMap = ResponseAnalysisHelper.buildResponseArtifactMap(manifest)

// responseArtifactMap: Map<routeId, ResponseArtifact>
// Each ResponseArtifact contains:
// - .body.shape: 'single' | 'collection' | 'paginated'
// - .confidence: confidence score with reasons
// - .id: unique route response identifier
```

#### Step 2: Use ResponseArtifact Instead of Re-computing
```typescript
// OLD WAY (Multiple implementations):
const isCollection = !!respMeta.collection || !!respMeta.paginated || respMeta.type === 'collection'

// NEW WAY (Single source of truth):
const artifact = responseArtifactMap.get(route.name + '.Response')
const isCollection = artifact?.body?.shape === 'collection' || artifact?.body?.shape === 'paginated'
```

#### Step 3: Eliminate Duplicate Detection Logic
- ZodTierGenerator: Lines 342, 1241, 1449 - Remove collection detection
- SDKEmitter: Lines 315, 396 - Remove action name heuristic
- HookGenerator: Line 119 - Remove manual collection detection
- All read from same ResponseArtifact instead

## Integration Checklist

### For ZodTierGenerator
- [ ] Import ResponseAnalysisHelper
- [ ] Update constructor to accept responseArtifactMap
- [ ] Replace collection detection with artifact lookup (lines 342, 1241, 1449)
- [ ] Add tests to verify artifact-based approach
- [ ] Verify generated zod schemas are correct

### For SDKEmitter  
- [ ] Import ResponseAnalysisHelper
- [ ] Update constructor to accept responseArtifactMap
- [ ] Replace action name heuristic with artifact lookup (lines 315, 396)
- [ ] Remove code that assumes 'index' means collection
- [ ] Add tests for proper collection detection

### For HookGenerator
- [ ] Import ResponseAnalysisHelper
- [ ] Update collection detection to use artifacts (line 119)
- [ ] Verify hook signatures are correct

### For ContractGenerator (Main Orchestrator)
- [ ] Call ResponseAnalysisHelper.buildResponseArtifactMap() after manifest scan
- [ ] Pass responseArtifactMap to all generator constructors
- [ ] Update pass dependencies

## Benefits

### ✅ Single Source of Truth
- Collection detection logic lives in ONE place: ResponseAnalysisHelper
- All generators read the same ResponseArtifact
- Consistent behavior across all output formats

### ✅ No More Heuristics
- SDKEmitter no longer uses action name heuristics (e.g., 'index' means collection)
- Actual return type is analyzed, not guessed
- More reliable for non-REST APIs

### ✅ Eliminates Duplicate Logic
```
BEFORE: 7 implementations of collection detection
AFTER: 1 implementation (ResponseAnalysisHelper)
```

### ✅ Enables Caching & Incremental Builds
- ResponseArtifacts are immutable and hashable
- Can cache by artifact fingerprint
- Can detect affected routes on manifest change

### ✅ Enables Testing
- ResponseArtifacts can be unit tested independently
- Mock artifacts for testing generators
- No need to mock entire semantic analysis

## Testing Strategy

### Unit Tests
```typescript
// Test ResponseAnalysisHelper
describe('ResponseAnalysisHelper', () => {
  it('should detect collection from return type', () => {
    const route = { response: { collection: true, ... } }
    const artifacts = ResponseAnalysisHelper.buildResponseArtifactMap({ routes: [route] })
    expect(artifacts.get(route.name + '.Response').body.shape).toBe('collection')
  })
  
  it('should detect paginated as collection', () => {
    const route = { response: { paginated: true, ... } }
    const artifacts = ResponseAnalysisHelper.buildResponseArtifactMap({ routes: [route] })
    expect(artifacts.get(route.name + '.Response').body.shape).toBe('paginated')
  })
})

// Test ZodTierGenerator with artifacts
describe('ZodTierGenerator with SSOT', () => {
  it('should use ResponseArtifact for collection detection', () => {
    const responseMap = new Map([
      ['users.index.Response', createResponseArtifact({ shape: 'collection' })]
    ])
    const generator = new ZodTierGenerator(responseMap, ...)
    // Should generate array schema based on artifact, not action name
  })
})
```

### Integration Tests
```typescript
// End-to-end: manifest → artifacts → generated code
describe('SSOT Integration', () => {
  it('should generate consistent code across generators', async () => {
    const manifest = await scanTestLaravelApp()
    const artifacts = ResponseAnalysisHelper.buildResponseArtifactMap(manifest)
    
    const zodCode = await zodGenerator.generate(manifest, artifacts)
    const sdkCode = await sdkGenerator.generate(manifest, artifacts)
    
    // Both should agree on which endpoints return collections
    expect(zodCode).toContain('z.array(')
    expect(sdkCode).toContain('[] = ')
  })
})
```

## Next Steps

### Phase 2: Refactor Generators (Estimated: 1-2 days)
1. Update ZodTierGenerator to use ResponseArtifactMap
2. Update SDKEmitter to use ResponseArtifactMap
3. Update HookGenerator to use ResponseArtifactMap
4. Update tests

### Phase 3: Cleanup & Performance (Estimated: 1 day)
1. Remove duplicate collection detection logic
2. Remove semantic-resolver dependency from generators (where possible)
3. Performance benchmark to verify no regressions
4. Documentation update

### Phase 4: Priority 2 - Validation SSOT (Estimated: 2 days)
1. Create ValidationArtifact as SSOT for FormRequest rules
2. Create ValidationAnalysisPass
3. Update ZodTierGenerator to use ValidationArtifact

## Files Created/Modified

### Created
- ✅ `packages/core/src/compiler/passes/ResponseAnalysisPass.ts`
- ✅ `packages/cli/src/generators/response-analysis-helper.ts`

### To Modify (Phase 2)
- `packages/cli/src/generators/ZodTierGenerator.ts`
- `packages/cli/src/generators/layers/SDKEmitter.ts`
- `packages/cli/src/generators/HookGenerator.ts`
- `packages/cli/src/generators/ManifestGenerator.ts` (or similar orchestrator)

### Documentation
- ✅ `SSOT_CONSOLIDATION_PLAN.md`
- ✅ `SSOT_INTEGRATION_GUIDE.md` (this file)

## Key Principles Implemented

### Principle #1: Single Source of Truth ⭐⭐⭐⭐⭐
ResponseArtifact is the single source for:
- Collection vs single response
- Paginated vs non-paginated
- Response type (resource, model, object, primitive)
- Confidence scores

### Principle #2: Unidirectional Dependencies
```
Manifest Scan
    ↓
ResponseAnalysisHelper.buildResponseArtifactMap()
    ↓
ResponseArtifactMap (CompilationState)
    ↓
ZodTierGenerator (READ ONLY)
SDKEmitter (READ ONLY)
HookGenerator (READ ONLY)
```

### Principle #9: All Communication Via ArtifactRegistry
Generators communicate collection information through ResponseArtifact,
not through shared static methods or global state.

## Success Criteria

- [ ] ResponseAnalysisHelper correctly detects collections
- [ ] ZodTierGenerator uses ResponseArtifactMap (removes 3 detection implementations)
- [ ] SDKEmitter uses ResponseArtifactMap (removes action name heuristic)
- [ ] HookGenerator uses ResponseArtifactMap
- [ ] All tests pass (unit + integration + regression)
- [ ] No regressions in generated code
- [ ] Code ready for Phase 2 refactoring

## FAQ

**Q: Why not just use semantic-resolver output directly?**
A: SemanticResolver creates ResolvedResponse (another duplicate!). ResponseArtifact is compiler IR, cleanly separated from CLI layer concerns.

**Q: Why ResponseArtifactMap instead of PassManager?**
A: For Phase 1, we're integrating with existing CLI pattern. PassManager pattern will be introduced in Phase 2-3 as part of larger refactoring.

**Q: What about action name heuristics in SDKEmitter?**
A: They're being removed. The actual return type (from semantic analysis or manifest metadata) is what matters. Action names are just REST conventions.

**Q: How do we maintain backward compatibility?**
A: We don't break anything. Generators still take RouteManifest as input. We just add ResponseArtifactMap as an optional parameter initially, then make it required after all generators are updated.
