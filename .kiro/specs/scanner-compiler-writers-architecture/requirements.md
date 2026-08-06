# Requirements Document: Scanner-Compiler-Writers Architecture Refactoring

## Introduction

This document defines requirements for refactoring RouteSync's monolithic architecture into a **three-layer pipeline**: Scanner (fact extraction) → Compiler (semantic analysis) → Writers (code generation).

The refactoring addresses critical architectural issues:
- **LaravelRouteParser monolith** (~2000 lines, mixed concerns)
- **Multiple sources of truth** (parser vs compiler vs writers)
- **Poor testability** (tangled dependencies)
- **Limited extensibility** (adding writers requires parser changes)

By implementing this architecture, RouteSync achieves:
- Single source of truth via **ArtifactRegistry**
- Clean separation of concerns across three layers
- Independent testability of each component
- Extensible writer system for new output formats
- 10% faster generation, 20% less memory usage

## Glossary

- **Scanner**: Layer 1 - Extracts raw facts from Laravel without inference
- **Compiler**: Layer 2 - Performs semantic analysis, produces typed artifacts
- **Writers**: Layer 3 - Consume artifacts, generate backend outputs
- **Artifact**: Typed analysis result from compiler (e.g., ResponseArtifact, ValidationArtifact)
- **ArtifactRegistry**: Central storage for all artifacts, single source of truth
- **RawManifest**: Scanner output - deterministic facts only, no inference
- **Pass**: Compiler analysis phase (e.g., ResponseAnalysisPass)
- **Pass Graph**: Dependency graph of compiler passes
- **CompilationContext**: Runtime context with registry and state tracking
- **Writer**: Component that generates backend output from artifacts
- **ManifestWriter**: Writer that generates routesync.manifest.json
- **TypeScriptWriter**: Writer that generates types.ts, api.ts, hooks.ts
- **SDKWriter**: Writer that generates client.ts for JavaScript SDK
- **OpenAPIWriter**: Writer that generates openapi.json specification
- **ZodWriter**: Writer that generates schemas.ts validation

## Functional Requirements

### Requirement 1: Scanner Layer - Fact Extraction

**User Story:** As an architect, I want the Scanner layer to extract raw facts from Laravel without performing any semantic inference, so that facts remain deterministic and can be independently analyzed by the Compiler layer.

#### Acceptance Criteria

1. THE LaravelRouteScanner SHALL parse routes/api.php and extract route definitions (method, path, controller, action) deterministically
2. WHEN a route file contains PHP route definitions, THE Scanner SHALL extract all routes without losing any metadata
3. THE Scanner SHALL reflect method signatures from controller classes and extract raw PHP source code
4. THE Scanner SHALL not infer response types, collections, or model names in the Scanner layer
5. THE Scanner SHALL extract raw return statements exactly as written in PHP code without transformation
6. THE Scanner SHALL parse FormRequest classes and extract validation rules deterministically
7. WHEN database models exist, THE Scanner SHALL query Laravel's Schema facade to extract column metadata
8. THE Scanner SHALL extract resource definitions and their properties from Resource classes
9. THE Scanner SHALL output RawManifest with deterministic, content-based structure (no timestamps)
10. THE Scanner SHALL produce output identical on repeated runs for the same Laravel project

### Requirement 2: Artifact Types - Typed Analysis Results

**User Story:** As a developer, I want typed artifact classes for each analysis result (ResponseArtifact, ValidationArtifact, ModelArtifact, etc.), so that the system has type safety and the compiler can store heterogeneous artifacts in a unified registry.

#### Acceptance Criteria

1. THE ResponseArtifact SHALL represent response type analysis with transport kind, confidence score, and reasoning
2. THE ValidationArtifact SHALL represent FormRequest validation rules with Zod-compatible structure
3. THE ResourceArtifact SHALL represent Resource class metadata including properties and model mapping
4. THE ModelArtifact SHALL represent Eloquent model schema with table name, columns, and relationships
5. THE RouteArtifact SHALL represent complete route definition with references to other artifacts
6. EVERY Artifact class SHALL have unique typeId for registry queries
7. EVERY Artifact SHALL include metadata (source file, line number, analysis confidence)
8. WHERE artifacts reference other artifacts, THE references SHALL use artifact IDs

### Requirement 3: ArtifactRegistry - Single Source of Truth

**User Story:** As the compiler, I want a unified ArtifactRegistry that stores all analysis results as the single source of truth, so that different components (compiler passes, writers) all read consistent data.

#### Acceptance Criteria

