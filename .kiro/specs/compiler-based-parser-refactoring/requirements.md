# Requirements Document: Compiler-Based Parser Refactoring

## Introduction

Refactoring `LaravelRouteParser.ts` (~2000+ lines of regex-based code) menjadi compiler-based static analysis engine menggunakan existing compiler infrastructure. System akan menggunakan Layer-Oriented Architecture dengan Explicit Persistence yang reuse 5 dari 7 komponen existing compiler.

## Glossary

- **System**: CompilerBasedParser - new parser implementation
- **InputLayer**: Component untuk read PHP source code via reflection
- **TokenizationLayer**: Component untuk convert PHP source ke token sequences
- **StatementIRLayer**: Component untuk parse tokens ke structured IR
- **SemanticLayer**: Component untuk type resolution dan symbol table building
- **PersistenceLayer**: Component untuk cache analysis results
- **AnalysisEngine**: Component untuk apply Laravel-specific resolution rules
- **OutputAdapter**: Component untuk convert IR ke manifest.json format
- **LaravelRouteParser**: Existing regex-based parser yang akan di-replace
- **Manifest**: JSON file containing typed route metadata
- **Incremental Compilation**: Ability untuk re-analyze only changed methods
- **Analysis Pass**: Laravel-specific rule untuk detect patterns (Resource, Eloquent, etc.)

## Requirements

### Requirement 1: PHP Source Code Input Processing

**User Story:** As a RouteSync developer, I want to read PHP controller method source code via reflection, so that I can analyze method implementations without parsing entire files.

#### Acceptance Criteria

1. WHEN a controller class name and method name are provided, THE InputLayer SHALL return the complete PHP source code for that method
2. WHEN the same method is requested multiple times, THE InputLayer SHALL return cached results without re-executing reflection
3. WHEN method metadata is requested, THE InputLayer SHALL return parameters, return type, PHP 8 attributes, and docblock information
4. WHEN reflection fails for a non-existent method, THE InputLayer SHALL throw a descriptive error indicating the missing method
5. THE InputLayer SHALL integrate with existing LaravelRouteParser reflection logic without modification to existing code

### Requirement 2: PHP Tokenization

**User Story:** As a system developer, I want to tokenize PHP source code into structured token sequences, so that I can process syntax systematically instead of using regex.

#### Acceptance Criteria

1. WHEN PHP source code is provided, THE TokenizationLayer SHALL convert it to an array of token identifiers stored in Arena
2. THE TokenizationLayer SHALL map PHP token types (T_VARIABLE, T_STRING, etc.) to compiler AST node kinds
3. THE TokenizationLayer SHALL store tokens in compiler's ASTArena for memory-efficient access
4. WHEN token data is retrieved by ID, THE TokenizationLayer SHALL return complete token information including kind, text, and source position
5. THE TokenizationLayer SHALL reuse existing compiler Lexer and Arena infrastructure without creating duplicate implementations

### Requirement 3: Statement IR Construction

**User Story:** As a semantic analyzer, I want PHP statements parsed into structured IR nodes, so that I can analyze program structure programmatically.

#### Acceptance Criteria

1. WHEN tokens are provided, THE StatementIRLayer SHALL parse them into SemanticIR nodes representing assignments, method calls, and returns
2. THE StatementIRLayer SHALL detect Laravel-specific patterns including Eloquent method calls (find, findOrFail, create), Resource instantiation (new UserResource), and Resource collection calls (UserResource::collection)
3. THE StatementIRLayer SHALL create IR nodes using existing SemanticIRArena infrastructure
4. WHEN an unsupported statement type is encountered, THE StatementIRLayer SHALL throw an error indicating the unsupported statement
5. THE StatementIRLayer SHALL map PHP expressions to compiler Expression types (Literal, MethodCall, Variable, etc.)

### Requirement 4: Type Resolution and Symbol Table

**User Story:** As a type inference system, I want to resolve PHP types to TypeScript equivalents and track variable assignments, so that I can determine response types accurately.

