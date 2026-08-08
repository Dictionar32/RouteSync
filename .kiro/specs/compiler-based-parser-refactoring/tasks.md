# Implementation Plan: Compiler-Based Parser Refactoring

## Overview

Refactor `LaravelRouteParser.ts` (~2000+ lines regex-based) menjadi compiler-based static analysis engine menggunakan **existing compiler infrastructure**. Architecture: Layer-Oriented dengan Explicit Persistence (7 komponen) - **5/7 komponen REUSE existing compiler**, hanya 2 komponen baru (InputLayer & OutputAdapter).

**CRITICAL UPDATE**: Discovery phase menemukan **AnalysisManager** - komponen MANDATORY yang memberikan **60x speedup** untuk incremental parsing. Phase 3.5 (7 weeks) ditambahkan untuk integrasi komponen ini.

**Timeline Summary**:
- **Original estimate**: 14 weeks (tanpa AnalysisManager)
- **Updated estimate**: **21 weeks** (dengan AnalysisManager - Tier 1 MANDATORY)
- **Recommended**: 27 weeks (Tier 1 + Tier 2 untuk production quality)

**Phase Breakdown**:
- Phase 1: Foundation (2 weeks)
- Phase 2: Statement IR (2 weeks)
- Phase 3: Semantic Resolution (3 weeks)
- **Phase 3.5: AnalysisManager Integration (7 weeks)** ⭐⭐⭐ **CRITICAL & MANDATORY**
- Phase 4: Analysis Rules (3 weeks)
- Phase 5: Output & Integration (2 weeks)
- Phase 6: Optimization & Polish (2 weeks)

## Tasks

### Phase 1: Foundation (Week 1-2)

- [ ] 1. Setup project structure dan dependencies
  - Create package structure untuk new compiler-based parser
  - Configure TypeScript build untuk integration dengan existing compiler
  - Setup test environment dengan fixtures
  - _Requirements: REQ-1 (Parse statements), REQ-2 (Build symbol table)_

- [ ] 2. Implement InputLayer wrapper
  - [ ] 2.1 Create PHPInputLayer class dengan interface IInputLayer
    - Implement `readMethodSource()` untuk extract PHP source code
    - Implement `getMethodMetadata()` untuk reflection data
    - Wire ke existing `LaravelRouteParser.extractMethodBody()` logic
    - _Requirements: REQ-1_
  
  - [ ]* 2.2 Write unit tests untuk InputLayer
    - Test method source extraction dengan mock PHP reflection
    - Test caching behavior (same method requested twice)
    - Test error handling untuk non-existent methods
    - _Requirements: REQ-16 (Testing coverage >80%)_

- [ ] 3. Integrate TokenizationLayer dengan PHP tokenization
  - [ ] 3.1 Implement PHPTokenizationLayer using compiler's Lexer & Arena
    - Create token mapping dari PHP token constants ke AST node kinds
    - Implement `tokenize()` method using PHP's `token_get_all()`
    - Store tokens in compiler's ASTArena untuk memory efficiency
    - _Requirements: REQ-2_
  
  - [ ]* 3.2 Write unit tests untuk TokenizationLayer
    - Test PHP variable tokenization (`$user = ...`)
    - Test static method call tokenization (`User::find()`)
    - Test return statement tokenization
    - _Requirements: REQ-16_

- [ ] 4. Map PHP AST nodes ke compiler AST format
  - [ ] 4.1 Implement token kind mapping
    - Map T_VARIABLE → 'Variable'
    - Map T_STRING → 'Identifier'
    - Map T_RETURN → 'ReturnStatement'
    - Map T_DOUBLE_COLON → 'StaticMethodCall'
    - _Requirements: REQ-2_
  
  - [ ]* 4.2 Write integration tests for token mapping
    - Test complete PHP statement tokenization
    - Test token data retrieval from Arena
    - _Requirements: REQ-16_