1. THE ArtifactRegistry SHALL store typed artifacts by type and ID
2. THE ArtifactRegistry SHALL provide typed put() method to store artifacts: `put<K extends ArtifactKey>(key: K, artifact: ArtifactRegistry[K]): void`
3. THE ArtifactRegistry SHALL provide typed query() method to retrieve artifacts: `query<T extends Artifact>(type: T['typeId']): T[]`
4. THE ArtifactRegistry SHALL provide findById() to retrieve artifact by ID
5. THE ArtifactRegistry SHALL validate all artifacts meet minimum quality standards before storage
6. THE ArtifactRegistry SHALL provide getStats() to report artifact counts and metrics
7. THE ArtifactRegistry SHALL provide export() method for serialization to writers
8. THE ArtifactRegistry SHALL not allow artifacts to reference IDs that don't exist (referential integrity)
9. WHERE writers query artifacts, THE writers SHALL read from ArtifactRegistry only, not from scanner or intermediate state

### Requirement 4: Compiler Passes - Orchestrated Analysis

**User Story:** As the compiler, I want analysis organized as configurable passes with explicit dependencies, so that analysis is incremental, testable, and can be extended without modifying core compilation logic.

#### Acceptance Criteria

1. THE CompilerPass interface SHALL define inputs (required artifacts) and outputs (produced artifacts)
2. THE PassManager SHALL execute passes in dependency order based on input/output declarations
3. THE ResponseAnalysisPass SHALL infer response types from method source code using StatementIRLayer
4. THE ResponseAnalysisPass SHALL track confidence scores and reasoning for each inference
5. THE ValidationAnalysisPass SHALL extract Zod-compatible schemas from FormRequest classes
6. THE ResourceAnalysisPass SHALL analyze Resource classes and extract property mappings
7. THE ModelAnalysisPass SHALL extract database schema via Laravel Schema facade
8. THE RouteAnalysisPass SHALL build complete RouteArtifact referencing all relevant artifacts
9. THE ArtifactIntegrationPass SHALL validate cross-references between artifacts
10. WHEN a pass fails, THE PassManager SHALL log error and continue with remaining passes (graceful degradation)

### Requirement 5: Writer System - Extensible Output Generation

**User Story:** As a developer, I want a Writer interface so that new output formats (gRPC, GraphQL, etc.) can be added without modifying Scanner or Compiler layers.

#### Acceptance Criteria

1. THE Writer interface SHALL define canWrite(artifact) and write(registry) methods
2. THE ManifestWriter SHALL generate routesync.manifest.json from artifacts for backward compatibility
3. THE TypeScriptWriter SHALL generate types.ts, api.ts, hooks.ts from artifacts
4. THE SDKWriter SHALL generate client.ts with HTTP client and query helpers
5. THE OpenAPIWriter SHALL generate openapi.json specification from artifacts
6. THE ZodWriter SHALL generate schemas.ts with Zod validation schemas
7. WHEN a new writer is implemented, THE writer SHALL require no changes to Scanner or Compiler
8. WHERE writers need format-specific logic, WRITERS SHALL encapsulate that logic and not leak to artifacts
9. THE WriteManager SHALL orchestrate all registered writers and execute in sequence

### Requirement 6: CLI Integration - Backward Compatible Pipeline

**User Story:** As a CLI user, I want the refactored architecture to integrate with existing CLI commands while providing new granular commands for advanced use cases.

#### Acceptance Criteria

1. THE `routesync scan` command SHALL output RawManifest to routesync.manifest.json
2. THE `routesync generate` command SHALL maintain backward compatibility (scan + compile + write)
3. WHEN `routesync generate` is executed, THE system SHALL internally: scan → compile → write manifest + typescript
4. THE `routesync compile` command (NEW) SHALL take RawManifest and output artifacts.json
5. THE `routesync write` command (NEW) SHALL take artifacts and generate outputs with --format flag
6. THE `routesync write --format typescript` SHALL generate types.ts, api.ts, hooks.ts
7. THE `routesync write --format manifest` SHALL generate routesync.manifest.json
8. THE `routesync write --format openapi` SHALL generate openapi.json
9. WHERE users run old commands, THE system SHALL produce identical output as current version

### Requirement 7: Backward Compatibility - Manifest Format

**User Story:** As a user of existing RouteSync, I want generated manifests to maintain the current JSON format, so that existing tools and integrations continue working.

#### Acceptance Criteria

1. THE ManifestWriter SHALL generate routesync.manifest.json in current format
2. THE manifest version field SHALL indicate "2.0.0" for refactored architecture
3. WHEN ManifestWriter generates manifest from artifacts, THE format SHALL be identical to current RouteSync output
4. WHERE ManifestWriter encounters missing artifact data, THE ManifestWriter SHALL include default fallback values
5. THE CLI `routesync generate` SHALL output manifest compatible with existing integrations

### Requirement 8: Type Safety - Artifact Factory Pattern

**User Story:** As a compiler pass, I want typed builders (ArtifactBuilders) for creating artifacts with validated fields, so that artifact creation is type-safe and cannot accidentally create invalid artifacts.