#### Acceptance Criteria

1. WHEN statements are analyzed, THE SemanticLayer SHALL build a symbol table tracking all variable names and their types
2. THE SemanticLayer SHALL resolve Eloquent static method calls (User::findOrFail) to the corresponding model class (User)
3. THE SemanticLayer SHALL infer Resource types from Resource class instantiation patterns
4. WHEN type inference fails, THE SemanticLayer SHALL fallback to compiler's TypeSystem.inferType() method
5. THE SemanticLayer SHALL extract Laravel model names from fully qualified class names (App\Models\User → User)
6. THE SemanticLayer SHALL integrate EloquentRegistry for Laravel-specific model metadata

### Requirement 5: Analysis Result Caching

**User Story:** As a performance optimizer, I want to cache analysis results per method, so that unchanged methods don't require re-analysis during incremental compilation.

#### Acceptance Criteria

1. WHEN analysis results are stored, THE PersistenceLayer SHALL save them in both memory cache (fast access) and query database (persistent storage)
2. WHEN cached results are requested, THE PersistenceLayer SHALL check memory cache first, then query database if not found
3. THE PersistenceLayer SHALL invalidate cache for a specific method when its source code changes
4. WHEN cache statistics are requested, THE PersistenceLayer SHALL return hit rate, miss count, and cache size metrics
5. THE PersistenceLayer SHALL support TTL (time-to-live) configuration for cache entries
6. THE PersistenceLayer SHALL integrate with compiler's ArtifactCache and QueryDatabase infrastructure

### Requirement 6: Laravel Pattern Analysis

**User Story:** As a Laravel route analyzer, I want to detect Laravel-specific patterns (Resource, Eloquent, FormRequest) in controller methods, so that I can generate accurate API metadata.

#### Acceptance Criteria

1. WHEN analysis is performed, THE AnalysisEngine SHALL run 5 analysis passes in priority order: Resource Detection (100), Eloquent Detection (90), Mixin Resolution (80), FormRequest Validation (70), Collection Detection (60)
2. THE AnalysisEngine SHALL detect Resource instantiation patterns (new UserResource($user), UserResource::make($user))
3. THE AnalysisEngine SHALL detect Eloquent method patterns (find, findOrFail, first, create, update, all, paginate, get, where)
4. THE AnalysisEngine SHALL parse @mixin docblock annotations from Resource classes to resolve model associations
5. THE AnalysisEngine SHALL detect collection responses from ::collection() calls and pagination methods (paginate, all, get)
6. THE AnalysisEngine SHALL detect array return patterns and infer response shape from array keys
7. THE AnalysisEngine SHALL integrate with compiler's AnalysisManager infrastructure for pass registration and execution

### Requirement 7: Resource Detection Rule

**User Story:** As a pattern detector, I want to identify when controller methods return Laravel Resources, so that response metadata accurately reflects resource-based responses.

#### Acceptance Criteria

1. WHEN a return statement contains new UserResource($var), THE AnalysisEngine SHALL detect it as a resource response with resourceName='UserResource'
2. WHEN a return statement contains UserResource::make($var), THE AnalysisEngine SHALL detect it as a resource response
3. WHEN a return statement contains UserResource::collection($var), THE AnalysisEngine SHALL detect it as a collection resource response
4. THE AnalysisEngine SHALL extract model name from resource name by removing 'Resource' suffix (UserResource → User)
5. THE AnalysisEngine SHALL mark responses as collection=false for single resource instantiation and collection=true for ::collection() calls

### Requirement 8: Eloquent Pattern Detection Rule

**User Story:** As a model detector, I want to identify Eloquent model method calls, so that I can infer response model types from database queries.

#### Acceptance Criteria

