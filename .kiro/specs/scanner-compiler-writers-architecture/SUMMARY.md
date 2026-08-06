# Scanner-Compiler-Writers Architecture - Executive Summary

## The Problem

RouteSync's current architecture mixes concerns across the pipeline, creating multiple problems:

1. **LaravelRouteParser is 2000+ lines** combining fact extraction, type inference, and formatting
2. **Multiple sources of truth** - parser, compiler, and writers all have their own type resolution logic
3. **Tight coupling** - adding new writers requires changes to the parser
4. **Hard to test** - dependencies tangled across layers
5. **Difficult to maintain** - unclear which layer is responsible for what

## The Solution

**Refactor into a clean three-layer pipeline:**

```
Laravel Code
    ↓
┌─────────────────────────────────┐
│  SCANNER: Extract Facts         │
│  (No inference, just extraction)│
└──────────┬──────────────────────┘
           ↓
       RawManifest
           ↓
┌─────────────────────────────────┐
│  COMPILER: Semantic Analysis    │
│  (All inference happens here)   │
└──────────┬──────────────────────┘
           ↓
     ArtifactRegistry
    (Single Source of Truth)
           ↓
    ┌──────┴──────┬────────┬─────────┐
    ↓             ↓        ↓         ↓
TypeScript    Manifest  SDK      OpenAPI
Writer        Writer    Writer    Writer
    ↓             ↓        ↓         ↓
Output Files (Backend-specific)
```

## Key Benefits

| Benefit | Impact | How Achieved |
|---------|--------|--------------|
| **Single Source of Truth** | Eliminate inconsistencies | ArtifactRegistry stores all analysis results |
| **Separation of Concerns** | Easier to understand & modify | Each layer has one responsibility |
| **Testability** | Faster development & fewer bugs | Test each layer independently |
| **Extensibility** | Add writers without touching parser | Writers only depend on artifacts |
| **Maintainability** | Code easier to navigate | Clear component boundaries |
| **Performance** | Faster generation | Parallel pass execution, smart caching |

## Architecture Layers

### Layer 1: Scanner
**"Extract the facts"**

- Reads Laravel code and reflection metadata
- Produces `RawManifest` (deterministic JSON)
- **No type inference** - just raw data
- **No formatting** - just facts

**Output example:**
```json
{
  "routes": [{
    "name": "users.index",
    "method": "GET",
    "returnStatement": "return UserResource::collection(User::paginate());"
  }]
}
```

### Layer 2: Compiler
**"Understand the facts"**

- Runs 5+ analysis passes on `RawManifest`
- Each pass produces typed artifacts
- Uses compiler IR for proper PHP parsing
- Tracks confidence scores for inferred data

**Passes:**
1. ResponseAnalysisPass → ResponseArtifact
2. ResourceAnalysisPass → ResourceArtifact  
3. ValidationAnalysisPass → ValidationArtifact
4. ModelAnalysisPass → ModelArtifact
5. RouteAnalysisPass → RouteArtifact

**Output:** `ArtifactRegistry` (single source of truth)

### Layer 3: Writers
**"Use the facts to create output"**

- Consumes artifacts from registry
- Generates backend-specific code
- Can add new writers without changing parser/compiler

**Available writers:**
- ManifestWriter → routesync.manifest.json
- TypeScriptWriter → types.ts, api.ts, hooks.ts
- SDKWriter → client.ts
- OpenAPIWriter → openapi.json
- Custom writers (gRPC, GraphQL, etc.)

## Core Concepts

### RawManifest
```typescript
interface RawManifest {
  routes: RawRoute[]      // Just parsed data
  models: RawModel[]
  resources: RawResource[]
  validations: ValidationRule[]
  // NO type inference - that's the compiler's job
}
```

### Artifact Family
```typescript
// Each artifact type represents analysis results
ResponseArtifact        // Response type & shape
ValidationArtifact      // Form validation rules
ResourceArtifact        // Resource class metadata
ModelArtifact           // Database schema
RouteArtifact           // Complete route definition
```

### ArtifactRegistry
```typescript
// Central storage for all analysis results
registry.query<ResponseArtifact>('ResponseAnalysis')
registry.query<ValidationArtifact>('ValidationAnalysis')
// Writers read from here, not from parser
```

## Migration Path

### For End Users
No changes! CLI remains the same:
```bash
routesync generate --manifest manifest.json --output src/api
```

