# Implementation Plan: Scanner-Compiler-Writers Architecture Refactoring

## Overview

This plan refactors RouteSync's monolithic architecture into a clean three-layer pipeline:
- **Scanner** (Fact Extraction): Parse Laravel projects without inference
- **Compiler** (Semantic Analysis): All type inference and analysis here
- **Writers** (Code Generation): Multiple output formats

**Timeline:** 10 weeks across 5 phases
**Team Size:** 2-3 developers
**Estimated Tasks:** 38 concrete, actionable tasks
**Success Metrics:** 95%+ compiler test coverage, zero breaking changes, 10% faster generation

## Phase 1: Infrastructure Setup (Week 1-2) - 8 Tasks

### 1. Define Artifact Type System

- [ ] 1.1 Create artifact base classes and type hierarchy
  - Create `packages/core/src/compiler/artifacts/Artifact.ts` with base class
  - Define `typeId: string`, `metadata: ArtifactMetadata`, validation methods
  - Implement `ArtifactBuilder` base class with fluent API
  - **Acceptance Criteria:** Artifact class compiles, has 100% type safety, includes JSDoc
  - **Files Modified/Created:** `Artifact.ts`, `ArtifactMetadata.ts`
  - **Testing:** Unit test in `artifacts.test.ts` verifying base class behavior
  - **Estimated Time:** 6 hours

- [ ] 1.2 Implement ResponseArtifact type definition
  - Create `ResponseArtifact` class with transport kind, resource name, collection flag
  - Add confidence tracking (score: 0-1, reasoning: string)
  - Implement builder: `new ResponseArtifactBuilder().resource('User').confidence(0.95, 'reason')`
  - **Acceptance Criteria:** Compiles, builder validates required fields, typeId is unique
  - **Files Modified/Created:** `ResponseArtifact.ts`, `ResponseArtifactBuilder.ts`
  - **Testing:** Unit tests for builder pattern, validation rules
  - **Estimated Time:** 5 hours

- [ ] 1.3 Implement ValidationArtifact, ResourceArtifact, ModelArtifact types
  - Create `ValidationArtifact` with Zod schema structure
  - Create `ResourceArtifact` with property mappings and model references
  - Create `ModelArtifact` with table structure and column metadata
  - **Acceptance Criteria:** All three types implemented with builders, 100% type safety
  - **Files Modified/Created:** `ValidationArtifact.ts`, `ResourceArtifact.ts`, `ModelArtifact.ts`
  - **Testing:** Unit tests for each artifact type
  - **Estimated Time:** 8 hours

- [ ] 1.4 Implement RouteArtifact - complete route definition
  - Create `RouteArtifact` with HTTP method, path, controller/action
  - Add references to ResponseArtifact, ValidationArtifact, ResourceArtifact
  - Include auth and middleware metadata
  - **Acceptance Criteria:** Handles artifact references by ID, builder validates references exist (when used)
  - **Files Modified/Created:** `RouteArtifact.ts`, `RouteArtifactBuilder.ts`
  - **Testing:** Unit tests including reference validation
  - **Estimated Time:** 6 hours

### 2. Create ArtifactRegistry - Single Source of Truth

- [ ] 1.5 Implement ArtifactRegistry interface and in-memory storage
  - Create `packages/core/src/compiler/registry/ArtifactRegistry.ts` interface
  - Implement `put<K>(key: K, artifact: ArtifactRegistry[K]): void` method
  - Implement `query<T>(type: T['typeId']): T[]` method with type-safe returns
  - Implement `findById(id: string): Artifact | undefined` method
  - **Acceptance Criteria:** All methods compile, return correct types, handle missing data
  - **Files Modified/Created:** `ArtifactRegistry.ts`, `InMemoryArtifactRegistry.ts`
  - **Testing:** Unit tests for put, query, findById operations
  - **Estimated Time:** 7 hours

- [ ] 1.6 Add validation and referential integrity to registry
  - Implement `validate(artifact: Artifact): ValidationResult` method
  - Check artifact minimum quality standards
  - Implement `validateReferences()` to ensure no dangling IDs
  - **Acceptance Criteria:** Validation catches invalid artifacts, clear error messages
  - **Files Modified/Created:** `ArtifactRegistry.ts` (modified), `RegistryValidator.ts`
  - **Testing:** Tests for validation logic, invalid artifact detection
  - **Estimated Time:** 5 hours