#### Acceptance Criteria

1. THE ResponseArtifactBuilder SHALL provide fluent API: `new ResponseArtifactBuilder().resource(...).confidence(...).build()`
2. THE ArtifactBuilder SHALL validate all required fields before build()
3. THE ArtifactBuilder SHALL throw TypeError if required fields missing or invalid
4. WHERE artifacts require cross-references, THE builder SHALL accept artifact IDs and validate they exist

### Requirement 9: Testing Support - Independent Component Testing

**User Story:** As a test writer, I want each layer (Scanner, Compiler, Writers) to be independently testable with minimal mocking, so that tests are fast and maintainable.

#### Acceptance Criteria

1. THE Scanner tests SHALL test independently with only filesystem I/O
2. THE Compiler tests SHALL test with mock artifacts without needing actual Laravel app
3. THE Writer tests SHALL test with mock registry without needing compiler
4. EVERY test for a pass SHALL test input/output contracts independently
5. WHEN a pass reads artifacts, THE test SHALL provide mock artifacts via registry

### Requirement 10: Performance - Generation Speed & Memory

**User Story:** As an enterprise user with 1000+ routes, I want generation to be fast and memory-efficient, so that CI/CD pipelines complete in reasonable time.

#### Acceptance Criteria

1. THE system SHALL generate SDK for 1000 routes within 15 seconds
2. THE system SHALL use less than 512MB peak memory for 1000 routes
3. THE system SHALL not leak memory during batch processing
4. THE Compiler passes SHALL use Arena allocation for shared AST nodes (memory efficiency)
5. WHEN manifests are unchanged, THE system SHALL use incremental compilation to skip re-analysis

### Requirement 11: Error Handling - Comprehensive Reporting

**User Story:** As a user, I want clear error messages when compilation or writing fails, so that I can understand and fix problems quickly.

#### Acceptance Criteria

1. WHEN Scanner cannot read a file, THE error SHALL include file path and permission details
2. WHEN a pass fails, THE error SHALL include pass name, affected routes, and recovery options
3. WHEN artifacts are invalid, THE error SHALL identify which artifact and which field is invalid
4. WHEN a writer fails, THE error SHALL indicate which output format and file is problematic
5. THE system SHALL collect all non-fatal errors and report together (not fail on first error)

## Non-Functional Requirements

### Modularity & Separation of Concerns

1. THE Scanner SHALL NOT contain inference logic or type analysis
2. THE Compiler SHALL NOT contain backend formatting or output generation logic
3. THE Writers SHALL NOT contain analysis logic or manifest parsing
4. EVERY component < 500 lines of code (except artifact definitions)

### Type Safety

1. ALL components SHALL use TypeScript strict mode
2. NO implicit `any` types allowed
3. EVERY artifact class SHALL be explicitly typed
4. EVERY registry query SHALL return typed results

### Testability

1. ALL units SHALL have > 80% line coverage
2. COMPILER passes SHALL have > 90% coverage
3. ALL integration points SHALL be tested
4. NO hard-coded file paths or environment assumptions

### Documentation

1. EVERY artifact type SHALL have JSDoc with field descriptions
2. EVERY pass SHALL have documentation of inputs/outputs
3. EVERY writer SHALL have usage examples
4. ARCHITECTURE guide SHALL be maintained

### Backward Compatibility

1. EXISTING CLI commands SHALL produce identical output
2. EXISTING manifest format SHALL be supported
3. NO breaking changes to public API

## Constraints & Assumptions

### Constraints

- **C1**: Scanner must output deterministic results (no timestamps, content-hash only)
- **C2**: Compiler passes must be independent and composable
- **C3**: Writers must not modify artifacts or global state
- **C4**: ArtifactRegistry must support 1000+ artifacts efficiently
- **C5**: Migration must maintain 100% backward compatibility

### Assumptions

- **A1**: Laravel project has accessible routes/api.php
- **A2**: Database is queryable for model schema
- **A3**: FormRequest classes follow Laravel conventions
- **A4**: Resource classes use standard naming (ModelResource → Model)
- **A5**: PHP 8.1+ available for reflection

## Success Criteria

### Code Metrics

- [ ] LaravelRouteParser reduced from 2000 to 300 lines
- [ ] All compiler passes < 250 lines each
- [ ] Test coverage: 95%+ for compiler, 80%+ overall
- [ ] Type safety: Zero implicit any types

### Functional Metrics

- [ ] All 5 artifact types implemented and tested
- [ ] All 5 writers implemented and tested
- [ ] All CLI commands backward compatible
- [ ] Scanner determinism verified (identical output on repeated runs)

### Performance Metrics

- [ ] 1000-route project: < 15 seconds generation
- [ ] 1000-route project: < 512MB peak memory
- [ ] Zero memory leaks in batch processing
- [ ] 10% speed improvement vs current version
- [ ] 20% memory reduction vs current version