- [ ] 5. Checkpoint - Foundation validation
  - Verify PHP source → Token stream working end-to-end
  - Run all Phase 1 tests and ensure pass rate >95%
  - Ensure all tests pass, ask the user if questions arise.

### Phase 2: Statement IR (Week 3-4)

- [ ] 6. Implement StatementIRLayer using compiler's SemanticIR
  - [ ] 6.1 Create PHPStatementIRLayer class dengan interface IStatementIRLayer
    - Implement `parseToIR()` untuk convert tokens ke SemanticIR nodes
    - Handle assignment statements (`$user = ...`)
    - Handle method calls (`User::find()`, `new UserResource()`)
    - Handle return statements
    - _Requirements: REQ-3 (Track assignments), REQ-1_
  
  - [ ]* 6.2 Write unit tests untuk StatementIRLayer
    - Test variable assignment parsing
    - Test static method call parsing
    - Test Resource instantiation parsing
    - Test unsupported statement error handling
    - _Requirements: REQ-16_

- [ ] 7. Implement Laravel-specific statement patterns
  - [ ] 7.1 Add Eloquent method call detection
    - Detect `User::findOrFail()`, `Model::create()` patterns
    - Extract model name dari static method receiver
    - _Requirements: REQ-8 (Handle bare models)_
  
  - [ ] 7.2 Add Resource instantiation detection
    - Detect `new UserResource($var)` patterns
    - Detect `UserResource::make()` patterns
    - Detect `UserResource::collection()` patterns
    - _Requirements: REQ-7 (Handle Resources)_
  
  - [ ] 7.3 Add conditional return handling
    - Parse ternary expressions (`return $user ? new UserResource($user) : null`)
    - Track nullable responses
    - _Requirements: REQ-9 (Handle array returns)_
  
  - [ ]* 7.4 Write integration tests for Laravel patterns
    - Test full statement parsing for Eloquent calls
    - Test Resource pattern detection
    - Test conditional return tracking
    - _Requirements: REQ-16_

- [ ] 8. Extract assignment scanner dari LaravelRouteParser
  - [ ] 8.1 Migrate assignment tracking logic
    - Port existing variable assignment tracking
    - Integrate dengan compiler's SymbolTable
    - _Requirements: REQ-3_
  
  - [ ]* 8.2 Write regression tests
    - Compare assignment tracking results dengan old implementation
    - Ensure 100% compatibility
    - _Requirements: REQ-17 (Migration compatibility)_

- [ ] 9. Checkpoint - Statement IR validation
  - Verify full method body → Statement IR working
  - Run integration tests dengan real Laravel controller methods
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: Semantic Resolution (Week 5-7)

- [ ] 10. Integrate SemanticLayer dengan compiler infrastructure
  - [ ] 10.1 Create PHPSemanticResolutionLayer using compiler's SymbolTable
    - Implement `resolveTypes()` untuk build symbol table
    - Implement `inferExpressionType()` menggunakan compiler's TypeSystem
    - Wire ke existing EloquentRegistry untuk model metadata
    - _Requirements: REQ-4 (Resolve aliases), REQ-5 (Infer expression types)_
  
  - [ ]* 10.2 Write unit tests for type resolution
    - Test Eloquent method type inference
    - Test Resource type resolution
    - Test symbol table construction
    - _Requirements: REQ-16_

- [ ] 11. Implement Laravel-specific type resolution
  - [ ] 11.1 Add EloquentTypeResolver
    - Detect Eloquent static method patterns
    - Resolve model class names ke TypeScript types
    - Handle collection methods (`paginate`, `all`, `get`)
    - _Requirements: REQ-8_
  
  - [ ] 11.2 Add LaravelResourceTypeResolver
    - Extract model name dari Resource classes
    - Handle `@mixin` docblock resolution
    - Fallback ke Resource name stripping (`UserResource` → `User`)
    - _Requirements: REQ-7_
  
  - [ ]* 11.3 Write integration tests for type resolvers
    - Test Eloquent pattern resolution with mock registry
    - Test Resource pattern resolution
    - Test @mixin annotation parsing
    - _Requirements: REQ-16_