- [ ] 1.7 Implement registry statistics and export functionality
  - Add `getStats(): RegistryStats` returning artifact counts by type
  - Implement `export(): ExportedArtifactRegistry` for serialization
  - **Acceptance Criteria:** Stats accurate, export format JSON-serializable
  - **Files Modified/Created:** `ArtifactRegistry.ts` (modified), `RegistryStats.ts`
  - **Testing:** Unit tests for stats computation and export
  - **Estimated Time:** 4 hours

### 3. Set Up Compiler Pass Infrastructure

- [ ] 1.8 Create CompilerPass interface and PassManager orchestration
  - Create `packages/core/src/compiler/passes/CompilerPass.ts` generic interface
  - Define `inputs: ArtifactKey[]` and `outputs: ArtifactKey[]` properties
  - Create `PassManager` class to execute passes in dependency order
  - Implement `PassGraph.resolve()` to topologically sort passes
  - **Acceptance Criteria:** PassManager executes passes correctly, handles dependencies
  - **Files Modified/Created:** `CompilerPass.ts`, `PassManager.ts`, `PassGraph.ts`
  - **Testing:** Unit tests for pass ordering, dependency graph resolution
  - **Estimated Time:** 8 hours

- [ ] **Phase 1 Checkpoint:** Ensure all infrastructure tests pass
  - Run: `npm run test -- packages/core/src/compiler/artifacts packages/core/src/compiler/registry packages/core/src/compiler/passes`
  - Verify: 95%+ coverage on infrastructure code
  - **Estimated Time:** 2 hours

---

## Phase 2: Scanner Refactoring (Week 3-4) - 8 Tasks

### 4. Define Scanner Output Format

- [ ] 2.1 Create RawManifest and RawRoute type definitions
  - Create `packages/core/src/types/RawManifest.ts`
  - Define `RawRoute` with method, path, controller, action only (no inference)
  - Define `RawModel`, `RawResource`, `RawValidation` types
  - Include raw PHP source code and docblocks as strings
  - **Acceptance Criteria:** Types defined, no inference fields present
  - **Files Modified/Created:** `RawManifest.ts`, `RawRoute.ts`
  - **Testing:** Schema validation tests
  - **Estimated Time:** 5 hours

- [ ] 2.2 Implement RawManifest schema validation
  - Create validator function `validateRawManifest(data: unknown): RawManifest`
  - Ensure deterministic output (no timestamps, content-hash based)
  - Add version field tracking
  - **Acceptance Criteria:** Rejects invalid manifests, produces identical JSON on repeated runs
  - **Files Modified/Created:** `RawManifestValidator.ts`
  - **Testing:** Determinism tests (run scanner twice, compare output)
  - **Estimated Time:** 4 hours

### 5. Extract Scanner Components from LaravelRouteParser

- [ ] 2.3 Create LaravelRouteScanner interface and extract route parsing
  - Create `packages/cli/src/scanners/LaravelRouteScanner.ts` interface
  - Extract route parsing logic from `LaravelRouteParser` (~300 lines)
  - Implement `scanRoutes(projectPath: string): Promise<RawRoute[]>`
  - Remove all type inference logic from scanner
  - **Acceptance Criteria:** Scanner outputs < 300 lines, no inference present
  - **Files Modified/Created:** `LaravelRouteScanner.ts`, reduce `LaravelRouteParser.ts`
  - **Testing:** Unit tests for route scanning with 5+ test routes
  - **Estimated Time:** 8 hours

- [ ] 2.4 Implement ControllerMethodScanner for method reflection
  - Create `ControllerMethodScanner` to extract method signatures via PHP reflection
  - Extract raw return statements without analyzing them
  - Get method docblocks and PHP 8 attributes
  - **Acceptance Criteria:** Extracts all method metadata, no analysis
  - **Files Modified/Created:** `ControllerMethodScanner.ts`
  - **Testing:** Tests with controllers containing various return types
  - **Estimated Time:** 6 hours

- [ ] 2.5 Implement FormRequestScanner for validation rule extraction
  - Create `FormRequestScanner` to parse FormRequest classes
  - Extract validation rules deterministically
  - Handle nested rules and conditional validation
  - **Acceptance Criteria:** All rule types extracted, no Zod conversion yet
  - **Files Modified/Created:** `FormRequestScanner.ts`
  - **Testing:** Tests with 10+ FormRequest examples
  - **Estimated Time:** 6 hours

