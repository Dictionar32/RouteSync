# Architecture Selection: compiler-based-parser-refactoring

## Recommended Architecture: Layer-Oriented dengan Explicit Persistence

### Rationale

Candidate C dipilih karena memiliki **lowest coupling metrics** (fan-in/fan-out 3/3), **best state distribution** (god object score 30%), dan **structural enforcement** terhadap phase dependencies melalui layer boundaries. Trade-off utamanya adalah slightly higher initial complexity (7 components vs 6) dan kebutuhan persistence setup, namun ini terbayar dengan **incremental compilation capability** dan **long-term scalability**.

### Components

| Component | Owned State | Responsibility |
|-----------|-------------|----------------|
| **InputLayer** | PHP source strings | Read method source code dari Laravel reflection API |
| **TokenizationLayer** | Token sequences | PHP tokenization menggunakan compiler's Lexer |
| **StatementIRLayer** | Statement IR (assign/call/return) | Parse tokens ke structured IR menggunakan compiler's SemanticIR |
| **SemanticLayer** | Symbol table + Type environment | Type resolution menggunakan compiler's SymbolTable & TypeSystem |
| **PersistenceLayer** | SQLite/file-based cache | Store analysis results menggunakan compiler's ArtifactCache |
| **AnalysisEngine** | Analysis rules (Laravel-specific) | Apply resolution rules menggunakan compiler's AnalysisManager |
| **OutputAdapter** | Response metadata | Format analysis results ke manifest.json format |

### Information Flow

| From \ To | Input | Tokenize | StmtIR | Semantic | Persist | AnalysisEng | OutputAdapt |
|-----------|-------|----------|--------|----------|---------|-------------|-------------|
| Input | | → | | | | | |
| Tokenize | | | → | | | | |
| StmtIR | | | | → | ← | | |
| Semantic | | | | | ↔ | ← | |
| Persist | | | ← | ↔ | | ← | |
| AnalysisEng | | | | → | → | | |
| OutputAdapt | | | | ← | | | |

**Legend:** → = synchronous call, ↔ = bidirectional dependency

### Requirement Allocation

| Requirement | Component(s) |
|-------------|--------------|
| REQ-1: Parse statements | TokenizationLayer, StatementIRLayer |
| REQ-2: Build symbol table | SemanticLayer |
| REQ-3: Track assignments | StatementIRLayer |
| REQ-4: Resolve aliases | AnalysisEngine, SemanticLayer |
| REQ-5: Infer expression types | AnalysisEngine |
| REQ-6: Resolve return types | AnalysisEngine, OutputAdapter |
| REQ-7: Handle Resources | AnalysisEngine |
| REQ-8: Handle bare models | AnalysisEngine |
| REQ-9: Handle array returns | StatementIRLayer, AnalysisEngine |

### Key Design-Induced Invariants

**DINV-1: Layer Unidirectionality**
- Information flow HARUS dari lower layer ke higher layer (Input → Tokenize → StmtIR → Semantic)
- Prevents: Components skipping layers and creating tight coupling
- Enforced by: Module dependency constraints

**DINV-2: Persistence Transparency**
- Components di atas PersistenceLayer tidak boleh aware of cache implementation details
- Prevents: Direct database coupling throughout the codebase
- Enforced by: PersistenceLayer interface abstraction

**DINV-3: Analysis Rule Isolation**
- Each analysis rule di AnalysisEngine harus independen (tidak depend on execution order)
- Prevents: Brittle rule dependencies that break when reordered
- Enforced by: AnalysisEngine scheduler

**DINV-4: IR Immutability**
- StatementIR once created tidak boleh di-modify oleh layers di atasnya
- Prevents: Concurrent modification bugs dan unpredictable analysis results
- Enforced by: TypeScript readonly types

### Alternatives Considered