1. WHEN variable assignment uses Model::find($id), THE AnalysisEngine SHALL detect it as model retrieval with model name extracted from class name
2. WHEN variable assignment uses Model::findOrFail($id), THE AnalysisEngine SHALL detect it as model retrieval
3. WHEN method calls use paginate(), get(), or all(), THE AnalysisEngine SHALL mark the response as returnsCollection=true
4. THE AnalysisEngine SHALL detect Eloquent methods: find, findOrFail, first, create, update, all, paginate, get, where
5. THE AnalysisEngine SHALL extract model class name from static method call receiver

### Requirement 9: Mixin Docblock Resolution Rule

**User Story:** As a metadata resolver, I want to parse @mixin annotations in Resource classes, so that model associations are correctly identified even when resource names don't match model names.

#### Acceptance Criteria

1. WHEN a Resource class has @mixin \App\Models\User annotation, THE AnalysisEngine SHALL resolve the associated model as User
2. THE AnalysisEngine SHALL extract full class name from @mixin annotation (\App\Models\User)
3. THE AnalysisEngine SHALL extract short model name from full class name (User)
4. WHEN no @mixin annotation exists, THE AnalysisEngine SHALL fallback to resource name-based inference
5. THE AnalysisEngine SHALL override resource name-based model inference when @mixin annotation is present

### Requirement 10: Collection Detection Rule

**User Story:** As a collection detector, I want to identify when responses return multiple items, so that array vs single item response types are correctly inferred.

#### Acceptance Criteria

1. WHEN return statement contains UserResource::collection($var), THE AnalysisEngine SHALL mark response as collection=true
2. WHEN Eloquent method returns multiple items (paginate, all, get), THE AnalysisEngine SHALL mark response as returnsCollection=true
3. THE AnalysisEngine SHALL detect collection from static method call with method name 'collection'
4. THE AnalysisEngine SHALL extract resource name from collection call (UserResource::collection → UserResource)
5. THE AnalysisEngine SHALL distinguish between single item responses (collection=false) and multiple item responses (collection=true)

### Requirement 11: Manifest Output Generation

**User Story:** As a manifest generator, I want to convert compiler IR and analysis results to manifest.json format, so that existing RouteSync SDK generation can consume the output.

#### Acceptance Criteria

1. WHEN analysis results and resolved types are provided, THE OutputAdapter SHALL generate a Partial<ParsedRoute> object matching existing manifest schema
2. THE OutputAdapter SHALL include response kind (resource, model, object, primitive) in manifest output
3. THE OutputAdapter SHALL include model name, resource name, and collection flag when applicable
4. THE OutputAdapter SHALL derive transport type (resource, json) and shape (single, collection) from analysis results
5. THE OutputAdapter SHALL include nullable and paginated flags when detected in analysis
6. THE OutputAdapter SHALL prioritize Resource detection over Eloquent detection over array detection when multiple patterns exist
7. THE OutputAdapter SHALL fallback to kind='primitive' when no Laravel patterns are detected

### Requirement 12: Incremental Compilation Support

**User Story:** As a developer, I want methods that haven't changed to skip re-analysis, so that large codebases can be processed quickly during development.

#### Acceptance Criteria

1. WHEN a method's source code hash matches cached hash, THE System SHALL return cached analysis results without re-running analysis
2. WHEN a Resource class changes, THE System SHALL invalidate cache for all controller methods that return that Resource
3. WHEN incremental compilation is requested, THE System SHALL analyze only methods with cache misses or invalidated cache
4. THE System SHALL complete incremental re-analysis of a single changed method in under 50ms
5. THE System SHALL achieve >80% cache hit rate during typical development workflows with <10% code changes

### Requirement 13: Migration Compatibility

**User Story:** As a RouteSync maintainer, I want the new parser to be drop-in compatible with existing regex parser, so that migration can be gradual and reversible.

#### Acceptance Criteria

1. THE CompilerBasedParser SHALL accept the same input parameters as existing LaravelRouteParser
2. THE CompilerBasedParser SHALL return manifest output in identical format to existing parser
3. WHEN feature flag COMPILER_BASED_PARSER=false, THE System SHALL use existing regex-based parser
4. WHEN feature flag COMPILER_BASED_PARSER=true, THE System SHALL use new compiler-based parser
5. THE System SHALL support parallel validation mode running both parsers and logging differences
6. WHEN rollback is needed, THE System SHALL switch back to regex parser via environment variable without code changes