- [ ] 2.6 Implement ModelScanner for schema extraction
  - Create `ModelScanner` to query Laravel Schema facade
  - Extract table names, column types, relationships
  - No type inference, just raw schema facts
  - **Acceptance Criteria:** Schema accurately extracted from database
  - **Files Modified/Created:** `ModelScanner.ts`
  - **Testing:** Integration tests with test Laravel project
  - **Estimated Time:** 5 hours

- [ ] 2.7 Implement ResourceScanner for Resource class analysis
  - Create `ResourceScanner` to identify Resource classes
  - Extract property definitions and type hints
  - Map resources to models by naming convention
  - **Acceptance Criteria:** All Resource properties extracted
  - **Files Modified/Created:** `ResourceScanner.ts`
  - **Testing:** Tests with various Resource class patterns
  - **Estimated Time:** 5 hours

- [ ] 2.8 Create ScanCommand orchestration layer
  - Create `ScanCommand` class integrating all scanners
  - Output RawManifest to JSON file
  - Add progress indicators and error reporting
  - **Acceptance Criteria:** `routesync scan` generates deterministic manifest.raw.json
  - **Files Modified/Created:** `ScanCommand.ts`, `ScannerOrchestrator.ts`
  - **Testing:** End-to-end scan test with test project
  - **Estimated Time:** 6 hours

- [ ] **Phase 2 Checkpoint:** Verify scanner determinism and completeness
  - Run scanner twice on test project, verify identical outputs
  - Verify RawManifest has all required fields
  - Run: `npm run test -- packages/cli/src/scanners`
  - **Estimated Time:** 2 hours

---

## Phase 3: Compiler Refactoring (Week 5-6) - 10 Tasks

### 6. Implement Core Compiler Infrastructure

- [ ] 3.1 Create CompilationContext with artifact registry and state tracking
  - Create `CompilationContext` class holding:
    - `registry: ArtifactRegistry`
    - `state: CompilationState` tracking pass execution
    - `logger: CompilationLogger` for diagnostics
  - Implement pass execution tracking
  - **Acceptance Criteria:** Context properly initialized, state tracked during compilation
  - **Files Modified/Created:** `CompilationContext.ts`, `CompilationState.ts`
  - **Testing:** Unit tests for context initialization and state transitions
  - **Estimated Time:** 5 hours

- [ ] 3.2 Create Compiler main class orchestrating passes
  - Create `Compiler` class with `async compile(manifest: RawManifest): Promise<ArtifactRegistry>`
  - Load RawManifest, create context, execute passes via PassManager
  - Implement error handling and recovery
  - **Acceptance Criteria:** Compiler executes all passes, populates registry
  - **Files Modified/Created:** `Compiler.ts`, `CompilerOrchestrator.ts`
  - **Testing:** Tests for complete compilation flow
  - **Estimated Time:** 6 hours

### 7. Implement Analysis Passes (ResponseAnalysisPass)

- [ ] 3.3 Create StatementIRLayer for parsing PHP method bodies
  - Create `StatementIRLayer` to parse PHP return statements
  - Build AST of method source code
  - Extract Resource, Model, JSON, and Primitive return patterns
  - **Acceptance Criteria:** Parses common return statements correctly
  - **Files Modified/Created:** `StatementIRLayer.ts`, `PHPStatementParser.ts`
  - **Testing:** Tests with 20+ return statement patterns
  - **Estimated Time:** 8 hours

- [ ] 3.4 Implement ResponseAnalysisPass - infer response types
  - Create `ResponseAnalysisPass` implementing 7-stage inference pipeline
  - Stage 1: Check PHP 8 `#[Response]` attribute
  - Stage 2: Check `return new ResourceClass($item)`
  - Stage 3: Check `@mixin` docblock annotation
  - Stage 4: Resolve Resource constructor type hints
  - Stage 5: Strip "Resource" suffix and match to models
  - Stage 6: Map properties to database columns
  - Stage 7: Manual annotation fallback
  - **Acceptance Criteria:** Correctly infers response types with confidence scores
  - **Files Modified/Created:** `ResponseAnalysisPass.ts`, `ResponseTypeInference.ts`
  - **Testing:** Tests with 30+ controller methods covering all inference stages
  - **Estimated Time:** 10 hours