- [ ] 12. Implement PersistenceLayer dengan ArtifactCache
  - [ ] 12.1 Create IncrementalPersistenceLayer using compiler's cache
    - Implement two-level caching (memory + query database)
    - Implement `getCached()` dan `store()` methods
    - Implement cache invalidation logic
    - _Requirements: REQ-5 (Analysis result caching), REQ-12 (Incremental compilation)_
  
  - [ ] 12.2 Add smart invalidation strategy
    - Implement source hash comparison
    - Implement dependent file invalidation (Resource changes → invalidate controllers)
    - Track dependency graph
    - _Requirements: REQ-12_
  
  - [ ]* 12.3 Write performance tests for caching
    - Test cache hit rate >80% during typical workflows
    - Test incremental re-analysis <50ms per changed method
    - Test memory usage stays within limits
    - _Requirements: REQ-14 (Performance targets), REQ-16_

- [ ] 13. Checkpoint - Semantic resolution validation
  - Verify symbol table + type resolution working correctly
  - Run performance benchmarks untuk caching effectiveness
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3.5: AnalysisManager Integration (Week 8-14) ⭐⭐⭐ CRITICAL!

**⚠️ MANDATORY PHASE**: Tanpa AnalysisManager, compiler approach TIDAK VIABLE (20-30ms vs 8ms regex). DENGAN AnalysisManager: 60x speedup untuk incremental parsing!

- [ ] 13A. Implement AnalysisManager wrapper (Week 8-9)
  - [ ] 13A.1 Create LaravelAnalysisManager class
    - Implement `getCached()` dengan content hash validation
    - Implement `store()` dengan dependency tracking
    - Implement cache invalidation strategies
    - Wire ke existing compiler's AnalysisManager
    - _Requirements: REQ-12 (Incremental compilation), REQ-14 (Performance <15s)_
  
  - [ ] 13A.2 Implement content hashing system
    - Add SHA-256 source code hashing
    - Implement hash comparison for cache validation
    - Track file modification timestamps
    - _Requirements: REQ-12_
  
  - [ ]* 13A.3 Write unit tests for AnalysisManager wrapper
    - Test cache hit/miss scenarios
    - Test content hash validation
    - Test cache invalidation logic
    - _Requirements: REQ-16 (Testing coverage >80%)_

- [ ] 13B. Build dependency tracking system (Week 9-10)
  - [ ] 13B.1 Implement dependency graph builder
    - Track controller file dependencies
    - Track resource class dependencies
    - Track model class dependencies
    - Build bidirectional dependency map
    - _Requirements: REQ-12_
  
  - [ ] 13B.2 Extract dependency information from analysis
    - Capture all file references during analysis
    - Compute file content hashes for dependencies
    - Store dependency metadata with cached results
    - _Requirements: REQ-12_
  
  - [ ] 13B.3 Implement dependency validation
    - Check if any dependency files changed
    - Invalidate cache when dependencies are stale
    - _Requirements: REQ-12_
  
  - [ ]* 13B.4 Write integration tests for dependency tracking
    - Test multi-level dependency detection
    - Test dependency change propagation
    - Test cache invalidation cascade
    - _Requirements: REQ-16_