### Behind the Scenes
Old flow:
```
routes.php → Parser (does everything) → manifest.json → Writers
```

New flow:
```
routes.php → Scanner → RawManifest → Compiler → ArtifactRegistry → Writers → manifest.json
```

### Backward Compatibility
- `ManifestWriter` produces same `routesync.manifest.json` format
- Existing tools continue to work
- Optional new architecture access for advanced use

## Implementation Roadmap

### Phase 1: Infrastructure (Week 1-2)
- [ ] Define artifact types
- [ ] Create ArtifactRegistry
- [ ] Update PassManager for passes

### Phase 2: Scanner (Week 3-4)
- [ ] Extract Scanner interface
- [ ] Refactor LaravelRouteParser
- [ ] Create RawManifest format

### Phase 3: Compiler (Week 5-6)
- [ ] Implement analysis passes
- [ ] Create ResponseAnalysisPass
- [ ] Create ResourceAnalysisPass
- [ ] Create ValidationAnalysisPass

### Phase 4: Writers (Week 7-8)
- [ ] Create Writer interface
- [ ] Implement ManifestWriter
- [ ] Implement TypeScriptWriter
- [ ] Implement OpenAPIWriter

### Phase 5: Integration (Week 9-10)
- [ ] Update CLI
- [ ] Performance tuning
- [ ] Comprehensive testing
- [ ] Documentation

## Success Criteria

- ✅ LaravelRouteParser reduced from 2000 → 300 lines
- ✅ Each pass < 250 lines
- ✅ 95%+ test coverage
- ✅ Single source of truth validated
- ✅ Zero breaking CLI changes
- ✅ 10% faster generation time
- ✅ 20% memory reduction

## Design Principles

### 1. Separation of Concerns
Each layer has ONE job:
- Scanner: Extract
- Compiler: Analyze
- Writers: Generate

### 2. Single Source of Truth
Only one place for any analysis result: ArtifactRegistry

### 3. Type Safety
All artifacts are strongly-typed classes with validation

### 4. Extensibility
New writers don't require changes to parser/compiler

### 5. Testability
Each component independently testable

### 6. Performance
Smart caching + parallel execution + incremental compilation

## Integration Points

### With Existing CLI
```bash
# Old command still works
routesync generate --manifest manifest.json --output src/api

# New explicit pipeline (optional)
routesync scan --input routes/api.php
routesync compile --manifest manifest.raw.json
routesync write --artifacts artifacts.json --format typescript
```

### With Existing Passes
Reuses existing compiler infrastructure:
- PassManager for orchestration
- TypeSystem for type resolution
- SymbolTable for symbol management
- ArtifactCache for incremental compilation

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking existing CLI | ManifestWriter maintains old format |
| Performance regression | Parallel passes + caching |
| Type inference changes | Confidence scores show reasoning |
| Memory usage growth | Arena-based storage optimization |
| Scope creep | Phased rollout with feedback loops |

## Next Steps

1. **Review & Feedback** (1 week)
   - Architecture review with team
   - Identify any gaps or concerns
   - Refine design based on feedback

2. **Spike Prototype** (1 week)
   - Build minimal ResponseAnalysisPass
   - Verify artifact generation
   - Validate memory efficiency

3. **Full Implementation** (8 weeks)
   - Follow phased roadmap above
   - Maintain backward compatibility
   - Comprehensive testing

4. **Production Rollout** (2 weeks)
   - Beta testing with early adopters
   - Performance validation
   - Production deployment

## Questions & Discussions

### Q: Will this break existing workflows?
**A:** No. The new architecture runs alongside the old one. The CLI remains unchanged for end users.

### Q: How does this improve type inference?
**A:** All inference now happens in dedicated analysis passes using proper PHP parsing (StatementIRLayer), not regex. This enables more accurate and explainable results.

### Q: Can we add new writers without code changes?
**A:** Yes! Writers only depend on ArtifactRegistry. Add a new writer class and register it in the CLI. No parser/compiler changes needed.

### Q: What about performance?
**A:** Better performance through:
- Parallel pass execution (independent passes run concurrently)
- Smart caching (incremental compilation)
- Memory efficiency (Arena-based storage)
- Lazy loading (load only needed artifacts)

### Q: How do we handle backward compatibility?
**A:** ManifestWriter produces the same `routesync.manifest.json` format. All existing tools continue to work.

---

**Status:** Design Complete ✅  
**Next Phase:** Implementation Planning  
**Owner:** RouteSync Core Team
