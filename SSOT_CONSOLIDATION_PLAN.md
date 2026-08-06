# SSOT Consolidation Implementation Plan

**Status**: Ready for implementation  
**Date**: August 3, 2026

## Executive Summary

The RouteSync codebase has 5 critical SSOT violations where information is computed and stored in multiple places, creating inconsistency and maintenance burden. This plan consolidates these violations by implementing the architecture principles from `large-codebase-architecture.md`.

## Priority 1: Response Type & Collection Detection (HIGHEST IMPACT)

### Current State: 7 Implementations of Collection Detection
- `packages/cli/src/generators/ZodTierGenerator.ts` (line 342): `const isCollection = !!respMeta.collection || !!respMeta.paginated`
- `packages/cli/src/generators/ZodTierGenerator.ts` (line 1241): duplicate check
- `packages/cli/src/generators/ZodTierGenerator.ts` (line 1449): duplicate check
- `packages/cli/src/generators/layers/SDKEmitter.ts` (line 315): `const isCollection = actionName === 'index'` (HEURISTIC!)
- `packages/cli/src/generators/layers/SDKEmitter.ts` (line 396): duplicate heuristic
- `packages/cli/src/generators/HookGenerator.ts` (line 119): `const isList = route.actionName === 'list' || route.crudRole === 'index'`
- `packages/cli/src/generators/semantic-resolver.ts` (ResolvedResponse): field computation

### Root Cause
1. **ResponseArtifact** exists but not used as SSOT
2. **Multiple information sources**:
   - Manifest metadata
   - Semantic resolver ResolvedResponse
   - SDKEmitter action name heuristic
   - ZodTierGenerator collection detection
3. **SDKEmitter uses WRONG source** (action name) instead of reading ResponseArtifact

### Solution Path

#### Phase 1: Enhance ResponseArtifact as SSOT (DONE PREVIOUSLY)
- ResponseArtifact already has `body.shape` field for 'single' | 'collection' | 'paginated'
- Has discriminated unions for type-safe access
- Has confidence scores and builder pattern
- **Status**: Ready to use

#### Phase 2: Create ResponseAnalysisPass (NEW)
Create pass that:
1. Reads parsed routes from RouteArtifact
2. Analyzes response characteristics:
   - Resource vs Model detection
   - Collection detection (from return type, not action name)
   - Pagination detection
3. Writes ResponseArtifact to CompilationState

#### Phase 3: Refactor ZodTierGenerator
- Remove duplicate collection detection (lines 342, 1241, 1449)
- Read collection status from ResponseArtifact instead
- One source of truth per endpoint

#### Phase 4: Refactor SDKEmitter
- Remove action name heuristic (lines 315, 396)
- Read isCollection from ResponseArtifact
- Fixes potential bugs where 'list' endpoints might be wrongly classified

#### Phase 5: Refactor HookGenerator
- Remove manual collection detection (line 119)
- Read from ResponseArtifact

### Implementation Sequence
1. Create `packages/core/src/compiler/passes/ResponseAnalysisPass.ts`
2. Update ResponseArtifact builder to be called from pass
3. Refactor ZodTierGenerator to read from state instead of re-compute
4. Refactor SDKEmitter to use ResponseArtifact
5. Refactor HookGenerator
6. Update tests to verify artifact-based approach

### Expected Outcome
- ✅ One source of truth: ResponseArtifact
- ✅ Collection detection consistent across all generators
- ✅ SDKEmitter no longer uses action name heuristics
- ✅ Eliminates duplicate logic (7 implementations → 1)
- ✅ Fixes potential bugs from inconsistent heuristics

---

## Priority 2: Validation Rules (HIGH)

### Current State
- Manifest stores FormRequest rules as strings
- ManifestEnricher attempts parsing
- SemanticResolver doesn't integrate validation
- ZodTierGenerator re-parses rules independently

### Solution
- Create `ValidationArtifact` as SSOT
- ValidationAnalysisPass parses rules once
- Emitters read from artifact

### Files to Modify
- Create: `packages/core/src/compiler/passes/ValidationAnalysisPass.ts`
- Create: `packages/core/src/compiler/artifacts/ValidationArtifactSet.ts`
- Update: `packages/cli/src/generators/ZodTierGenerator.ts`

---

## Priority 3: Model Schema (MEDIUM)

### Current State
- 4 representations: ModelArtifact, ParsedModel, ModelColumnResolver, EloquentRegistry

### Solution
- Consolidate to ModelArtifact as SSOT
- ModelMetadataPass extracts schema once
- All lookups go through artifact

---

## Priority 4: Route Metadata (MEDIUM)

### Current State
- 4 representations: ParsedRoute, ResolvedRoute, EndpointIR, ContractDefinition

### Solution
- Consolidate to RouteArtifact
- RouteAnalysisPass normalizes all routes

---

## Architecture Principles Applied

### 1. Single Source of Truth ⭐⭐⭐⭐⭐
- ResponseArtifact is THE source for response information
- No re-computing collection detection elsewhere
- All consumers read from artifact

### 2. Unidirectional Dependencies
```
Parser → RouteAnalysisPass → RouteArtifact
              ↓
        ResponseAnalysisPass → ResponseArtifact
              ↓
         ZodTierGenerator (reads artifact)
         SDKEmitter (reads artifact)
         HookGenerator (reads artifact)
```

### 3. Pass Architecture
- Each analysis has dedicated pass
- Passes only read/write artifacts
- PassManager orchestrates execution
- No pass calls another pass

### 4. All Communication Via ArtifactRegistry
- Generator layers communicate through CompilationState
- No direct function calls between generators
- Enables caching, incremental builds, parallelization

---

## Testing Strategy

### Unit Tests
- ResponseAnalysisPass correctly detects collections
- Validation detection from FormRequest rules
- Model schema extraction

### Integration Tests
- End-to-end: manifest → artifacts → generated code
- Verify collection detection consistent across generators
- Verify validation rules applied correctly

### Regression Tests
- Generated code still compiles
- Generated hooks have correct types
- API client works with generated types

---

## Rollout Plan

### Phase 1: Foundation (Week 1)
- Implement ResponseAnalysisPass
- Verify artifacts created correctly
- 80% test coverage

### Phase 2: Generator Refactoring (Week 2)
- Update ZodTierGenerator
- Update SDKEmitter
- Update HookGenerator
- Verify all tests pass

### Phase 3: Cleanup (Week 3)
- Remove duplicate logic
- Performance verify
- Documentation update

---

## Success Criteria

- ✅ Collection detected from artifact, not action name
- ✅ All generators use same ResponseArtifact
- ✅ No duplicate collection detection logic
- ✅ Tests pass with 85%+ coverage
- ✅ No regressions in generated code
- ✅ Code ready for Priority 2 work (Validation)

---

## Files to Create
1. `packages/core/src/compiler/passes/ResponseAnalysisPass.ts`
2. `packages/core/src/compiler/passes/ValidationAnalysisPass.ts` (Phase 2)
3. Tests for all new passes

## Files to Modify
1. `packages/cli/src/generators/ZodTierGenerator.ts`
2. `packages/cli/src/generators/layers/SDKEmitter.ts`
3. `packages/cli/src/generators/HookGenerator.ts`
4. `packages/core/src/compiler/ir/ResponseArtifact.ts` (enhance if needed)

## Files to Monitor
- `packages/cli/src/generators/semantic-resolver.ts` (phase out eventually)
- `packages/cli/src/generators/layers/utils/manifest-enricher.ts` (reduce dependencies)

---

## Next Step

Proceed with Phase 1: Create ResponseAnalysisPass as the foundation for consolidating collection detection.
