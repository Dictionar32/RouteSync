# Known Issues & Bug History

### Issue 46: Elevation of Upstream Incremental Scanner (`ScannedRoute` & `ScannedResource`) to Level 7 Higher-Level Domain Models
**Symptom** → `ScannedRoute` and `ScannedResource` in `packages/cli/src/utils/incremental/incrementalTypes.ts` suffered from high porosity (12 `?:`, 7 `| null`, 5 naked `Record<string, unknown>`), forcing downstream files (`fieldResolver.ts`, `routeResolver.ts`, `incrementalEngine.ts`, and `driftAuditor.ts`) into defensive null guards and type assertions.
**Where** → `packages/cli/src/utils/incremental/` and `packages/cli/src/index.ts`.
**Root cause** → Incremental cache and route scanning models relied on loose JSON-like property bags with sentinel `null` unions and unbranded primitive atoms.
**Fix** → 
1. Created nominal branded atoms in `nominalAtoms.ts` (`ScannedRouteMethod`, `ScannedRoutePath`, `ScannedRouteName`, `ScannedStableHash`, `SourceFilePath`, `SourceLineNumber`) with `NominalAtomFactory`.
2. Created catamorphic Response Payload ADT (`PrimitiveResponsePayloadContract`, `ObjectResponsePayloadContract`, `ArrayResponsePayloadContract`, `ResourceResponsePayloadContract`, `UnknownResponsePayloadContract`) and $O(1)$ table dispatcher `matchRouteResponsePayload` (0 `if`, 0 `switch`).
3. Replaced naked `Record`s and `| null` sentinels with Complete Contracts (`ScannedRouteContract`, `ScannedResourceContract`, `ScannedManifestContract`) utilizing immutable entry tuples `readonly (readonly [K, V])[]`.
4. Implemented first-class frozen descriptors (`ScannedRouteDescriptor`, `ScannedResourceDescriptor`, `ScannedManifestDescriptor`) with 100% direct assignment constructors, static semantic factories (`.create()`, `.fromRaw()`, `.empty()`), and synchronized backward-compatible facade getters.
5. Decomposed and slimmed `routeResolver.ts`, `fieldResolver.ts`, and `incremental.ts` down to strictly $\le 100$ lines per Rule 14.
**Regression test** → `packages/sdk/tests/incrementalHigherLevelModelsSSOT.spec.ts` › `Level 7 Higher-Level Domain Models for Incremental Scanner (SSOT)`
**Status** → Diagnosed & Fixed

---


### Issue 45: Elimination of Repository Worst Porosity Interface (`SparseRouteParams`, Score 56) via Level 7 RouteBoundaryContractFactory
**Symptom** → `SparseRouteParams` had the highest porosity score in the repository (Score 56, 28 optional fields out of 31 fields), forcing downstream boundary builders (`boundaryBasics.ts`, `identityBuilder.ts`, `bindingBuilder.ts`, `capabilityBuilder.ts`, `provenanceBuilder.ts`, and `RouteBoundaryAdapter.ts`) into defensive fallback branching and null-checks.
**Where** → `packages/core/src/compiler/scanner/resolvers/boundary/` and `packages/core/src/compiler/scanner/resolvers/RouteBoundaryAdapter.ts`.
**Root cause** → Perimeter parameter bag allowed 28 optional fields without an origin boundary factory to guarantee complete, non-nullable contract values.
**Fix** → 
1. Created `RouteBoundaryContractFactory` in `boundaryContractFactory.ts` strictly $\le 80$ lines per Rule 14, which absorbs options at the origin boundary, applies deterministic defaults, and returns a 100% complete, non-nullable, frozen `RouteBoundaryContract` (0 `?:`).
2. Replaced the loose 28-field porous `SparseRouteParams` with strongly-typed `RouteBoundaryOptions` requiring explicit `method` and `path`, preserving backward compatibility.
3. Enhanced `RouteBoundaryAdapter` with `fromBoundary(contract: RouteBoundaryContract)` alongside `fromSparse`.
4. Exported `RouteBoundaryContractFactory` and `RouteBoundaryOptions` across resolver sub-domain and core entry points.
**Regression test** → `packages/sdk/tests/routeBoundaryHardeningSSOT.spec.ts` › `Route Boundary Hardening & Level 7 Contract SSOT (Issue #45)`
**Status** → Diagnosed & Fixed

---

### Issue 44: Decomposition and Level 7 Hardening of Monolithic Semantic Types (`semantic.ts`)
**Symptom** → `packages/core/src/types/semantic.ts` was the #1 worst monolithic interface file in the codebase (914 lines violating Rule 14, Porosity Score 90 with 42 optional `?:` fields), containing porous models (`ModelNode`, `RouteNode`, `SemanticRelation`, `IRContext`) that leaked undefined and unbranded values across compiler graph and semantic resolution layers.
**Where** → `packages/core/src/types/semantic.ts` and `packages/core/src/types/semantic/`.
**Root cause** → Accumulation of legacy micro-AST definitions, unbranded nominal coordinates, and porous graph descriptors in a single monolithic 914-line file without modular single-responsibility decomposition.
**Fix** → 
1. Decomposed monolithic `semantic.ts` (914 lines) into 13 cohesive sub-modules in `packages/core/src/types/semantic/`, each strictly $\le 99$ lines per Rule 14.
2. Introduced branded nominal atoms in `nominalVocabulary.ts` (`SourceLineNumber`, `SourceColumnNumber`, `ModelNodeName`, `ServiceNodeName`, `ControllerNodeName`, `ConfidenceScore`) with validation creators.
3. Structured micro-AST nodes in `parsedAstTypes.ts` and created pure catamorphic table dispatcher `matchParsedAST` in `parsedAstAlgebra.ts` ($O(1)$ constant-time resolution with 0 `if`, 0 `switch`).
4. Replaced monolithic `semantic.ts` with a 9-line coordinating barrel preserving 100% backward compatibility for all existing imports.
**Regression test** → `packages/sdk/tests/semanticTypeHardeningSSOT.spec.ts` › `Semantic Type Hardening & Level 7 Constructors SSOT`
**Status** → Diagnosed & Fixed