- [ ] 3.5 Create ResponseTypeInference engine with confidence tracking
  - Implement inference logic for each of 7 stages
  - Track confidence score and reasoning for each stage
  - Handle collection detection (single vs `collection()`)
  - **Acceptance Criteria:** Confidence scores accurate, reasoning clear
  - **Files Modified/Created:** `ResponseTypeInference.ts`, `ConfidenceScore.ts`
  - **Testing:** Tests verifying confidence scoring matches actual accuracy
  - **Estimated Time:** 8 hours

### 8. Implement Validation and Resource Analysis Passes

- [ ] 3.6 Implement ValidationAnalysisPass - extract Zod schemas
  - Create `ValidationAnalysisPass` to parse FormRequest classes
  - Extract Laravel validation rules and convert to Zod schema
  - Handle all rule types (required, string, email, unique, etc.)
  - **Acceptance Criteria:** All rule types converted to Zod, preserves validation semantics
  - **Files Modified/Created:** `ValidationAnalysisPass.ts`, `ValidationRuleConverter.ts`
  - **Testing:** Tests with 25+ FormRequest examples
  - **Estimated Time:** 8 hours

- [ ] 3.7 Implement ResourceAnalysisPass - analyze Resource classes
  - Create `ResourceAnalysisPass` to extract Resource properties
  - Identify property transformations (snake_case → camelCase)
  - Detect conditional attributes
  - Map to underlying model
  - **Acceptance Criteria:** All properties extracted with types
  - **Files Modified/Created:** `ResourceAnalysisPass.ts`, `ResourcePropertyExtractor.ts`
  - **Testing:** Tests with various Resource patterns
  - **Estimated Time:** 6 hours

### 9. Implement Model and Route Analysis Passes

- [ ] 3.8 Implement ModelAnalysisPass - extract database schemas
  - Create `ModelAnalysisPass` to query model information
  - Extract table structure, column types, relationships
  - Build ModelArtifact for each model
  - **Acceptance Criteria:** All model schemas extracted accurately
  - **Files Modified/Created:** `ModelAnalysisPass.ts`, `ModelSchemaExtractor.ts`
  - **Testing:** Tests with test database models
  - **Estimated Time:** 5 hours

- [ ] 3.9 Implement RouteAnalysisPass - build complete route definitions
  - Create `RouteAnalysisPass` to build RouteArtifact
  - Reference response, validation, resource, and model artifacts
  - Include authentication and middleware metadata
  - **Acceptance Criteria:** RouteArtifact correctly references all related artifacts
  - **Files Modified/Created:** `RouteAnalysisPass.ts`, `RouteArtifactFactory.ts`
  - **Testing:** Tests verifying artifact references are valid
  - **Estimated Time:** 6 hours

- [ ] 3.10 Implement ArtifactIntegrationPass - validate cross-references
  - Create `ArtifactIntegrationPass` to validate all artifact references
  - Check referential integrity (no dangling IDs)
  - Validate confidence scores and quality metrics
  - **Acceptance Criteria:** Detects missing references, produces clear errors
  - **Files Modified/Created:** `ArtifactIntegrationPass.ts`, `ArtifactValidator.ts`
  - **Testing:** Tests with invalid artifact references
  - **Estimated Time:** 5 hours

- [ ] **Phase 3 Checkpoint:** Verify compiler generates all artifact types
  - Run compiler on test project, verify all artifacts created
  - Run: `npm run test -- packages/core/src/compiler/passes`
  - Verify: 95%+ coverage on pass implementations
  - **Estimated Time:** 2 hours

---

## Phase 4: Writers Implementation (Week 7-8) - 9 Tasks

### 10. Implement ManifestWriter (Backward Compatibility)

- [ ] 4.1 Create ManifestWriter for routesync.manifest.json
  - Create `ManifestWriter` implementing Writer interface
  - Query artifacts from registry
  - Generate JSON in current manifest format
  - Include version "2.0.0"
  - **Acceptance Criteria:** Output identical to current RouteSync, all artifacts converted
  - **Files Modified/Created:** `ManifestWriter.ts`, `ManifestEmitter.ts`
  - **Testing:** Tests comparing output to current RouteSync generation
  - **Estimated Time:** 7 hours

### 11. Implement TypeScriptWriter

- [ ] 4.2 Create TypeScriptWriter generating types.ts
  - Create `TypeScriptWriter` for TypeScript output
  - Generate types.ts with all ResponseArtifact types
  - Include model types from ModelArtifact
  - Implement proper import statements and exports
  - **Acceptance Criteria:** types.ts compiles without errors, exports all types
  - **Files Modified/Created:** `TypeScriptWriter.ts`, `TypesEmitter.ts`
  - **Testing:** Generated types compile via `npx tsc`
  - **Estimated Time:** 8 hours