- [ ] 13C. Implement smart invalidation strategies (Week 10-11)
  - [ ] 13C.1 Add controller-based invalidation
    - Implement `invalidateByController()` method
    - Invalidate all methods in changed controller
    - _Requirements: REQ-12_
  
  - [ ] 13C.2 Add resource-based invalidation
    - Implement `invalidateByResource()` method
    - Find all methods using changed resource
    - Invalidate dependent methods
    - _Requirements: REQ-12_
  
  - [ ] 13C.3 Add model-based invalidation
    - Track model usage across controllers
    - Invalidate when model schema changes
    - _Requirements: REQ-12_
  
  - [ ] 13C.4 Add invalidateDependents() implementation
    - Query dependency graph efficiently
    - Batch invalidation for performance
    - _Requirements: REQ-12_
  
  - [ ]* 13C.5 Write performance tests for invalidation
    - Test invalidation speed (<10ms for 100 dependents)
    - Test invalidation accuracy (no false positives)
    - _Requirements: REQ-14, REQ-16_

- [ ] 13D. Integrate AnalysisManager into CompilerBasedParser (Week 11-12)
  - [ ] 13D.1 Add cache lookup in parseMethod()
    - Check cache before full analysis
    - Return cached result if valid
    - Log cache hit/miss for monitoring
    - _Requirements: REQ-12_
  
  - [ ] 13D.2 Add cache storage after analysis
    - Extract dependencies from analysis result
    - Compute content hash
    - Store analysis result with metadata
    - _Requirements: REQ-12_
  
  - [ ] 13D.3 Wire dependency extraction
    - Implement `extractDependencies()` helper
    - Resolve file paths for all dependencies
    - Compute file hashes
    - _Requirements: REQ-12_
  
  - [ ]* 13D.4 Write integration tests for cached parsing
    - Test first parse (cold cache): ~35ms acceptable
    - Test second parse (warm cache): **<1ms target** 🎯
    - Test cache invalidation correctness
    - _Requirements: REQ-14, REQ-16_

- [ ] 13E. Implement watch mode integration (Week 12-13)
  - [ ] 13E.1 Create IncrementalParserWatcher class
    - Setup file watcher using chokidar
    - Monitor controller, resource, model directories
    - _Requirements: REQ-12_
  
  - [ ] 13E.2 Add file change handlers
    - Detect controller file changes
    - Detect resource file changes
    - Detect model file changes
    - Trigger appropriate invalidation strategy
    - _Requirements: REQ-12_
  
  - [ ] 13E.3 Add intelligent re-parsing
    - Only re-parse invalidated methods
    - Batch re-parsing requests
    - Debounce file change events
    - _Requirements: REQ-12, REQ-14_
  
  - [ ]* 13E.4 Write watch mode integration tests
    - Test file change detection
    - Test invalidation triggering
    - Test batch re-parsing
    - _Requirements: REQ-16_

- [ ] 13F. Add cache statistics & monitoring (Week 13-14)
  - [ ] 13F.1 Implement AnalysisManagerMonitor class
    - Track cache hit rate
    - Track average hit/miss times
    - Calculate time saved by caching
    - Compute speedup factor
    - _Requirements: REQ-14_
  
  - [ ] 13F.2 Add cache reporting
    - Implement `printReport()` for statistics
    - Log cache effectiveness metrics
    - Track cache size and memory usage
    - _Requirements: REQ-14_
  
  - [ ] 13F.3 Add performance monitoring hooks
    - Record cache hit duration
    - Record cache miss duration
    - Track invalidation counts
    - _Requirements: REQ-14_
  
  - [ ]* 13F.4 Write performance validation tests
    - **CRITICAL TEST: Verify 60x speedup claim**
    - Test: First parse ~35ms, Second parse ~0.4ms
    - Test: Watch mode 100 routes: 3000ms → <100ms
    - Test: Cache hit rate >90% in typical workflows
    - _Requirements: REQ-14, REQ-16_