---

### Issue 43: Decomposition and Level 7 Hardening of Worst Branching Interface (`ir.ts`)
**Symptom** → `packages/core/src/types/ir.ts` was ranked as the #1 worst interface file across the entire repository (Porosity Score 297, 125 optional `?:` fields, 13 naked `Record`s, 4 sentinel `null`s, and 1028 lines violating Rule 14), forcing downstream compilers and generators into defensive fallback branching and null-checks.
**Where** → `packages/core/src/types/ir.ts` and `packages/core/src/types/ir/`.
**Root cause** → Giant monolithic IR interface definition that accumulated loose bags, unbranded string identifiers, naked dictionary records, and sentinel nulls/undefined across RouteSync's intermediate representation layer.
**Fix** → 
1. Decomposed monolithic `ir.ts` (1028 lines) into 15 cohesive sub-modules in `packages/core/src/types/ir/`, each strictly $\le 95$ lines per Rule 14.
2. Introduced branded nominal atoms in `nominalVocabulary.ts` (`EndpointId`, `ResourceId`, `RequestId`, `RoutePath`, `HttpHeaderName`, `SourceLineNumber`, `HttpStatus`) with explicit creators.
3. Upgraded `ResolvedSemanticType` to closed ADT variants in `resolvedSemanticTypes.ts` with immutable entry tuples `propertyEntries: readonly (readonly [string, T])[]` replacing naked `Record<string, unknown>`.
4. Created frozen factory `ResolvedSemanticTypeFactory` with `Object.freeze` and pure catamorphic table dispatcher `matchResolvedSemanticTypeIR` with $O(1)$ constant-time resolution (0 `if`, 0 `switch`).
5. Replaced monolithic `ir.ts` with a clean 10-line coordinating barrel preserving 100% backward compatibility for all existing imports.
**Regression test** → `packages/sdk/tests/irTypeHardeningSSOT.spec.ts` › `IR Type Hardening & Level 7 Constructors SSOT`
**Status** → Diagnosed & Fixed

---

### Issue 42: Upstream Lexer Micro-AST Catamorphism & Level 7 Frozen ADT Descriptors with Branded Nominal Types
**Symptom** → Upstream lexer micro-AST (`PhpAst.ts`) was monolithic (>100 lines) with plain unfrozen object factories, naked numbers/strings, and lack of catamorphic algebra, forcing downstream binders (`fieldBinder.ts`, `resourceAstExpressionMapper.ts`) to use cascading `if` and `switch` statements. In addition, `RouteDef`, `ModelDef`, and `ResourceDef` lacked Level 7 frozen constructors with branded nominal atoms (`RoutePath`, `HttpVerb`, `HttpStatus`), leaving perimeter entities dependent on naked strings and property bags.
**Where** → `packages/core/src/compiler/scanner/lexer/`, `packages/core/src/compiler/scanner/binders/resource/fieldBinder.ts`, `packages/core/src/compiler/scanner/subscanners/resource/resourceAstExpressionMapper.ts`, `packages/core/src/types/domain/`.
**Root cause** → Porous upstream models without branded nominal atoms, unfrozen micro-AST factory nodes, and lack of table-driven catamorphism pattern matchers at the lexer boundary.
**Fix** → 
1. Modularized `PhpAst.ts` into 3 single-responsibility files strictly $\le 100$ lines: `phpAstTypes.ts` (branded types `SourceOffset`, `SourceLineNumber`, `AstIdentifier`), `phpAstFactory.ts` (frozen constructors with `Object.freeze`), and `phpAstAlgebra.ts` (constant-time $O(1)$ table-driven catamorphic projector `matchPhpAstValue`).
2. Converted downstream `fieldBinder.ts` (7 cascading `if` branches) and `resourceAstExpressionMapper.ts` (`switch (value.kind)`) to pure catamorphic projectors consuming `matchPhpAstValue` with 0 `if` and 0 `switch`.
3. Created Level 7 frozen ADT descriptors with explicit semantic factories: `RouteDefDescriptor` with branded `RoutePath` and `HttpVerb` (0 `undefined`, 0 `null`, 0 `?:`), `ResourceDefDescriptor`, and `ModelDefDescriptor` with immutable entry tuples replacing naked `Record<string, unknown>`.
4. Exported runtime descriptor classes and helpers cleanly in `packages/core/src/index.ts` and verified modular line counts ($\le 100$ lines).
**Regression test** → `packages/sdk/tests/upstreamLexerAdtAndDescriptorsSSOT.spec.ts` › `Upstream Lexer ADT & Level 7 Constructors SSOT`
**Status** → Diagnosed & Fixed

---

### Issue 41: Elimination of Sentinel Undefined & Null via Level 7 Subatomic Functors & Closed ADTs
**Symptom** → Previous hardening passes replaced `?:` with `| undefined` or `| null`, preserving sentinel undefined values and forcing downstream compiler passes into defensive branching (`if (x !== undefined)`).
**Where** → `packages/core/src/types/contract.ts`, `packages/core/src/types/response.ts`, `packages/core/src/types/semantic.ts`, `packages/core/src/compiler/ir/response/`, `packages/core/src/compiler/generators/contract-generation/response-field/types.ts`, `packages/cli/src/generators/classifier/`, `packages/cli/src/generators/normalizer/`.
**Root cause** → Primitive optionality encoding using union with `undefined` instead of Level 7 Monadic Functors (`TypeWrapper<Carrier>`), closed Discriminated Union ADT variants, and complete non-nullable sub-contracts.
**Fix** → 
1. `ResponseDescriptorContract`: Refactored into closed Discriminated ADT variants (`JsonTransportContract`, `BinaryTransportContract`, `StreamTransportContract`, `RedirectTransportContract`, `EmptyTransportContract`) with 0 `undefined`, 0 `null`, 0 `?:`.
2. `ResponseFieldContract`: Replaced optional bags with Monadic Functor `TypeWrapper<T>` and closed ADT variants (`PrimitiveResponseFieldContract`, `ObjectResponseFieldContract`, `ArrayResponseFieldContract`, `VariableResponseFieldContract`, `PropertyAccessResponseFieldContract`).
3. `SemanticRelationContract`: Transformed into closed Relational ADT (`BelongsToManyRelationContract`, `DirectRelationContract`, `MorphRelationContract`).
4. `RouteDefContract`, `ResourceDefContract`, `ModelDefContract`: Structured into 4 Complete Sub-Contracts (`RouteIdentityContract`, `RouteSecurityContract`, `RoutePayloadContract`, `RouteProvenanceContract`) with 100% non-nullable fields.
5. Decomposed oversized files into sub-100 line modules per Rule 14 (`routeEntityDefinition.ts`, `modelEntityDefinition.ts`, `responseDescriptorContract.ts`, `objectSchemaContracts.ts`, `frameworkRules.ts`, `classifiedRouteDescriptor.ts`, `resourceCrudMap.ts`, `normalizedEntities.ts`, `normalizedManifest.ts`).
**Regression test** → `packages/sdk/tests/subatomicLevel7Contracts.spec.ts` › `Level 7 Subatomic Discriminated ADT Contracts (Rule 15)`
**Status** → Diagnosed & Fixed