- [ ] 4.3 Implement API client generation (api.ts)
  - Create `ApiEmitter` to generate api.ts
  - Generate endpoint definitions with request/response types
  - Include HTTP method, path, authentication
  - Implement defineApi() function
  - **Acceptance Criteria:** api.ts compiles, endpoints correctly typed
  - **Files Modified/Created:** `ApiEmitter.ts`, `ApiClientGenerator.ts`
  - **Testing:** Generated api.ts compiles and runs
  - **Estimated Time:** 8 hours

- [ ] 4.4 Implement React Query hooks generation (hooks.ts)
  - Create `HooksEmitter` for React Query hooks
  - Generate useQuery hooks for GET endpoints
  - Generate useMutation hooks for POST/PUT/DELETE
  - Include proper type narrowing and error handling
  - **Acceptance Criteria:** hooks.ts compiles, hooks have correct types
  - **Files Modified/Created:** `HooksEmitter.ts`, `ReactQueryHooksGenerator.ts`
  - **Testing:** Generated hooks compile and have correct types
  - **Estimated Time:** 8 hours

### 12. Implement SDKWriter and Additional Writers

- [ ] 4.5 Create SDKWriter for JavaScript client library
  - Create `SDKWriter` for client.ts
  - Generate HTTP client with request/response helpers
  - Include automatic camelCase/snake_case transformation
  - Add authentication token management
  - **Acceptance Criteria:** client.ts exports usable HTTP client
  - **Files Modified/Created:** `SDKWriter.ts`, `SDKClientGenerator.ts`
  - **Testing:** SDK client works with mock API
  - **Estimated Time:** 7 hours

- [ ] 4.6 Create OpenAPIWriter for specification generation
  - Create `OpenAPIWriter` generating openapi.json
  - Build OpenAPI 3.0 specification from artifacts
  - Include all routes, schemas, authentication
  - **Acceptance Criteria:** openapi.json valid OpenAPI 3.0 spec
  - **Files Modified/Created:** `OpenAPIWriter.ts`, `OpenAPISpecBuilder.ts`
  - **Testing:** Generated spec validates against OpenAPI validator
  - **Estimated Time:** 8 hours

- [ ] 4.7 Create ZodWriter for validation schemas
  - Create `ZodWriter` generating schemas.ts
  - Convert ValidationArtifact to Zod validators
  - Generate schemas for all request types
  - **Acceptance Criteria:** schemas.ts exports all Zod validators
  - **Files Modified/Created:** `ZodWriter.ts`, `ZodSchemaGenerator.ts`
  - **Testing:** Generated schemas validate correctly
  - **Estimated Time:** 6 hours

### 13. Implement WriteCommand and Writer Management

- [ ] 4.8 Create WriteManager orchestrating all writers
  - Create `WriteManager` class to execute registered writers
  - Support multiple output formats via --format flag
  - Handle writer registration and lookup
  - **Acceptance Criteria:** WriteManager executes correct writers for formats
  - **Files Modified/Created:** `WriteManager.ts`, `WriterRegistry.ts`
  - **Testing:** Tests executing multiple writers
  - **Estimated Time:** 5 hours

- [ ] 4.9 Create WriteCommand for CLI integration
  - Create `WriteCommand` class for `routesync write` command
  - Accept artifacts.json and --format flag
  - Generate outputs for specified formats
  - Add progress indicators and error messages
  - **Acceptance Criteria:** `routesync write --format typescript` generates all files
  - **Files Modified/Created:** `WriteCommand.ts`, `CommandOrchestrator.ts`
  - **Testing:** End-to-end write command test
  - **Estimated Time:** 5 hours

- [ ] **Phase 4 Checkpoint:** Verify all writers generate valid output
  - Run writers on test artifacts, verify all outputs valid
  - Run: `npm run test -- packages/core/src/compiler/writers`
  - Verify: All generated TypeScript compiles
  - **Estimated Time:** 2 hours

---

## Phase 5: Integration and Optimization (Week 9-10) - 3 Tasks

### 14. CLI Integration and Backward Compatibility

- [ ] 5.1 Update CLI to use new pipeline internally
  - Modify `GenerateCommand` to run: scan → compile → write
  - Maintain backward compatibility (output identical to current)
  - Update help text and documentation
  - **Acceptance Criteria:** Old `routesync generate` works identically
  - **Files Modified/Created:** `GenerateCommand.ts`, `CLIOrchestrator.ts`
  - **Testing:** Comparison test: old output vs new pipeline output
  - **Estimated Time:** 6 hours