| Candidate | Strength | Weakness | Why Not Selected |
|-----------|----------|----------|-----------------|
| **A: Entity-Oriented** | Proven compiler architecture pattern, clear separation of concerns, reusable TypeResolver | Cross-cutting invariants 43% (highest), ArtifactRegistry approaching god object (40%), requires PassManager complexity | Coordination overhead terlalu tinggi untuk use case ini; tidak memberikan incremental compilation benefit |
| **B: Use-Case Oriented** | Lowest cross-cutting requirements (11%), practical for incremental refactoring, single entry point | 2 synchronous cycles involving cache (risk invalidation bugs), PHPMethodAnalyzer could become bottleneck, less flexible for new analysis passes | Sync cycles dengan CacheLayer dan kurang flexibility untuk future expansion. Lebih cocok untuk quick wins, bukan long-term architecture |

### Metrics Summary

| Metric | Selected (C) | Alt A | Alt B |
|--------|--------------|-------|-------|
| Cross-cutting reqs % | 22% | 22% | **11%** |
| Cross-cutting invariants % | **29%** | 43% | **29%** |
| Flow density | **0.29** | **0.29** | 0.37 |
| God object score | **30%** | 40% | 35% |
| Sync cycles | **1** | **1** | 2 |
| Max fan-in | **3** | 6 | 4 |
| Max fan-out | **3** | 6 | 5 |
| Evolvability cost | **1** | 2 | **1** |

**Legend:** Bold = Best score in that metric

---

## Integration dengan Existing Compiler Infrastructure

### Component Mapping ke Existing Code

| New Component | Existing Compiler Equivalent | Status | Integration Path |
|---------------|------------------------------|--------|------------------|
| **InputLayer** | N/A (Laravel-specific) | **NEW** | Wrap existing LaravelRouteParser file reading logic |
| **TokenizationLayer** | `compiler/Lexer` + `compiler/Arena` | **REUSE** | Use existing tokenization infrastructure |
| **StatementIRLayer** | `compiler/ir/SemanticIR` nodes | **REUSE** | Map PHP statements to existing IR node types |
| **SemanticLayer** | `compiler/artifacts/SymbolTable` + `compiler/types/TypeSystem` | **REUSE** | Use existing symbol table & type inference |
| **PersistenceLayer** | `compiler/cache/ArtifactCache` + `compiler/query/QueryDatabase` | **REUSE** | Leverage existing incremental compilation cache |
| **AnalysisEngine** | `compiler/analysis/AnalysisManager` + analysis passes | **EXTEND** | Add Laravel-specific resolution rules to existing framework |
| **OutputAdapter** | N/A (manifest format) | **NEW** | Custom adapter dari compiler IR → manifest.json |

### Existing Infrastructure yang SUDAH CAPABLE

✅ **AST Arena** (`compiler/utils/Arena.ts`): Memory-efficient node storage
✅ **Symbol Table** (`compiler/artifacts/SymbolGraphArtifact.ts`): Variable tracking
✅ **Type System** (`compiler/types/TypeSystem.ts`): Type inference & checking
✅ **Artifact Registry** (`compiler/artifacts/Artifact.ts`): Intermediate result storage
✅ **Pass Manager** (`compiler/passes/PassManager.ts`): Pipeline orchestration
✅ **Analysis Framework** (`compiler/analysis/`): Analysis passes infrastructure
✅ **Cache System** (`compiler/cache/LRUCache.ts` + `compiler/query/QueryDatabase.ts`): Incremental compilation

### What Needs to be Built NEW

1. **Laravel-Specific Resolution Rules** (in AnalysisEngine):
   - Resource detection (`UserResource::collection()` patterns)
   - Eloquent model patterns (`User::find()`, `Model::paginate()`)
   - `@mixin` docblock resolution
   - FormRequest validation rule extraction

2. **Manifest Output Adapter** (OutputAdapter component):
   - Convert compiler IR → `routesync.manifest.json` format
   - Handle `kind`, `model`, `resource`, `collection` fields
   - Apply `deriveTransportAndShape()` logic

3. **Integration Glue Code**:
   - Wire LaravelRouteParser → InputLayer → compiler pipeline
   - Bridge PHP reflection output → compiler IR format
   - Handle Laravel-specific metadata (auth middleware, route names)

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- ✅ Create InputLayer wrapper around existing file reading
- ✅ Integrate compiler's Lexer for tokenization
- ✅ Map PHP source → compiler AST nodes
- **Deliverable:** PHP method → Token stream working