---

### Issue 40: Sweeping Hardening of Worst Branching Interfaces (Hall of Shame IPS Cleanup)
**Symptom** → Multiple domain interfaces across `packages/cli` and `packages/core` had critical porosity scores (IPS 100% - 200%) with sentinel `null`, naked `Record<string, unknown>`, and pervasive optional `?:` fields: `GrammarClosure` (200%), `ScannedManifest` (167%), `LaravelValidationIR` (150%), `TypeDefinition` (133%), `ScannedModel` (120%), `ScannedResource` (117%), `SemanticNode` (100%), `RuntimeAugmented` (89%), and `MinimalRouteDefinitionParams` (100%), forcing downstream modules to introduce defensive `if` guards.
**Where** → `packages/cli/src/parsers/php/ast/grammar.ts`, `packages/cli/src/commands/audit/driftAuditor.ts`, `packages/cli/src/utils/incremental/incrementalTypes.ts`, `packages/cli/src/generators/normalizer/normalizerTypes.ts`, `packages/core/src/types/request.ts`, `packages/core/src/types/ir.ts`.
**Root cause** → Loose typing and pervasive partial bags instead of closed contract boundaries and Discriminated Union ADTs.
**Fix** → 
1. `GrammarClosure`: eliminated `any[]` and strictly typed children AST nodes.
2. `ScannedManifest` & `ScannedRoute`: introduced `ScannedManifestContract` (0 `?:`) and eliminated all `| null` sentinels in `incrementalTypes.ts`.
3. `driftAuditor.ts`: removed duplicate porous `ScannedManifest` interface in favor of central `incrementalTypes`.
4. `normalizerTypes.ts`: extracted `semanticNormalizerTypes.ts` with `SemanticNodeContract` (0 `?:`), reducing file size to $\le 100$ lines and replacing naked records with strongly typed contracts.
5. `request.ts`: converted `MinimalRouteDefinitionParams` and `RouteDefinition` from porous interfaces to typed configurations while keeping `RouteDefinitionContract` as the 100% non-nullable SSOT.
6. `ir.ts`: added `TypeDefinitionContract` and `LaravelValidationIRContract`.
**Regression test** → `packages/sdk/tests/routeBoundaryContractSSOT.spec.ts`, `packages/sdk/tests/pureContractDrivenArchitectureSSOT.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 39: Porous Route Parameter Bag (SparseRouteParams IPS 137%) & Procedural String Hacking in Route Boundary
**Symptom** → `SparseRouteParams` interface contained 28 optional fields out of 30 and 13 `any` types (IPS 137%, worst in codebase), triggering defensive parameter guessing and procedural string hacking (`if (action.includes('@'))`) at the route boundary.
**Where** → `packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasics.ts`, `packages/core/src/compiler/scanner/descriptors/route/factories/actionRouteFactories.ts`, `packages/core/src/compiler/scanner/descriptors/route/factories/closureSyntheticFactories.ts`.
**Root cause** → Perimeter route parameter bags allowed untyped dictionaries and porous optional bags without complete closed contracts, leading to downstream re-inferencing of controller/action and weak type safety.
**Fix** → Introduced `RouteBoundaryContract` with 0 optional fields and 0 `any` (IPS 0%), eliminated all 13 `any` in `SparseRouteParams`, decomposed oversized factory files (`actionRouteFactories.ts`, `closureSyntheticFactories.ts`) into focused single-responsibility files under 100 lines (`controllerActionRouteFactory.ts`, `controllerReferenceRouteFactory.ts`, `closureRouteFactory.ts`, `syntheticRouteFactory.ts`), and streamlined `boundaryBasics.ts` from 119 to 79 lines.
**Regression test** → `packages/sdk/tests/routeBoundaryContractSSOT.spec.ts` › `Route Boundary Contract & Factories SSOT Suite`
**Status** → Diagnosed & Fixed

---

### Issue 38: Missing PHP Array Literals, Unary Operations, and Class Constants in AST Lowering
**Symptom** → PHP array literals (`['a' => 1]`), negative numbers/unary operations (`-$amount`), and class constants (`Status::ACTIVE`) in PHP code or JsonResources silently fell back to `unknown` or failed to resolve in `nodeMapper.ts`.
**Where** → `packages/cli/src/parsers/php/nodeMapper.ts`, `packages/core/src/types/domain/phpAst/`.
**Root cause** → The AST parser lacked grammar and semantic definitions for array expressions, unary operations, and class constants, dropping unhandled nodes to fallback.
**Fix** → Added `ArrayAstNode`, `UnaryAstNode`, and `StaticConstantAstNode` to ADT #32 (`PhpAstKind`), implemented catamorphic grammar adapters, and added bottom-up tree folding in `algebra/fieldNodeAlgebra.ts`.
**Regression test** → `packages/sdk/tests/phpAstAlgebraSSOT.spec.ts` › `folds PhpAstNode bottom-up using pure F-Algebra (foldPhpAstNode)`
**Status** → Diagnosed & Fixed

---

### Issue 37: Database Column & Eloquent Cast Type Mapping Procedural Branching & Sentinel Null
**Symptom** → `resolvers.ts` contained 16 procedural `if` branches, returned sentinel `null`, and relied on naked `Record<string, ...>` dictionaries in `DatabaseColumnTypeMapper` and `EloquentTypeMapper`.
**Where** → `packages/cli/src/generators/canonical/type-mapping/resolvers.ts`, `packages/core/src/types/domain/databaseColumns.ts`, `packages/core/src/types/domain/eloquentTypes.ts`.
**Root cause** → Type mapping was implemented as procedural regex and string checks with null fallbacks instead of leveraging Level 6 Core ADT catamorphisms and First-Class Symbol Tables.
**Fix** → Replaced `Record<string, ...>` in `DatabaseColumnTypeMapper` and `EloquentCastMapper` with `ReadonlyMap`, created `visitors.ts` with exhaustive `SQL_TYPE_VISITOR` and `CAST_TYPE_VISITOR`, and reduced `resolvers.ts` from 113 lines (16 `if`s) to 40 lines (0 `if`, 0 `switch`, 0 `Record`).
**Regression test** → `packages/sdk/tests/resolversZeroBranchingSSOT.spec.ts` › `Zero Branching Code Verification`
**Status** → Diagnosed & Fixed

---

### Issue 36: Boolean Literal Inversion in PHP AST Node Mapping
**Symptom** → Parsing PHP boolean literals inverted their values: `true` became `false` and `false` became `true` in generated field schemas.
**Where** → `packages/cli/src/parsers/php/nodeMapper.ts` (line 132).
**Root cause** → Line 132 incorrectly used `value: !node.value` instead of `Boolean(node.value)` (or `!!node.value`).
**Fix** → Fixed in `algebra/fieldNodeAlgebra.ts` by preserving boolean literals using `Boolean(node.value)`.
**Regression test** → `packages/sdk/tests/phpAstAlgebraSSOT.spec.ts` › `verifies boolean literal preservation without inversion (Issue #36 regression)`
**Status** → Diagnosed & Fixed

---

### Issue 35: Hardcoded API Version Prefix ("v1") in Route Resolvers and CRUD Classifier
**Symptom** → Routes with API versioning other than v1 (such as `/api/v2/products` or `/api/v3/orders/{id}`) failed to strip the version prefix, causing `RouteDomainResolver` to emit domain names like `v2Products` instead of `products`, and causing `RouteCrudClassifier` to misclassify standard CRUD index/show routes as `CrudRole.Custom`.
**Where** → `packages/core/src/compiler/scanner/resolvers/RouteCrudClassifier.ts`, `packages/core/src/compiler/scanner/resolvers/RouteDomainResolver.ts`, `packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasics.ts`, `packages/core/src/compiler/scanner/subscanners/request-deriver/domainExtractor.ts`.
**Root cause** → The static segment filter hardcoded exact equality check `s !== "v1"` instead of using a universal version regex `!/^v\d+$/i.test(s)`.
**Fix** → Replaced hardcoded `s !== "v1"` with universal regex check `!/^v\d+$/i.test(s)` across all 4 route boundary resolvers.
**Regression test** → `packages/sdk/tests/crudRoleAdtFlowSSOT.spec.ts` › `9. Universal API version handling (v1, v2, v3) without hardcoded version strings`
**Status** → Diagnosed & Fixed

---

### Issue 34: Upstream StaticLaravelScanner Enhancements (Laravel 11 Casts, Nested Prefixes, Invokables, Fluent Rules & Model Returns)
**Symptom** → Upstream project scanner omitted Laravel 11 `protected function casts(): array` casts (falling back to generic string/number column heuristics), flattened multi-nested route group prefixes into single-level prefixes, missed invokable controllers (`Route::get('/me', ProfileController::class)` omitting `__invoke`), failed to parse fluent validation rules (`Rule::in`, `Rule::unique`, `Rule::exists`) falling back to `custom`, and failed to detect direct Eloquent query builder returns (`Model::all()`, `Model::find()`).
**Where** → `packages/core/src/compiler/scanner/StaticLaravelScanner.ts` (`parseModelFile`, `scanRoutes`, `scanControllers`), `packages/core/src/types/route.ts` (`ValidationRuleParser.parse`, `EloquentCastMapper`).
**Root cause** → The static AST scanner lacked patterns for method-based `casts()` declaration, single-class invokable action route definitions, a hierarchical prefix stack for nested groups, fluent `Rule::` class regex extraction in `ValidationRuleParser`, and Eloquent query invocation returns in controller scanning.
**Fix** → 
1. Added scanner for Laravel 11 `protected function casts(): array` and enriched `EloquentCastMapper` with modern casts (`hashed`, `asarrayobject`, `ascollection`, `asenumcollection`, `immutable_date`, `immutable_datetime`).
2. Replaced scalar `currentPrefix` with `prefixStack: string[]` in `scanRoutes` and added single-class invokable controller resolution targeting `__invoke`.
3. Extended `ValidationRuleParser.parse` to extract `Rule::in(...)`, `Rule::unique(...)`, and `Rule::exists(...)` directly into strongly-typed `InValidationRuleNode`, `UniqueValidationRuleNode`, and `ExistsValidationRuleNode`.
4. Enhanced `scanControllers` to recognize `Model::all()`, `Model::paginate()`, and `Model::find()` as `ModelResponseDescriptor` with shape `'collection'` or `'single'`.
**Regression test** → `packages/sdk/tests/staticLaravelScannerUpstream.spec.ts` › `StaticLaravelScanner Upstream Enhancements (Pillars A, B, C, D)`
**Status** → Diagnosed & Fixed

---

### Issue 33: Sound Discriminated Union ADT for Resource Groups & Zero-Fallback Generator Pipeline
**Symptom** → `CrudResourceGroupDescriptor` contained optional properties (`create?:`, `update?:`, `delete?:`) and `ResourceGroupVisitor` contained optional `crud?:` handlers, forcing downstream generators like `HookGenerator.ts` to implement defensive fallback checks (`if (groupDesc)`, dynamic property access `(resource as any)[actionRouteOrName]`, redundant `buildResourceMap` loops, and defensive mutation slot checking).
**Where** → `packages/core/src/types/route.ts` (`CrudResourceGroupDescriptor`, `ExhaustiveFineGrainedResourceGroupVisitor`, `matchResourceGroup`), `packages/cli/src/generators/HookGenerator.ts`, `packages/cli/src/generators/QueryKeyGenerator.ts`.
**Root cause** → The domain graph abstraction allowed partially initialized CRUD structures and non-exhaustive visitors instead of enforcing strict Discriminated Union sum types (`FullCrudResourceGroupDescriptor | ReadOnlyCrudResourceGroupDescriptor | FlexibleCrudResourceGroupDescriptor`) and Discriminated Union Visitors (`ExhaustiveFineGrainedResourceGroupVisitor | UnifiedCrudResourceGroupVisitor`).
**Fix** → 
1. Refactored `CrudResourceGroupDescriptor` into a pure Discriminated Union (`FullCrud | ReadOnlyCrud | FlexibleCrud`) with zero optional `?` mutation slots.
2. Formed strict `ResourceGroupVisitor` ADT (`ExhaustiveFineGrainedResourceGroupVisitor` with 5 mandatory fine-grained handlers vs `UnifiedCrudResourceGroupVisitor` with 3 mandatory unified handlers), eliminating `crud?:`.
3. Guaranteed non-null `invalidation` initialized with `ScannedRouteCacheInvalidationDescriptor.empty()` on `ScannedEndpointContract` at Origin Boundary.
4. Refactored `HookGenerator` and `QueryKeyGenerator` to consume `graph.resourceGroups` directly with zero intermediate maps, zero dynamic string lookups, zero `any` assertions, and pure catamorphisms.
**Regression test** → `packages/sdk/tests/domainGraphClassifierADT.spec.ts` › `guarantees ResourceGroupVisitor ADT discrimination and HookGenerator direct domain graph consumption`
**Status** → Diagnosed & Fixed

---

### Issue 32: Nested Array-of-Objects Item Transformation in Form Mappers (`toApiOrderCreate`) & Constant Extraction in `ApiApiField`
**Symptom** → Array-of-object form fields (such as `items` in `toApiOrderCreate`) were emitted directly as `[ApiApiField.ITEMS]: form.items,` without transforming inner elements to the API contract payload shape (`{ [ApiApiField.PRODUKITEMID]: item.produkItemId, [ApiApiField.QTY]: item.qty }`). Additionally, nested property names were omitted from `api-field.ts` constants.
**Where** → `packages/core/src/compiler/passes/MapperGeneratorPass.ts` (`buildFormFieldLine`), `packages/core/src/compiler/passes/api-field-domain.ts` (`extractFieldNames`).
**Root cause** → 
1. `MapperGeneratorPass.buildFormFieldLine` only checked `field.type instanceof ReadonlyCollectionType`, which failed for deserialized manifest objects where `field.type` is a plain JSON object (`(field.type as any).kind === 'readonly_collection'`). Additionally, it assumed `properties` was a `Map` rather than an array of property descriptors.
2. `api-field-domain.ts.extractFieldNames` did not recursively traverse object properties or collection element properties, omitting nested child property keys.
**Fix** → 
1. Enhanced `buildFormFieldLine` in `MapperGeneratorPass.ts` to support both class instances and raw manifest JSON ASTs for collections of objects, emitting `form.${propName}?.map(item => ({ [ApiApiField.${key}]: item.${camelKey}, ... }))`.
2. Enhanced `extractFieldNames` in `api-field-domain.ts` to recursively collect child property names from nested objects and collection elements into `ApiApiField`.
**Regression test** → `packages/sdk/tests/orderItemsArrayHierarchy.spec.ts` › `Regression Test: Order Items Array Hierarchy (orderItemsArrayHierarchy)`
**Status** → Diagnosed & Fixed

---

### Issue 31: Nested Array-of-Objects Rules Assembly & ObjectType Lowering (`items.*.prop` in Form & Contract Generation)
**Symptom** → Laravel FormRequest validation rules with array wildcards (`items`, `items.*.produk_item_id`, `items.*.qty`) resulted in flat scalar `items: z.string()` in contracts, flat `items.*` fields, or threw `TypeError: key.startsWith is not a function` during contract generation.
**Where** → `packages/core/src/compiler/scanner/StaticLaravelScanner.ts`, `packages/core/src/compiler/scanner/LaravelSourceLexer.ts`, `packages/core/src/compiler/domain/common/SemanticTypeResolver.ts`, & `packages/core/src/compiler/domain/common/ResolvedObjectType.ts`.
**Root cause** → 
1. `LaravelSourceLexer.parseArray` treated `return [` as subscript access because `return` was tagged as `IDENTIFIER`.
2. `scanFormRequests` did not group child array properties (`parent.*.child`) into nested `ReadonlyCollectionType(ARRAY, ObjectType)`.
3. `DefaultObjectHandler` in `SemanticTypeResolver` invoked `.entries()` on `obj.properties` assuming it was a `Map`, returning array index numbers `[0, prop]` when `properties` was an Array, causing `key.startsWith` to throw.
4. `convertResolvedTypeToResponseField` in `ResponseFieldLowering` lacked a handler for `ResolvedOptionalType`.
**Fix** → 
1. Excluded `return` and `yield` keywords from subscript checks in `LaravelSourceLexer.parseArray`.
2. Implemented hierarchical array grouping (`arrayProps`) in `StaticLaravelScanner.ts` to assemble child array properties into `ReadonlyCollectionType(ARRAY, ObjectType({ name: key, baseName: key, properties: childProps }))`.
3. Updated `DefaultObjectHandler` and `NullableWrapperHandler` in `SemanticTypeResolver.ts` and `ResolvedObjectType.ts` to natively support array properties.
4. Added `case 'optional':` handling in `ResponseFieldLowering.ts`.
**Regression test** → `packages/sdk/tests/orderItemsArrayHierarchy.spec.ts` › `Order Items Array Hierarchy Regression (Issue #18)`
**Status** → Diagnosed & Fixed

---

### Issue 30: Property Deduplication & Quoted Object Keys in TypeScript and Zod Emission
**Symptom** → CLI `generate` produced syntax errors when validation rules contained wildcard characters (`items.*.qty`), duplicate identifiers (`orderId: number; orderId: string;`) in `types/api-read.ts`, and runtime crash in `ModelGenerator` when accessors lacked names (`cannot read properties of undefined (reading 'replace')`).
**Where** → `packages/core/src/compiler/domain/common/ZodSchemaLowerer.ts`, `packages/core/src/compiler/domain/common/TypeScriptTypeLowerer.ts`, `packages/cli/src/generators/ModelGenerator.ts`, & `packages/core/src/compiler/passes/api-field-domain.ts`.
**Root cause** → 
1. `ZodSchemaLowerer` emitted raw unquoted keys in `z.object({ items.*.qty: z.number() })`.
2. `TypeScriptCodeBuilder` did not filter out duplicate property names per interface or duplicate top-level alias names.
3. `ModelGenerator` passed undefined accessor names to `camelCase`.
4. `ApiFieldGeneratorPass` and `MapperGeneratorPass` had misaligned field key derivation regexes for non-alphanumeric keys.
**Fix** → 
1. Safely quoted non-identifier property keys with `JSON.stringify(name)` in `ZodSchemaLowerer`.
2. Deduplicated interface properties and top-level aliases with `Set` filters in `TypeScriptCodeBuilder`.
3. Guarded against undefined property/accessor names in `ModelGenerator`.
4. Unified field key derivation using `deriveApiFieldKey` in `MapperGeneratorPass` and aligned `ApiApiField` table formatting.
**Regression test** → `packages/core/src/compiler/passes/__tests__/api-field-generator-pass.test.ts`, `packages/sdk/tests/formMapperDiagnosticAndTypeSafety.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 29: Unification of Domain Keying & Resource Enrichment in ContractInputPipeline (`Array.from(groups.values())`)
**Symptom** → Grouping routes and resources produced fragmented entries in `Array.from(groups.values())` (e.g. `'order'` with actions and empty response fields, vs `'orderResource'` with response fields and fake dummy `Show` actions).
**Where** → `packages/cli/src/generators/utils/ContractInputPipeline.ts` (`execute`).
**Root cause** → Routes were keyed by `pascalDomain.toLowerCase()` while resources were keyed by `res.name`, causing `groups.has()` lookup failure, duplicate entries, and failure to link `route.response.resource` with `manifest.resources`.
**Fix** → Pre-indexed `manifest.resources` in `resourceIndex`, unified canonical grouping keys to `bareDomain`, resolved resource schemas for route responses in-place, and avoided generating dummy `Show` actions for standalone resources.
**Regression test** → `packages/sdk/tests/eloquentOnlyReadMappers.spec.ts`, `packages/sdk/tests/resourceAliasDedup.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 28: Elimination of Empty `export const *ContractSchema = {};` Boilerplate for GET-Only Resources
**Symptom** → Resources with zero request payload actions (such as GET-only endpoints `/categories` and `/produk`) generated empty object declarations `export const categoriesContractSchema = {};` in `api-contract.ts`.
**Where** → `packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts` (`buildContractFile`).
**Root cause** → `ContractCodeBuilder` iterated all resources in `contracts` without filtering out resources with `actions.length === 0`.
**Fix** → Filtered `contracts` to `requestContracts = contracts.filter(c => c.actions.length > 0)` before emitting request schemas, types, validators, and exports in `ContractCodeBuilder.ts`.
**Regression test** → `packages/sdk/tests/cleanEmptyContractSchema.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 27: Object & Array-of-Object Element Typing in `api-form.ts` (`Array<object>` TS2339)
**Symptom** → `FormActionGenerator` converted `ObjectType` array elements to generic `object` (`items?: Array<object>`), causing TS2339 errors in `api-mapper.ts` when accessing `item.produkItemId` or `item.qty`.
**Where** → `packages/core/src/compiler/generators/form-generation/FormActionGenerator.ts` (`convertSemanticTypeToString`).
**Root cause** → `convertSemanticTypeToString` returned string literal `'object'` when `type.kind === 'object'` instead of recursively printing inline object property shape `{ produkItemId: string; qty: number }`.
**Fix** → Updated `convertSemanticTypeToString` in `FormActionGenerator.ts` to recursively format `ObjectType` properties into typed inline object declarations `{ propName: propType }` with camelCase property formatting.
**Regression test** → `packages/sdk/tests/formObjectArrayElementTyping.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 26: Form Type Import Directory Path Correction (`forms/api-form.ts` vs `types/api-form.ts`)
**Symptom** → `api-mapper.ts` imported form types from `../types/api-form` (an obsolete legacy directory) instead of `../forms/api-form` (the SSOT path produced by `FormGeneratorPass`), causing type mismatches with outdated form definition files.
**Where** → `packages/core/src/compiler/passes/MapperGeneratorPass.ts` & `packages/cli/src/generators/layers/MapperEmitter.ts`.
**Root cause** → `MapperGeneratorPass` and `MapperEmitter` emitted `from '../types/api-form'` instead of `from '../forms/api-form'`.
**Fix** → Updated `MapperGeneratorPass.ts` and `MapperEmitter.ts` to emit `import type { ... } from '../forms/api-form'`.
**Regression test** → `packages/sdk/tests/formNumericFieldTyping.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 25: Untyped Array Wildcard Diagnostic Warning & Rejection of `as any` Fallbacks
**Symptom** → When array wildcard validation rules lacked explicit primitive types (e.g. `'detail' => 'sometimes|array'`, `'detail.*' => 'sometimes'`), `ContractSchemaMapper` guessed `z.string()` while `FormFieldMapper` inferred `unknown[]`, causing type mismatch TS errors in `api-mapper.ts`.
**Where** → `packages/cli/src/generators/utils/manifest-to-types.ts` (`parseValidationRulesPreserveNested`, `parseValidationRules`) & `packages/core/src/compiler/passes/MapperGeneratorPass.ts` (`buildFormFieldLine`).
**Root cause** → Compiler attempted to guess primitive types or force `as any` type casts instead of remaining epistemically honest and emitting a compiler diagnostic warning.
**Fix** → 
1. Completely removed all `as any` type casts from `MapperGeneratorPass.ts`.
2. Added compiler diagnostic warning in `manifestToContractInput` when an array wildcard rule lacks an explicit primitive type rule (`string`, `numeric`, `integer`, `boolean`, `file`, etc.), prompting developers to update their Laravel validation rules (e.g., `'detail.*' => 'sometimes|string'`).
3. Set fallback element type for untyped array wildcards to `unknown` so types remain epistemically honest without guessing.
**Regression test** → `packages/sdk/tests/formMapperDiagnosticAndTypeSafety.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 24: Explicit Return Type Annotation for Form Mappers (`toApi*Create` / `toApi*Update`)
**Symptom** → Form mapper functions (e.g. `toApiRegisterCreate`) lacked explicit return type annotations (`: RegisterContract['create']`), relying on TypeScript return type inference.
**Where** → `packages/core/src/compiler/passes/MapperGeneratorPass.ts` (`buildFormMapper`).
**Root cause** → `MapperGeneratorPass.ts` did not add `${contractTypeName}['${action.name}']` return type annotations or import contract types for form request types.
**Fix** → Updated `MapperGeneratorPass.ts` to add `contractImports.add(contractTypeName)` and emit `: ${contractTypeName}['${action.name}']` for all generated form mappers.
**Regression test** → `packages/sdk/tests/formMapperExplicitReturnType.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 23: Alignment & Type Safety Fixes in Transformed Types and Mappers (`LoginTransformed`, `OrdersTransformed`, `PaymentResource`)
**Symptom** → 
1. `LoginTransformed` in `api-read.ts` generated `dataUserId` while `toLoginRead` in `api-mapper.ts` emitted `userId: api.data.user?.id` (`ts2353`).
2. `OrdersTransformed` retained unflattened nested objects (`promotion`, `shipping`) while `OrderResourceTransformed` was flattened (`promotionCode`), causing `toOrdersRead` type mismatch (`ts2322`).
3. `PaymentResourceTransformed` duplicate key `orderId` (`ts1117`) and loss of `nullable: true` (`ts2322`).
**Where** → `packages/cli/src/generators/utils/manifest-to-types.ts` (`manifestToSemanticTypes`, `flattenSemanticTypeFields`), `packages/cli/src/generators/utils/resource-flattening.ts` (`flattenResourceField`), & `packages/core/src/compiler/passes/MapperGeneratorPass.ts` (`buildFieldMappingLine`).
**Root cause** → 
1. `MapperGeneratorPass` did not track `targetPropKey` (compound camelCase) and `jsonPath` (backend JS path) separately during nested `ObjectType` recursion.
2. `flattenSemanticTypeFields` did not check if collection element types referenced existing resources in `manifest.resources` (`OrderResource`), generating redundant unflattened nested objects instead of referencing `OrderResourceTransformed`.
3. `flattenResourceField` in `resource-flattening.ts` lost `nullable: true` metadata on primitive fields.
**Fix** → 
1. Refactored `buildFieldMappingLine` in `MapperGeneratorPass.ts` to separate `targetPropKey` and `jsonPath` during `ObjectType` recursion.
2. Updated `flattenSemanticTypeFields` to map resource collection elements to `ReferenceType` pointing to `${Resource}Transformed`.
3. Updated `flattenResourceField` in `resource-flattening.ts` to preserve `nullable: true` using `markNullableSemanticType`.
**Regression test** → `packages/sdk/tests/mapperConsistencyAndTypeSafety.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 22: Object Flattening (ALLOWED) & Array Preservation (MANDATORY) for Inline Responses
**Symptom** → Inline controller responses containing scalar nested objects and array collections (e.g. `/produk/{id}/reviews` with `summary` object and `reviews.data` array of `ProductReview` models) degraded to generic `summary: object; reviews: object;` or `reviewsData: object[]` without flattening scalar object properties into top-level camelCase fields.
**Where** → `packages/cli/src/generators/utils/manifest-to-types.ts` (`manifestToSemanticTypes`), `packages/core/src/compiler/passes/TypeScriptGeneratorPass.ts` & `packages/core/src/compiler/passes/MapperGeneratorPass.ts`.
**Root cause** → 
1. `manifestToSemanticTypes` retained nested `ObjectType` shapes instead of flattening scalar object properties into compound camelCase keys (`summary.avg_rating` $\to$ `summaryAvgRating`).
2. `MapperGeneratorPass` generated nested mapper object structures for inline responses instead of mapping compound camelCase fields (`summaryAvgRating: api.summary?.avg_rating`).
**Fix** → 
1. Updated `manifestToSemanticTypes` with `flattenSemanticTypeFields` to flatten scalar object properties into top-level camelCase fields (`summaryAvgRating`, `summaryTotalReview`) while preserving array collections (`reviewsData: { id, produkItemId, ... }[]`).
2. Updated `MapperGeneratorPass.ts` to map flattened scalar fields (`summaryAvgRating: api.summary?.avg_rating`) and array element callbacks (`reviewsData: api.reviews.data?.map(item => ({ ... }))`) without introducing any `any` type annotations.
**Regression test** → `packages/sdk/tests/inlineResponseObjectFlattenArrayPreserve.spec.ts` & `packages/sdk/tests/inlineModelCollectionCamelCase.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 21: Inline Responses Omitted from `api-read.ts` & Fallback to Identity Mappers
**Symptom** → Inline controller responses (e.g. `/profile`, `/login`, `/cart`, `/payment/webhook`) did not generate `*Transformed` interfaces in `api-read.ts` and generated fallback identity mappers (`(api: ProfileApiResponse): ProfileApiResponse => ({ ... })`) retaining `snake_case` keys instead of mapping to camelCase frontend domain types.
**Where** → `packages/cli/src/generators/utils/manifest-to-types.ts` (`manifestToSemanticTypes`) & `packages/core/src/compiler/passes/MapperGeneratorPass.ts`.
**Root cause** → 
1. `manifestToSemanticTypes` only processed explicit resources in `manifest.resources`, omitting inline response objects extracted from routes.
2. `MapperGeneratorPass` fell back to returning `${resource}ApiResponse` directly when a corresponding `${resource}Transformed` interface was missing in `api-read.ts`.
**Fix** → 
1. Updated `manifestToSemanticTypes` to extract all inline route response objects into `SemanticTypesArtifact`, generating `*Transformed` interfaces (e.g. `ProfileTransformed`, `LoginTransformed`, `ProdukReviewsTransformed`) with camelCase properties in `api-read.ts`.
2. Updated `MapperGeneratorPass` to universally generate `toXRead` mappers converting raw `snake_case` `*ApiResponse` structures to `camelCase` `*Transformed` domain objects for all API responses.
**Regression test** → `packages/sdk/tests/inlineResponseCamelCaseTransformation.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 20: Any Fallback & Redundant Identity Mappers in MapperGeneratorPass
**Symptom** → Child resource mappers generated parameter as `(api: any)`, and non-resource plain responses (e.g. `Profile`, `PaymentWebhook`) generated redundant identity mappers (`api-contract` to `api-contract`).
**Where** → `packages/core/src/compiler/passes/MapperGeneratorPass.ts` & `packages/cli/src/generators/utils/manifest-to-types.ts`.
**Root cause** → 
1. `MapperGeneratorPass` relied on an `isTopLevel` boolean flag to determine contract type availability instead of checking `availableContractTypes`.
2. `manifestToContractInput` skipped child resources that lacked top-level route endpoints (e.g. `OrderDetailResource`).
3. `MapperGeneratorPass` generated identity mappers for non-resource responses instead of restricting read mappers strictly to Eloquent JsonResources (Category A).
**Fix** → 
1. Updated `MapperGeneratorPass` to resolve `apiResponseType` dynamically from `availableContractTypes` and throw a diagnostic error if missing.
2. Filtered `requestTypes.responseData` in `MapperGeneratorPass` to only generate read mappers for Eloquent JsonResources (ending in `Resource`), omitting Category B identity mappers.
3. Updated `manifestToContractInput` to recursively discover and register contract-reachable child resources.
**Regression test** → `packages/sdk/tests/eloquentOnlyReadMappers.spec.ts`, `packages/sdk/tests/existingContractMapperTyping.spec.ts` & `packages/sdk/tests/strictChildResourceMapperTyping.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 19: Eloquent Resource Collection Field Fallback to `unknown` / `object[]`
**Symptom** → Array collection fields referencing child Eloquent Resources (such as `items: OrderDetailResource::collection($this->details)`) in `OrderResource` fell back to `items: unknown` or `items: object[]` in `api-read.ts`, causing TypeScript assignment errors in `api-mapper.ts`.
**Where** → `packages/cli/src/generators/utils/resource-flattening.ts` (handling of `static_method_call` & `resolved` resource references) and `packages/core/src/compiler/passes/MapperGeneratorPass.ts` (resolution of `elemResourceName` for `Transformed` suffix).
**Root cause** → 
1. `flattenResourceField` hit default branch for `kind: "static_method_call"` and failed to inspect `field.resolved.resource` / `field.resolved.collection`, evaluating `typeName` as `unknown`.
2. `MapperGeneratorPass` checked `elem.name.endsWith('Resource')`, which failed when `elem.name` was `OrderDetailResourceTransformed`.
**Fix** →
1. Updated `resource-flattening.ts` to inspect `rawField.resource || resolved.resource || rawField.className` and `resolved.collection`.
2. Updated `MapperGeneratorPass.ts` to strip `Transformed` suffix (`elem.name.replace(/Transformed$/, '')`) when resolving `elemResourceName`.
**Regression test** → `packages/sdk/tests/e2eMapperGeneration.spec.ts` › `should resolve static_method_call OrderDetailResource::collection and generate items.map(toOrderDetailResourceRead)` & `packages/sdk/tests/itemsCollectionMapperTypeResolution.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 18: Preservasi Field Nested Eloquent Resource pada `api-read.ts` & Overwrite Legacy Generator
**Symptom** → Property nested resource pada `api-read.ts` ter-flatten secara terpisah atau ter-overwrite oleh legacy generator.
**Where** → `packages/cli/src/generators/utils/manifest-to-types.ts` & `packages/cli/src/commands/generate.ts`
**Root cause** → Overwrite oleh `ZodTierGenerator` dan penanganan `processResources` yang belum lengkap.
**Fix** → Tambah flag `compilerBridgeSuccess` dan penataan `flattenResourceFields`.
**Regression test** → `packages/sdk/tests/nestedResourcePreservation.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 17: Assignment scanner skip closure-return false positive
**Symptom** → Assignment di dalam closure ter-skip jika ekspresi mengandung kata `return`.
**Where** → `LaravelRouteParser.ts`
**Root cause** → Guard regex mencocokkan kata `return` di mana saja dalam ekspresi assignment.
**Fix** → Pastikan hanya match `return` di posisi paling depan ekspresi.
**Regression test** → `packages/sdk/tests/laravelParserAssignments.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 16: `updateOrCreate` tidak tracked di Level 90
**Symptom** → Field hasil `updateOrCreate` ter-resolve sebagai `z.unknown()`.
**Where** → `LaravelRouteParser.ts`
**Root cause** → `updateOrCreate` belum ada di regex Level 90.
**Fix** → Tambahkan `updateOrCreate`, `firstOrCreate`, `forceCreate`, dll. ke regex Level 90.
**Regression test** → `packages/sdk/tests/laravelParserValidateAndModelFallback.spec.ts`
**Status** → Diagnosed & Fixed