### Requirement 14: Performance Targets

**User Story:** As a performance engineer, I want the new parser to process methods within acceptable time limits, so that developer experience isn't degraded.

#### Acceptance Criteria

1. THE System SHALL complete initial analysis of a single method within 33ms (10% slower than baseline 30ms acceptable)
2. THE System SHALL complete incremental re-analysis of a changed method within 50ms
3. THE System SHALL process 1000 routes using under 300MB peak memory (100MB increase over baseline acceptable)
4. THE System SHALL achieve >80% cache hit rate during incremental compilation
5. WHEN analyzing unchanged methods, THE System SHALL return cached results in under 5ms

### Requirement 15: Error Handling and Debugging

**User Story:** As a developer debugging parsing failures, I want detailed error messages and IR traces, so that I can understand why analysis failed.

#### Acceptance Criteria

1. WHEN tokenization fails, THE System SHALL throw SemanticResolutionError with source location and problematic code snippet
2. WHEN type inference fails, THE System SHALL log warning with type name and available context information
3. WHEN analysis passes fail, THE System SHALL indicate which pass failed and provide context about the statement being analyzed
4. THE System SHALL support DEBUG mode that outputs intermediate IR after each layer for inspection
5. WHEN cache corruption occurs, THE System SHALL detect it and rebuild cache automatically without crashing

### Requirement 16: Testing Coverage

**User Story:** As a quality engineer, I want comprehensive test coverage for all Laravel patterns, so that refactoring doesn't introduce regressions.

#### Acceptance Criteria

1. THE System SHALL maintain >80% line coverage for all new code
2. THE System SHALL pass 100% of existing LaravelRouteParser integration tests without modification
3. THE System SHALL include unit tests for all 7 layer components (Input, Tokenization, StatementIR, Semantic, Persistence, Analysis, Output)
4. THE System SHALL include integration tests for all 5 Laravel pattern detection rules
5. THE System SHALL include regression tests comparing compiler-based output to regex-based output on 100+ real controller methods
6. THE System SHALL include performance benchmarks measuring parsing speed per method and cache hit rates

### Requirement 17: Phased Migration Execution

**User Story:** As a project manager, I want the migration to happen in controlled phases with validation gates, so that risks are minimized.

#### Acceptance Criteria

1. WHEN Phase 1 (Foundation) completes, THE System SHALL successfully convert PHP source to token streams for 100+ test methods
2. WHEN Phase 2 (Statement IR) completes, THE System SHALL successfully parse full method bodies to IR for 100+ test methods
3. WHEN Phase 3 (Semantic Resolution) completes, THE System SHALL successfully resolve types and build symbol tables with <5% error rate
4. WHEN Phase 4 (Analysis Rules) completes, THE System SHALL detect all Laravel patterns with >95% accuracy compared to regex parser
5. WHEN Phase 5 (Integration) completes, THE System SHALL pass all existing integration tests and parallel validation shows <1% differences
6. WHEN Phase 6 (Optimization) completes, THE System SHALL meet all performance targets and old regex code SHALL be removed from codebase

### Requirement 18: Round-Trip Property Preservation

**User Story:** As a correctness validator, I want to ensure no data loss during IR transformations, so that manifest output is accurate.

#### Acceptance Criteria

1. FOR ANY valid PHP method source, tokenizing then reconstructing source SHALL preserve semantic meaning
2. FOR ANY valid token sequence, converting to StatementIR then back to tokens SHALL preserve statement structure
3. FOR ANY valid analysis result, converting to manifest then parsing manifest SHALL preserve response metadata
4. THE System SHALL preserve method name, class name, and parameters throughout entire pipeline
5. THE System SHALL preserve response kind, model name, resource name, and collection flag from analysis to manifest output