- [ ] 5.2 Add new granular CLI commands (compile, write)
  - Implement `CompileCommand` for intermediate compilation
  - Implement `WriteCommand` for independent writing
  - Update CLI help and examples
  - **Acceptance Criteria:** New commands work standalone, documented
  - **Files Modified/Created:** `CompileCommand.ts`, `WriteCommand.ts`, CLI definitions
  - **Testing:** Tests for each new command
  - **Estimated Time:** 5 hours

### 15. Performance Optimization

- [ ] 5.3 Profile and optimize generation performance
  - Implement Arena-based allocation for AST nodes
  - Add incremental compilation support
  - Optimize pass execution and caching
  - Benchmark: 1000 routes < 15 seconds, < 512MB memory
  - **Acceptance Criteria:** Performance targets met, profiling data documented
  - **Files Modified/Created:** `ASTArena.ts`, `PerformanceOptimizations.ts`, profiling results
  - **Testing:** Performance tests verifying targets
  - **Estimated Time:** 8 hours

### 16. Documentation and Release Preparation

- [ ] 5.4 Complete documentation and testing
  - Update architecture documentation
  - Create migration guide from old to new pipeline
  - Document all artifact types and writers
  - Update examples and tutorials
  - Run full test suite: `npm test`
  - **Acceptance Criteria:** Documentation complete, all tests pass (95%+ coverage)
  - **Files Modified/Created:** docs/, README, MIGRATION.md
  - **Testing:** Full test suite, 95%+ coverage, zero breaking changes
  - **Estimated Time:** 8 hours

- [ ] **Final Checkpoint:** Complete refactoring validation
  - Verify all requirements met
  - Performance benchmarks achieved
  - Zero breaking changes verified
  - Release preparation
  - **Estimated Time:** 3 hours

---

## Notes

- **Each task:** 4-8 hours of focused work
- **Testing:** Unit tests created alongside implementation, not after
- **Code review:** Required between phases for quality gates
- **Documentation:** Updated continuously, not deferred to end
- **Performance:** Profiled during Phase 5, optimized before release

---

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2", "1.3", "1.4"]
    },
    {
      "id": 1,
      "tasks": ["1.5", "1.6", "1.7"]
    },
    {
      "id": 2,
      "tasks": ["1.8"]
    },
    {
      "id": 3,
      "tasks": ["2.1", "2.2"]
    },
    {
      "id": 4,
      "tasks": ["2.3", "2.4", "2.5", "2.6", "2.7"]
    },
    {
      "id": 5,
      "tasks": ["2.8"]
    },
    {
      "id": 6,
      "tasks": ["3.1", "3.2"]
    },
    {
      "id": 7,
      "tasks": ["3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10"]
    },
    {
      "id": 8,
      "tasks": ["4.1"]
    },
    {
      "id": 9,
      "tasks": ["4.2", "4.3", "4.4"]
    },
    {
      "id": 10,
      "tasks": ["4.5", "4.6", "4.7"]
    },
    {
      "id": 11,
      "tasks": ["4.8", "4.9"]
    },
    {
      "id": 12,
      "tasks": ["5.1", "5.2"]
    },
    {
      "id": 13,
      "tasks": ["5.3"]
    },
    {
      "id": 14,
      "tasks": ["5.4"]
    }
  ]
}
```

## Summary

**Total Tasks:** 36 concrete, actionable tasks  
**Total Estimated Time:** ~280 hours (10 weeks @ 40 hrs/week with 1 dev, or 5 weeks with 2 devs)  
**Per-Phase Breakdown:**
- Phase 1: 8 tasks, 47 hours
- Phase 2: 8 tasks, 45 hours
- Phase 3: 10 tasks, 65 hours
- Phase 4: 9 tasks, 62 hours
- Phase 5: 3 tasks, 32 hours

**Testing Strategy:**
- Each task includes unit tests (required)
- Phase checkpoints verify cross-component integration
- Final checkpoint validates complete pipeline
- Target: 95%+ code coverage on compiler, 80%+ overall

**Success Criteria:**
- All 36 tasks completed
- 95%+ test coverage on compiler layers
- Zero breaking changes to existing CLI
- Performance targets met (1000 routes: <15s, <512MB)
- Complete documentation and migration guide