- [ ] 13G. Optimize cache performance (Week 14)
  - [ ] 13G.1 Tune cache parameters
    - Optimize cache size limits
    - Optimize TTL settings
    - Optimize hash computation
    - _Requirements: REQ-14_
  
  - [ ] 13G.2 Add cache warmup strategy
    - Pre-populate cache on startup
    - Prioritize frequently-used methods
    - _Requirements: REQ-14_
  
  - [ ] 13G.3 Implement cache persistence
    - Save cache to disk on shutdown
    - Load cache from disk on startup
    - _Requirements: REQ-12_
  
  - [ ]* 13G.4 Run final performance benchmarks
    - Verify all performance targets met
    - **Target: 60x speedup for cached routes** ✨
    - **Target: <100ms watch mode for 100 routes** 🎯
    - **Target: >90% cache hit rate** 📊
    - _Requirements: REQ-14, REQ-16_

- [ ] 13H. Checkpoint - AnalysisManager validation ⭐
  - **CRITICAL VALIDATION**: Verify 60x incremental speedup achieved
  - Run comprehensive cache effectiveness tests
  - Verify watch mode performance meets targets
  - Test rollback scenario if performance targets not met
  - Document cache statistics and performance gains
  - **GO/NO-GO DECISION POINT**: If 60x speedup NOT achieved, consider alternative approaches
  - Ensure all tests pass, ask the user if questions arise.

### Phase 4: Analysis Rules (Week 15-17)

- [ ] 14. Setup AnalysisEngine using compiler's AnalysisManager
  - [ ] 14.1 Create LaravelAnalysisEngine dengan analysis pass infrastructure
    - Register analysis passes dengan priority ordering
    - Implement pass dependency management
    - Aggregate analysis results
    - _Requirements: REQ-6 (Resolve return types)_
  
  - [ ]* 14.2 Write unit tests for AnalysisEngine orchestration
    - Test pass execution order
    - Test dependency resolution
    - Test result aggregation
    - _Requirements: REQ-16_

- [ ] 15. Implement Laravel-specific analysis passes
  - [ ] 15.1 Implement Resource Detection Pass (Priority 100)
    - **Property 1: Resource pattern detection completeness**
    - **Validates: Requirements REQ-7**
    - Detect `new UserResource()` patterns
    - Detect `UserResource::make()` patterns
    - Detect `UserResource::collection()` patterns
    - Extract resource and model names
    - _Requirements: REQ-7_
  
  - [ ] 15.2 Implement Eloquent Detection Pass (Priority 90)
    - **Property 2: Eloquent method detection accuracy**
    - **Validates: Requirements REQ-8**
    - Detect Eloquent static methods (find, findOrFail, create, etc.)
    - Determine collection vs single returns
    - Extract model class names
    - _Requirements: REQ-8_
  
  - [ ] 15.3 Implement Mixin Resolution Pass (Priority 80)
    - **Property 3: @mixin annotation resolution correctness**
    - **Validates: Requirements REQ-7**
    - Parse @mixin docblock tags
    - Resolve full class names
    - Override model name inference
    - _Requirements: REQ-7, REQ-9_
  
  - [ ] 15.4 Implement FormRequest Validation Pass (Priority 70)
    - **Property 4: Validation rule extraction completeness**
    - **Validates: Requirements REQ-6**
    - Extract validation rules dari FormRequest classes
    - Prepare data untuk Zod schema generation
    - _Requirements: REQ-6_
  
  - [ ] 15.5 Implement Collection Detection Pass (Priority 60)
    - **Property 5: Collection response detection accuracy**
    - **Validates: Requirements REQ-7, REQ-8**
    - Detect `::collection()` calls
    - Detect pagination methods
    - Mark collection flag
    - _Requirements: REQ-7, REQ-8_
  
  - [ ]* 15.6 Write property-based tests for all analysis passes
    - **Property test suite covering all Laravel patterns**
    - Test with generated Laravel controller variations
    - Verify pattern detection rates >95%
    - _Requirements: REQ-16, REQ-18 (Round-trip preservation)_