### Phase 2: Statement IR (Week 3-4)
- ✅ Use compiler's SemanticIR for assignment tracking
- ✅ Implement statement parser using compiler IR builders
- ✅ Extract assignment scanner dari LaravelRouteParser
- **Deliverable:** Assignments tracked in compiler IR

### Phase 3: Semantic Resolution (Week 5-7)
- ✅ Integrate compiler's SymbolTable
- ✅ Use compiler's TypeSystem for type inference
- ✅ Implement PersistenceLayer dengan ArtifactCache
- **Deliverable:** Symbol table + type resolution working

### Phase 4: Analysis Rules (Week 8-10)
- ✅ Create AnalysisEngine using compiler's AnalysisManager
- ✅ Migrate Laravel-specific rules dari existing SemanticKernel
- ✅ Implement Resource detection, Eloquent patterns
- **Deliverable:** All resolution rules working in new architecture

### Phase 5: Output & Integration (Week 11-12)
- ✅ Implement OutputAdapter for manifest generation
- ✅ Wire everything into LaravelRouteParser
- ✅ Deprecate old regex-based logic
- **Deliverable:** Full pipeline replacing old parser

### Phase 6: Optimization & Polish (Week 13-14)
- ✅ Enable incremental compilation via PersistenceLayer
- ✅ Add caching for expensive resolution operations
- ✅ Performance benchmarking vs old parser
- **Deliverable:** Production-ready refactored parser

---

## Success Criteria

### Functional
- ✅ All existing Laravel patterns still detected correctly
- ✅ No regression in manifest output format
- ✅ New patterns (complex data flow) now handled
- ✅ Pass all integration tests

### Performance
- ✅ Initial scan time ≤ current parser (acceptable: +10%)
- ✅ Incremental scan time < 50ms per changed method
- ✅ Memory usage ≤ current parser + 100MB

### Maintainability
- ✅ Add new resolution rule: < 50 lines, 1 file change
- ✅ Debug failed resolution: trace available in artifacts
- ✅ New developer onboarding: < 2 days to understand architecture

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Compiler IR tidak cocok untuk PHP semantics | Low | High | Proof-of-concept Phase 1 validates feasibility early |
| Performance degradation | Medium | Medium | Benchmarking di setiap phase; rollback plan ready |
| Integration complexity underestimated | Medium | High | Phased rollout; feature flags untuk gradual migration |
| Team unfamiliar with compiler architecture | High | Medium | Documentation + pairing sessions; invest in onboarding |

---

## Decision Rationale Summary

**Dipilih Candidate C karena:**

1. **Metrics terbaik**: Lowest coupling (fan-in/out 3), best state distribution (god object 30%)
2. **Structural enforcement**: Layer boundaries prevent phase dependency bugs secara design
3. **Incremental compilation**: PersistenceLayer enables fast iteration — critical untuk large codebases
4. **Reuse existing infrastructure**: 5/7 components map directly ke existing compiler code
5. **Long-term scalability**: Easy to add new analysis rules (evolvability cost = 1 component)
6. **Team scaling**: Clear boundaries memudahkan parallel development

**Trade-off yang diterima:**

- Slightly higher initial complexity (7 components)
- Perlu setup persistence layer (SQLite/file cache)
- Learning curve untuk team yang belum familiar dengan compiler architecture

**Kapan reconsider:**

- Jika **time-to-market** lebih penting dari architecture perfection → switch to Candidate B
- Jika **team size** < 2 engineers → Candidate B lebih practical
- Jika **codebase growth** tidak expected → Candidate B's simpler architecture sufficient

**Bottom Line:**

Compiler infrastructure existing **ALREADY CAPABLE** untuk handle refactoring ini. **Tidak perlu bikin engine baru** — cukup integrate existing compiler components dengan Layer-Oriented architecture dan add Laravel-specific resolution rules.