### Quality Metrics

- [ ] All artifact references validated (no dangling IDs)
- [ ] Pass execution order provably correct
- [ ] Clear error messages for all failure cases
- [ ] Documentation complete and accurate

## Phase-Specific Requirements

### Phase 1: Infrastructure (Week 1-2)

**Requirement 1.1: Artifact Types & Registry**
- THE ResponseArtifact class SHALL be implemented
- THE ValidationArtifact class SHALL be implemented
- THE ResourceArtifact class SHALL be implemented
- THE ModelArtifact class SHALL be implemented
- THE RouteArtifact class SHALL be implemented
- THE ArtifactRegistry interface SHALL be implemented with put, query, findById methods
- ALL artifact types tested with 95%+ coverage

**Requirement 1.2: CompilationContext & Pass Interface**
- THE CompilationContext class SHALL hold ArtifactRegistry and pass execution state
- THE CompilerPass<I, O> generic interface SHALL define inputs and outputs
- THE PassGraph SHALL resolve dependencies between passes
- THE PassManager SHALL orchestrate pass execution

### Phase 2: Scanner Refactoring (Week 3-4)

**Requirement 2.1: LaravelRouteScanner Implementation**
- THE LaravelRouteScanner interface SHALL define scanRoutes() contract
- THE RawRoute type SHALL define fact-only fields (no inference)
- THE RawManifest type SHALL define scanner output format
- THE scanner SHALL output deterministic results (test repeated runs)
- SCANNER code SHALL be < 300 lines

**Requirement 2.2: Scanner Integration Testing**
- THE scanner SHALL pass 20+ test cases covering all route types
- THE scanner SHALL handle edge cases (closure routes, resource routes, grouped routes)
- THE scanner SHALL extract all metadata without losing information

### Phase 3: Compiler Refactoring (Week 5-6)

**Requirement 3.1: Analysis Passes**
- EVERY pass SHALL produce valid artifacts
- EVERY pass SHALL validate artifacts before storing in registry
- EVERY pass SHALL handle missing/incomplete data gracefully
- PASS execution order SHALL be provably correct

**Requirement 3.2: ResponseAnalysisPass**
- THE pass SHALL infer response types using 7-stage pipeline
- THE pass SHALL track confidence scores
- THE pass SHALL identify Resource, Model, JSON, and Primitive responses
- THE pass SHALL test with 30+ examples covering all inference cases

**Requirement 3.3: ValidationAnalysisPass**
- THE pass SHALL extract Zod-compatible schemas from FormRequest
- THE pass SHALL handle all Laravel validation rules
- THE pass SHALL map FormRequest rules to Zod validators

**Requirement 3.4: ResourceAnalysisPass**
- THE pass SHALL identify Resource classes
- THE pass SHALL map Resource properties to model columns
- THE pass SHALL detect conditional attributes

**Requirement 3.5: ArtifactIntegrationPass**
- THE pass SHALL validate all cross-references
- THE pass SHALL report missing references
- THE pass SHALL enforce referential integrity

### Phase 4: Writers Implementation (Week 7-8)

**Requirement 4.1: ManifestWriter**
- THE writer SHALL generate routesync.manifest.json format
- THE output SHALL be identical to current RouteSync generation
- THE writer SHALL preserve backward compatibility

**Requirement 4.2: TypeScriptWriter**
- THE writer SHALL generate types.ts with all artifact types
- THE writer SHALL generate api.ts with endpoint definitions
- THE writer SHALL generate hooks.ts with React Query hooks

**Requirement 4.3: SDKWriter**
- THE writer SHALL generate client.ts with HTTP client
- THE writer SHALL include query helpers

**Requirement 4.4: OpenAPIWriter**
- THE writer SHALL generate openapi.json in OpenAPI 3.0 format
- THE specification SHALL include all routes, schemas, and authentication

**Requirement 4.5: ZodWriter**
- THE writer SHALL generate schemas.ts with Zod validators
- THE schemas SHALL match FormRequest validation rules

### Phase 5: Integration & Deployment (Week 9-10)

**Requirement 5.1: CLI Integration**
- THE `routesync generate` command SHALL use new pipeline internally
- THE `routesync scan` command SHALL output RawManifest
- THE `routesync compile` command (NEW) SHALL produce artifacts
- THE `routesync write` command (NEW) SHALL generate outputs
- ALL commands SHALL be tested end-to-end

**Requirement 5.2: Performance Optimization**
- THE system SHALL meet all performance targets
- THE system SHALL be profiled and optimized
- MEMORY usage SHALL be benchmarked and documented

**Requirement 5.3: Documentation & Release**
- THE architecture guide SHALL be updated
- THE migration guide SHALL document the refactoring
- THE release notes SHALL highlight benefits
- THE examples SHALL be updated