- [ ] 16. Migrate existing SemanticKernel Laravel rules
  - [ ] 16.1 Port Resource resolution logic
    - Move from regex-based detection
    - Integrate dengan new analysis passes
    - _Requirements: REQ-7_
  
  - [ ] 16.2 Port Eloquent resolution logic
    - Move from regex patterns
    - Use compiler IR instead
    - _Requirements: REQ-8_
  
  - [ ]* 16.3 Write regression tests comparing old vs new
    - Test 100+ real Laravel controller methods
    - Compare resolution results
    - Ensure >99% agreement rate
    - _Requirements: REQ-17, REQ-16_

- [ ] 17. Checkpoint - Analysis rules validation
  - Verify all Laravel patterns detected correctly
  - Run comprehensive pattern coverage tests
  - Ensure all tests pass, ask the user if questions arise.

### Phase 5: Output & Integration (Week 11-12)

- [ ] 18. Implement OutputAdapter untuk manifest generation
  - [ ] 18.1 Create ManifestOutputAdapter class
    - Implement `toManifest()` untuk convert analysis results
    - Implement priority-based response metadata building
    - Apply transport & shape derivation logic
    - _Requirements: REQ-11 (Manifest output generation)_
  
  - [ ]* 18.2 Write unit tests untuk OutputAdapter
    - Test Resource response formatting
    - Test Eloquent response formatting
    - Test array return formatting
    - Test fallback behavior
    - _Requirements: REQ-16_

- [ ] 19. Wire CompilerBasedParser into LaravelRouteParser
  - [ ] 19.1 Implement dual-mode operation dengan feature flag
    - Add `COMPILER_BASED_PARSER` environment variable
    - Implement fallback ke regex parser
    - Wire all 7 layers together
    - _Requirements: REQ-13 (Migration compatibility)_
  
  - [ ] 19.2 Implement parallel validation mode
    - Run both parsers concurrently
    - Compare results and log differences
    - Support gradual cutover strategy
    - _Requirements: REQ-13, REQ-17_
  
  - [ ]* 19.3 Write integration tests for full pipeline
    - Test end-to-end parsing dengan real Laravel apps
    - Test feature flag switching
    - Test parallel validation mode
    - _Requirements: REQ-16, REQ-17_

- [ ] 20. Setup phased migration infrastructure
  - [ ] 20.1 Implement route-by-route migration tracking
    - Track which routes use new vs old parser
    - Enable gradual cutover
    - _Requirements: REQ-17_
  
  - [ ] 20.2 Add rollback mechanism
    - Quick environment variable rollback
    - Config file rollback support
    - _Requirements: REQ-17_

- [ ] 21. Deprecate old regex-based logic (preparation)
  - [ ] 21.1 Mark old methods as deprecated
    - Add @deprecated annotations
    - Document migration path
    - _Requirements: REQ-13_
  
  - [ ] 21.2 Create migration guide documentation
    - Document new architecture
    - Provide troubleshooting guide
    - _Requirements: REQ-13_

- [ ] 22. Checkpoint - Full integration validation
  - Run all integration tests with real Laravel manifests
  - Verify manifest format compatibility (100%)
  - Test rollback mechanism
  - Ensure all tests pass, ask the user if questions arise.

### Phase 6: Optimization & Polish (Week 13-14)

- [ ] 23. Enable incremental compilation optimizations
  - [ ] 23.1 Optimize PersistenceLayer cache strategy
    - Tune cache size and TTL settings
    - Optimize cache key generation
    - _Requirements: REQ-12, REQ-14_
  
  - [ ] 23.2 Implement streaming processing untuk large manifests
    - Add chunked processing (50 routes per chunk)
    - Force garbage collection between chunks
    - _Requirements: REQ-14_
  
  - [ ]* 23.3 Run performance benchmarks
    - Test with 1000+ route manifests
    - Verify <15s total generation time
    - Verify <512MB peak memory usage
    - _Requirements: REQ-14, REQ-16_

- [ ] 24. Add comprehensive error handling and debugging
  - [ ] 24.1 Implement structured error types
    - Create SemanticResolutionError class
    - Create CodeGenerationError class
    - Add error context tracking
    - _Requirements: REQ-15 (Error handling)_
  
  - [ ] 24.2 Add DEBUG mode untuk IR inspection
    - Output intermediate IR after each layer
    - Add verbose logging options
    - _Requirements: REQ-15_

- [ ] 25. Performance tuning dan optimization
  - [ ] 25.1 Profile critical paths
    - Identify bottlenecks using Node profiler
    - Optimize hot paths
    - _Requirements: REQ-14_
  
  - [ ] 25.2 Optimize memory usage
    - Add memory monitoring
    - Implement memory-efficient IR building
    - _Requirements: REQ-14_
  
  - [ ]* 25.3 Run final performance validation
    - Verify all performance targets met
    - Test incremental compilation effectiveness
    - _Requirements: REQ-14, REQ-16_

- [ ] 26. Complete documentation
  - [ ] 26.1 Write architecture documentation
    - Document 7-layer architecture
    - Document component integration points
    - Document compiler infrastructure reuse
    - _Requirements: REQ-13_
  
  - [ ] 26.2 Write developer onboarding guide
    - Create quick start guide
    - Document debugging techniques
    - Add troubleshooting section
    - _Requirements: REQ-13_

- [ ] 27. Remove old regex-based code
  - [ ] 27.1 Delete deprecated methods
    - Remove `extractMethodBody()` regex logic
    - Remove `parseReturnStatement()` regex matching
    - Remove `inferResponseType()` regex patterns
    - _Requirements: REQ-13_
  
  - [ ] 27.2 Clean up dead code
    - Remove unused imports
    - Remove legacy test fixtures
    - Update documentation references
    - _Requirements: REQ-13_
  
  - [ ]* 27.3 Final regression test suite
    - Run complete test suite
    - Verify 100% of existing tests still pass
    - _Requirements: REQ-16, REQ-17_

- [ ] 28. Final checkpoint - Production readiness
  - Verify all success metrics met
  - Run full test suite (unit + integration + performance)
  - Verify manifest output matches old parser 100%
  - Deploy to production with monitoring
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability (REQ-XX)
- Checkpoints ensure incremental validation at major milestones
- Property tests (marked with "Property N:") validate universal correctness properties from design
- Unit tests and property tests are complementary - both should be run
- Total implementation timeline: ~14 weeks as per design document
- Focus on **reusing existing compiler infrastructure** (5/7 components)
- Each phase has validation gate before proceeding to next phase
- Rollback plan available at any phase via environment variable

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2.1"] },
    { "id": 1, "tasks": ["2.2", "3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "6.1"] },
    { "id": 4, "tasks": ["6.2", "7.1", "7.2", "7.3"] },
    { "id": 5, "tasks": ["7.4", "8.1"] },
    { "id": 6, "tasks": ["8.2", "10.1"] },
    { "id": 7, "tasks": ["10.2", "11.1", "11.2"] },
    { "id": 8, "tasks": ["11.3", "12.1", "12.2"] },
    { "id": 9, "tasks": ["12.3", "14.1"] },
    { "id": 10, "tasks": ["14.2", "15.1", "15.2", "15.3", "15.4", "15.5"] },
    { "id": 11, "tasks": ["15.6", "16.1", "16.2"] },
    { "id": 12, "tasks": ["16.3", "18.1"] },
    { "id": 13, "tasks": ["18.2", "19.1", "19.2"] },
    { "id": 14, "tasks": ["19.3", "20.1", "20.2", "21.1"] },
    { "id": 15, "tasks": ["21.2", "23.1", "23.2"] },
    { "id": 16, "tasks": ["23.3", "24.1", "24.2", "25.1", "25.2"] },
    { "id": 17, "tasks": ["25.3", "26.1", "26.2", "27.1", "27.2"] },
    { "id": 18, "tasks": ["27.3"] }
  ]
}
```
