# Changelog

All notable changes to RouteSync will be documented in this file.

## [Unreleased]

### Fixed
- **DTO source now crosses one explicit AST/ADT producer boundary (Issue #47)**:
  - Added `dtoProducer`, which transforms `ResponseDtoDeclarationAst` and its source span into the canonical `DtoAst`/`DtoDefinition` vocabulary.
  - Kept `scanDtoAsts` as discovery-only orchestration; it now tokenizes and parses Laravel source before delegating DTO construction to the producer.
  - Preserves the `RegisterResponse` field types (`bool`, `string`, `mixed`) and per-property Laravel source lines from the ecommerce fixture.
  - **Regression Test**: Added `packages/sdk/tests/dtoAstProducer.spec.ts`.
- **Elevation of Upstream Incremental Scanner to Level 7 Higher-Level Domain Models (Issue #46)**:
  - Mengeliminasi porositas tinggi (12 `?:`, 7 `| null`, 5 naked `Record<string, unknown>`) pada antarmuka pemindaian bertahap (`ScannedRoute`, `ScannedResource`, `ScannedModel`, `ScannedManifest`).
  - Memperkuat atom primitif dengan nominal branding (`types/nominalAtoms.ts`, $\le 45$ baris): `ScannedRouteMethod`, `ScannedRoutePath`, `ScannedRouteName`, `ScannedStableHash`, `SourceFilePath`, `SourceLineNumber`.
  - Mengimplementasikan catamorphic Response Payload ADT (`types/responsePayloadTypes.ts`, $\le 58$ baris) dengan 5 varian (`primitive`, `object`, `array`, `resource`, `unknown`) dan table dispatcher $O(1)$ `matchRouteResponsePayload` (0 `if`, 0 `switch`).
  - Mengganti seluruh naked `Record` dan `| null` dengan Complete Contracts bertipe kuat (`ScannedRouteContract`, `ScannedResourceContract`, `ScannedManifestContract`) berbasis entry tuple `readonly (readonly [K, V])[]`.
  - Mengimplementasikan domain descriptor kelas satu (`ScannedRouteDescriptor`, `ScannedResourceDescriptor`, `ScannedManifestDescriptor`) dengan 100% direct assignment constructor, static semantic factories (`.create()`, `.fromRaw()`, `.empty()`), dan backward-compatible facade properties.
  - Memecah dan merampingkan modul (`routeResolver.ts`, `fieldResolver.ts`, `incremental.ts`) agar seluruhnya strictly $\le 100$ baris per Rule 14.
  - **Regression Test**: Ditambahkan di `packages/sdk/tests/incrementalHigherLevelModelsSSOT.spec.ts` (10 tests, 125 test files, 714 tests 100% GREEN).
- **Elimination of Repository Worst Porosity Interface `SparseRouteParams` (Issue #45)**:
  - Mengeliminasi antarmuka dengan skor porositas tertinggi di repositori (`SparseRouteParams`, skor 56 dengan 28 field `?:` dari 31 field).
  - Menyediakan pabrik Origin Boundary `RouteBoundaryContractFactory` (`boundaryContractFactory.ts`, 80 baris, Rule 14) yang menyerap variasi parameter di batas perimeter dan menghasilkan kontrak beku non-nullable `RouteBoundaryContract` (0 `?:`).
  - Menggantikan kamus perimeter bebas dengan opsi terstruktur bertipe kuat `RouteBoundaryOptions`, mempertahankan kompatibilitas alias `SparseRouteParams`.
  - Menambahkan method `fromBoundary(contract: RouteBoundaryContract)` pada `RouteBoundaryAdapter`.
  - **Regression Test**: Ditambahkan di `packages/sdk/tests/routeBoundaryHardeningSSOT.spec.ts` (3 tests, 124 test files, 704 tests 100% GREEN).
- **Decomposition and Level 7 Hardening of Monolithic Semantic Types `semantic.ts` (Issue #44)**:
  - Memecah antarmuka monolitik `packages/core/src/types/semantic.ts` (914 baris, skor porositas 90 dengan 42 field `?:`) menjadi 13 sub-modul kohesif di `packages/core/src/types/semantic/` yang masing-masing strictly $\le 99$ baris (Rule 14).
  - Memperkuat atom primitif dengan nominal branding (`nominalVocabulary.ts`): `SourceLineNumber`, `SourceColumnNumber`, `ModelNodeName`, `ServiceNodeName`, `ControllerNodeName`, `ConfidenceScore`.
  - Mengisolasi micro-AST ke `parsedAstTypes.ts` dan menyediakan proyektor catamorphic $O(1)$ table dispatch `matchParsedAST` (0 `if`, 0 `switch`).
  - Menjaga 100% kompatibilitas mundur dengan mengekspor kembali simbol melalui barrel ringkas 9 baris di `semantic.ts`.
  - **Regression Test**: Ditambahkan di `packages/sdk/tests/semanticTypeHardeningSSOT.spec.ts` (4 tests, 123 test files, 701 tests 100% GREEN).
- **Decomposition and Level 7 Hardening of Worst Branching Interface `ir.ts` (Issue #43)**:
  - Memecah antarmuka monolitik `packages/core/src/types/ir.ts` (1028 baris, skor porositas tertinggi #1 dengan 125 field `?:`, 13 naked `Record`, 4 sentinel `null`) menjadi 15 sub-modul kohesif di `packages/core/src/types/ir/` yang masing-masing strictly $\le 95$ baris (Rule 14).
  - Memperkuat atom primitif dengan nominal branding (`nominalVocabulary.ts`): `EndpointId`, `ResourceId`, `RequestId`, `RoutePath`, `HttpHeaderName`, `SourceLineNumber`, `HttpStatus`.
  - Mengeliminasi naked `Record<string, unknown>` pada `ResolvedSemanticType` dan menggantikannya dengan pasangan entry tuple `propertyEntries: readonly (readonly [string, T])[]`.
  - Membekukan struktur via `ResolvedSemanticTypeFactory` (`Object.freeze`) dan menyediakan catamorphism pattern matcher murni `matchResolvedSemanticTypeIR` berbasis dispatch table $O(1)$ (0 `if`, 0 `switch`).
  - Menjaga 100% kompatibilitas mundur dengan mengekspor kembali simbol IR melalui barrel ringkas 10 baris di `ir.ts`.
  - **Regression Test**: Ditambahkan di `packages/sdk/tests/irTypeHardeningSSOT.spec.ts` (4 tests, 122 test files, 697 tests 100% GREEN).
- **Upstream Lexer Micro-AST Catamorphism & Level 7 Frozen ADT Descriptors (Issue #42)**:
  - Memecah upstream lexer `PhpAst.ts` (>100 baris) menjadi 3 modul kohesif $\le 100$ baris: `phpAstTypes.ts` (branded nominal atoms `SourceOffset`, `SourceLineNumber`, `AstIdentifier`), `phpAstFactory.ts` (frozen constructor factory dengan `Object.freeze`), dan `phpAstAlgebra.ts` ($O(1)$ table-driven catamorphic projector `matchPhpAstValue`).
  - Mengeliminasi 7 branching `if` pada `fieldBinder.ts` dan `switch` pada `resourceAstExpressionMapper.ts` dengan beralih ke pure catamorphism pattern matchers (0 `if`, 0 `switch`).
  - Mengimplementasikan Level 7 frozen ADT descriptors: `RouteDefDescriptor` dengan branded `RoutePath` dan `HttpVerb` (0 `undefined`, 0 `null`, 0 `?:`), `ResourceDefDescriptor`, dan `ModelDefDescriptor` dengan pasangan tuple `readonly (readonly [K, V])[]` menggantikan naked `Record`.
  - **Regression Test**: Ditambahkan di `packages/sdk/tests/upstreamLexerAdtAndDescriptorsSSOT.spec.ts` (4 tests lulus, total 121 test files, 693 tests 100% GREEN).
- **Level 7 Subatomic Functor & Closed ADT Contracts (Issue #41)**:
  - Mengeliminasi seluruh sentinel `undefined` dan `null` dari kontrak tipe (`ResponseDescriptorContract`, `ResponseFieldContract`, `SemanticRelationContract`, `RouteDefContract`, `ResourceDefContract`, `ModelDefContract`, `ObjectSchemaContract`, `KernelResolutionResultContract`, `RequestPayloadContract`, `ResponsePayloadContract`).
  - Mengimplementasikan Monadic Functor `TypeWrapper<Carrier>` (`Identity | Nullable | Collection | Paginated`) dan closed Discriminated Union ADT variants dengan 0 `?:`, 0 `undefined`, 0 `null`, dan 0 naked `Record`.
  - Memecah seluruh file kontrak dan domain menjadi modul-modul kohesif $\le 100$ baris per Rule 14 (`routeEntityDefinition.ts`, `modelEntityDefinition.ts`, `responseDescriptorContract.ts`, `objectSchemaContracts.ts`, `frameworkRules.ts`, `classifiedRouteDescriptor.ts`, `resourceCrudMap.ts`, `normalizedEntities.ts`, `normalizedManifest.ts`).
  - **Regression Test**: Ditambahkan di `packages/sdk/tests/subatomicLevel7Contracts.spec.ts` (120 test files, 689 tests 100% GREEN).
- **Sweeping Hardening of Worst Branching Interfaces & Hall of Shame Cleanup (Issue #40)**:
  - Mengeliminasi antarmuka berporositas kritis (IPS 100% - 200%) pada `GrammarClosure` (200% $\to$ 0%), `ScannedManifest` (167% $\to$ 0%), `LaravelValidationIR` (150% $\to$ 0%), `TypeDefinition` (133% $\to$ 0%), `ScannedModel` (120% $\to$ 0%), `ScannedResource` (117% $\to$ 0%), `SemanticNode` (100% $\to$ 0%), dan `MinimalRouteDefinitionParams` (100% $\to$ 0%).
  - Menghapus seluruh sentinel `null` (`| null`) dan `any[]` pada model inkremental AST parser.
  - Memecah `normalizerTypes.ts` menjadi modul modular $\le 100$ baris dengan mengekstrak `semanticNormalizerTypes.ts`.
  - **Regression Test**: Diverifikasi via `routeBoundaryContractSSOT.spec.ts` dan seluruh test suite (119 test files, 685 tests 100% GREEN).
- **Porous Route Parameter Bag Elimination & Closed Boundary Contract (Issue #39)**:
  - Mengeliminasi 13 `any` dan 28 field opsional dari `SparseRouteParams` (IPS turun dari 137% ke level aman) dan menggantikannya dengan `RouteBoundaryContract` bertipe tertutup 100% (IPS 0%).
  - Memecah file factory rute yang membengkak (`actionRouteFactories.ts` 155 baris, `closureSyntheticFactories.ts` 130 baris) menjadi modul-modul kohesif $\le 100$ baris (`controllerActionRouteFactory.ts`, `controllerReferenceRouteFactory.ts`, `closureRouteFactory.ts`, `syntheticRouteFactory.ts`).
  - Mengeliminasi procedural string hacking dan guessing pada `boundaryBasics.ts` (berkurang dari 119 menjadi 79 baris) dengan delegasi type contracts ke `boundaryBasicsTypes.ts`.
  - **Regression Test**: Ditambahkan di `packages/sdk/tests/routeBoundaryContractSSOT.spec.ts` (4 tests lulus, total 119 test files, 685 tests 100% GREEN).
- **PHP AST Lowering Enhancements: Array Literals, Unary Operations, Class Constants (Issue #38)**:
  - Menambahkan varian `ArrayAstNode`, `UnaryAstNode`, dan `StaticConstantAstNode` pada ADT #32 (`PhpAstKind`), adapter catamorphic untuk grammar `php-parser`, serta reduksi pohon F-Algebra murni pada `algebra/fieldNodeAlgebra.ts`.
  - Mengeliminasi fallback diam-diam ke `unknown` saat mengevaluasi array dictionary PHP dan bilangan bertanda negatif.
  - **Regression Test**: Ditambahkan di `packages/sdk/tests/phpAstAlgebraSSOT.spec.ts`.
- **Database Column & Eloquent Cast Type Mapping Zero Branching (Issue #37)**:
  - Mengganti kamus naked `Record<string, ...>` pada `DatabaseColumnTypeMapper` dan `EloquentCastMapper` dengan First-Class Symbol Table berbasis `ReadonlyMap`.
  - Merefaktor `resolvers.ts` dari 113 baris (16 `if`s) menjadi 40 baris (0 `if`, 0 `switch`, 0 naked `Record`) melalui catamorphism murni `matchDatabaseColumnKind` dan `matchEloquentCastKind`.
  - **Regression Test**: Ditambahkan di `packages/sdk/tests/resolversZeroBranchingSSOT.spec.ts`.
- **Boolean Literal Inversion Elimination in PHP AST Mapping (Issue #36)**:
  - Memperbaiki bug kritis inversi boolean pada `nodeMapper.ts` di mana `!node.value` membalikkan `true` menjadi `false` dan sebaliknya.
  - Memastikan boolean dipertahankan secara deterministik menggunakan `Boolean(node.value)`.
  - **Regression Test**: Ditambahkan di `packages/sdk/tests/phpAstAlgebraSSOT.spec.ts`.
- **Universal API Version Prefix Detection & Zero Hardcoded Versions (Issue #35)**:
  - Mengganti pengecekan hardcoded `s !== "v1"` dengan pola universal `!/^v\d+$/i.test(s)` pada 4 modul resolver boundary: `RouteCrudClassifier.ts`, `RouteDomainResolver.ts`, `boundaryBasics.ts`, dan `domainExtractor.ts`.
  - Memastikan rute dengan versi selain v1 (e.g. `/api/v2/products`, `/api/v3/orders/{id}`) tidak salah diklasifikasikan sebagai `CrudRole.Custom` atau menghasilkan nama domain `v2Products`, melainkan ter-resolve secara universal sebagai domain dan role yang semantik (`products`, `CrudRole.Index`).
  - **Regression Test**: Ditambahkan di `packages/sdk/tests/crudRoleAdtFlowSSOT.spec.ts` (test 9 lulus, total 115 test files, 658 tests 100% GREEN).
- **Intermediate Representation (IR) Accuracy & Semantic Rule Enhancements**:
  - **Eliminasi False Warnings pada Validasi Laravel**: Menambahkan semantic format rules validator (`email`, `url`, `uuid`, `ip`, `json`, `date`, `in:`, `digits`, `alpha`, etc.) di `ValidationRuleFieldLowerer` sehingga tidak lagi memicu warning palsu `"Field 'x' has no type specified"`. Warning pada proyek nyata `toko-online` turun dari 6 menjadi 0.
  - **Strongly-Typed Route Execution Signatures**: Parameter form/mutation pada `executionSignature.parameterDeclaration` kini mengekstrak tipe FormRequest atau DTO form konkret (e.g. `payload: StoreOrderRequest`) alih-alih fallback generik `payload: any`.
  - **Ekstraksi HTTP Error Responses dari Controller Action**: Mendeteksi pemanggilan `abort(401, '...')`, `abort(403)`, `abort(404)`, dan `response()->json(..., status)` pada controller method dan memasukkannya ke dalam `route.errorResponses` (e.g. `LaravelUnauthorizedError`, `LaravelNotFoundError`).
  - **Ekstraksi Role & Custom Middleware Policy**: Mendeteksi middleware custom seperti `'role:admin'` dan `'admin'` dan memetakannya ke `route.security.abilities` (`role:admin`) serta `policies: [{ ability: "role:admin", kind: "gate" }]`.
  - **Regression Test**: Ditambahkan di `packages/sdk/tests/improvedIrDataflow.spec.ts` (4 tests lulus, total 115 test files, 654 tests 100% GREEN).
- **True Eloquent Model Resolution & DTO Warning System**:
  - **Resolusi Model dari ModelSymbolTable Asli**: Memastikan `modelName` pada Resource hanya terikat ke Eloquent Model Laravel asli (`modelSymbol.name` dari `ModelSymbolTable`). Mengeliminasi fallback tebakan berbasis string nama file Resource.
  - **Peringatan Kompilator untuk DTO Unbacked**: Menambahkan compiler warning eksplisit jika Resource merupakan DTO tanpa model Eloquent pendukung: `[RouteSync Compiler Warning] Resource '${resourceName}' is a DTO without a matching Eloquent model. Non-model DTO resources have limited automatic relation/column derivation support.`
  - **Penandaan Sintetis Eksplisit**: Resource DTO yang tidak memiliki backing model Eloquent ditandai secara eksplisit dengan `modelName: null`, `baseModel: null`, dan `isSynthetic: true`.
  - **Regression Test**: Ditambahkan di `packages/sdk/tests/dtoResourceWarningAndModelResolution.spec.ts` (4 tests lulus, 113 test files, 636 tests 100% GREEN).

### Added
- **Semantic AST Dataflow, Relation Propagation & Structural Type Inference (Rule 10, Rule 11, Rule 12)**:
  - **Tier 1 (Controller AST Dataflow)**: Menelusuri parameter type-hint controller (`show(Order $order)`), rantai assignment variabel lokal (`$orders = Order::query()->paginate(...)`), dan query builder `DB::table(...)` via indeks `byTableName` baru pada `ModelSymbolTable`. Menangani multi-arity constructor arguments (`new Res($order, $flag)`) dan return wrappers (`response()->json(new Res($order))`).
  - **Tier 2 (Two-Pass Fixpoint Relation Propagation)**: Menyelesaikan ketergantungan urutan abjad file sistem (`OrderDetailResource.php` sebelum `OrderResource.php`) dengan arsitektur Two-Pass Fixpoint. Menelusuri relasi Eloquent parent (`$this->items`) langsung ke `targetModel` model parent pada `collectionArrayBinders.ts`.
  - **Tier 3 (Weighted Structural Type Unification)**: Algoritma pencocokan struktural kolom model berbasis bobot: kolom unik / foreign key berbobot `1.0`, kolom generik (`id`, `created_at`, `status`) berbobot `0.1` dengan ambang batas coverage minimum `40%` untuk mencegah salah tebak.
  - **Guaranteed ADT Model Binding Contract**: Memperkenalkan ADT discriminated union `ResourceModelBinding` (`MonoModelBinding`, `PolyModelBinding`, `UnbackedDtoBinding`) dengan catamorphic eliminator `matchResourceModelBinding` (0 `if`, 0 `switch`).
  - **Comprehensive Verification Suite**: Menambahkan `packages/sdk/tests/semanticAstDataflowAndRelationPropagation.spec.ts` (9 tests baru, total 114 test files, 645 tests 100% GREEN).
- **Zero-Regex Manifest SSOT & Complete Guaranteed Contracts (Rule 10, Rule 11, Rule 12 RouteSync)**:
  - **Larangan Tanda Tanya `?` & Guaranteed Non-Nullable Contracts (Rule 10)**: Menghilangkan seluruh `modelName?` dan `constantKey?` opsional. Menuntut `readonly modelName: string` pada `ParsedResource` & `ScannedResourceDescriptor`, serta `readonly constantKey: string` pada `RouteIdentityContract`, dihitung dan dijamin utuh 100% sejak Origin Boundary.
  - **Eliminasi Regex di Seluruh Generator Hilir**:
    - Menghapus string stripping `res.name.replace(/Resource$/, '')` pada `validationPass.ts` dan `singleFieldResolver.ts` digantikan dengan `res.modelName` SSOT.
    - Menghapus string splitting regex pada `routesObjectBuilder.ts` digantikan dengan `route.identity.constantKey` SSOT.
    - Menghapus regex fallback `replace(/\{([^}]+)\}/g, ...)` pada `EchoGenerator.ts` digantikan dengan `compileBroadcastRuntimePattern` dari `@routesync/core`.
    - Menghapus inline regex casing pada `enumConstantsBuilder.ts` digantikan dengan `ValidationRuleParser.parseAll` dan `toCamelCase`.
    - Menghapus regex `replace(/Transformed$/, '')` pada `readMapperBuilder.ts` digantikan dengan string slicing murni.
    - Menghapus regex path formatting pada `names.ts` dan `pathClassifier.ts`.
  - **Comprehensive Verification Suite**: Menambahkan `packages/sdk/tests/zeroRegexManifestSSOT.spec.ts` (4 tests baru, total 112 file test, 632 tests 100% GREEN).
- **Catamorphic Projectors & Dual-Mode CodeSink Architecture (Rule 11, Rule 12 RouteSync)**:
  - **`CodeSink` Stream Writer**: Diperkenalkannya `CodeSink` dan `MemoryCodeSink` (`packages/core/src/compiler/sink/`) untuk decoupling emisi kode dari domain models dan formatting passes, dengan pelacakan baris, indentasi, metadata, dan eliminasi buffer array perantara.
  - **Catamorphic Domain Projectors**: Ditambahkannya modul proyektor domain terfokus (~40–80 baris) di `packages/core/src/compiler/projectors/`:
    - `ApiFieldProjector.ts`: Single-pass stream generator tanpa nested loops untuk ekstraksi konstanta `ApiField`.
    - `FormModelProjector.ts`: Proyektor model form langsung ke `CodeSink` dan `GeneratedFormArtifact`.
    - `ContractProjector.ts`: Proyektor tipe kontrak dan skema Zod langsung ke `CodeSink` dan `GeneratedContractArtifact`.
    - `ReadModelProjector.ts`: Proyektor model pembacaan TypeScript langsung ke `CodeSink` dan `GeneratedTypeScriptArtifact`.
    - `MapperProjector.ts`: Proyektor fungsi mapper dua arah langsung ke `CodeSink` dan `GeneratedMapperArtifact`.
  - **Pembersihan Passes & Builder**: Refactoring `api-field-domain.ts`, `formMapperBuilder.ts`, dan `readMapperBuilder.ts` mengeliminasi loop berlapis dan `as any`.
  - **Comprehensive Verification Suite**: Menambahkan `packages/sdk/tests/catamorphicProjectorsSSOT.spec.ts` (8 tests baru, total 111 file test, 628 tests 100% GREEN).
- **Direct Semantic Binding di Origin Boundary & Bound AST SSOT (Compiler Binder Architecture)**:
  - **`ModelSymbolTable` di Origin Boundary**: Menyediakan indeks simbolik $O(1)$ untuk seluruh Eloquent Models, Columns, Casts, Accessors, dan Relations dari hasil scanning upstream.
  - **`SemanticResourceBinder` (Direct Semantic Binding)**: Mengikat syntax AST file JsonResource langsung ke Model Symbols saat scanning berlangsung (`ResourceScanner`), menghasilkan `BoundSemanticNode` (`boundAst`) lengkap dan frozen, mengeliminasi string heuristics (`prop.endsWith('_id')`) dan puluhan `if` di plugin kernel.
  - **Bound AST Discriminated Union & Catamorphic Eliminator**: Menambahkan ADT `BoundSemanticNode` (`bound_model_column`, `bound_relation`, `bound_conditional`, `bound_binary`, `bound_ternary`, dll.) dengan eliminator murni `matchBoundSemanticNode` (0 `if`, 0 `switch`).
  - **Comprehensive Verification Suite**: Menambahkan `packages/sdk/tests/boundSemanticAstFlowSSOT.spec.ts` (5 tests, 109 test files, 601 tests 100% GREEN).
- **Pure Dataflow Architecture & Complete Contract Refactoring (Rule 8, 10, 11, 12 RouteSync)**:
  - **Single Stream Upstream Pure Transforms**: Ditambahkannya pure functions `lowerTypeScriptArtifact`, `lowerFormArtifact`, `lowerContractArtifact`, `lowerApiFieldArtifact`, `lowerMapperArtifact` pada compiler passes, serta composite output lowerers di `packages/core/src/compiler/passes/outputLowerers.ts` (`lowerReadTypesOutput`, `lowerFormTypesOutput`, `lowerContractsOutput`, `lowerApiFieldsOutput`, `lowerMappersOutput`).
  - **Pure Functional Pipeline Orchestrator**: `CompilerBridge.ts` direfaktor menjadi pure functions `compileManifest`, `emitFullBundle`, dan `emitCoreArtifacts` dengan composable emitters (`CoreFilesEmitter`, `DEFAULT_CLIENT_EMITTERS`), mengeliminasi class stateful dan IIFE di call site.
  - **Self-Projecting Resource Groups**: Seluruh 5 varian ADT `ResourceGroupDescriptor` mengimplementasikan `ResourceGroupLoweringTrait` (`lowerQueryKeyBlock()`, `lowerCacheConfig()`), memungkinkan `HookGenerator` dan `QueryKeyGenerator` beroperasi dengan 0 `switch` dan 0 `if(group.isCrud)`.
  - **Comprehensive Verification Suite**: Menambahkan `packages/sdk/tests/pureDataflowTypeContracts.spec.ts` (13 tests, 100 test files, 500 tests 100% GREEN).

### Refactored
- **Active Consumer Orchestrator & Sub-Domain Decomposition (TS AST Nodes & React Intent) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi TypeScript AST Nodes & Visitor**:
    - `TSFunctionDeclaration.ts` (240 baris $\to$ 126 baris) dengan pembersihan redundansi JSDoc dan penataan factory methods.
    - `TSExportDeclaration.ts` (188 baris $\to$ 98 baris) dengan pemeliharaan tipe eksak and immutable modifier methods.
    - `TSTypeAliasDeclaration.ts` (171 baris $\to$ 87 baris) dengan invariant constructor dan factory methods terpadu.
    - `TSMethodSignature.ts` (164 baris $\to$ 80 baris) dengan pemisahan delegasi parameter dan modifier methods.
    - `TSBaseVisitor.ts` (218 baris $\to$ 44 baris) $\to$ ekstraksi `packages/core/src/compiler/target/typescript/visitor/visitorUtils.ts` (`visitAll`).
  - **Dekomposisi React Hooks Intent Resolution**:
    - `intentTypes.ts` (182 baris $\to$ 22 baris) $\to$ sub-domain `packages/react/src/hooks/define/intent/` (`groupHookResult.ts`, `mutationResolvers.ts`, `intentActions.ts`, `index.ts`) + Active Consumer facade.
  - **Full Monorepo Build & Test Green**: Monorepo build 100% sukses (`tsup`) dan suite Vitest di `packages/sdk` (110 file test, 620 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (Scanners & Descriptors) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Berkas Logika Scanner & Descriptors ke Sub-Domain Terfokus & Active Consumers**:
    - `scriptTemplate.ts` (165 baris $\to$ 12 baris) $\to$ `packages/cli/src/commands/annotate/template/` (`routePreamble.ts`, `resourceDiscovery.ts`, `modelResolution.ts`, `index.ts`) + Active Consumer.
    - `propertyAccessHandler.ts` (184 baris $\to$ 15 baris) $\to$ `packages/core/src/semantic/plugins/expression/property-access/` (`specialAccessHandler.ts`, `targetModelResolver.ts`, `index.ts`) + Active Consumer.
    - `compositeBinders.ts` (192 baris $\to$ 18 baris) $\to$ `packages/core/src/compiler/scanner/binders/resource/composite/` (`collectionArrayBinders.ts`, `literalTernaryBinders.ts`, `index.ts`) + Active Consumer.
    - `modelEntityDescriptor.ts` (194 baris $\to$ 15 baris) $\to$ `packages/core/src/compiler/scanner/descriptors/model/entity/` (`types.ts`, `modelEntityFactory.ts`, `modelDescriptorClass.ts`, `index.ts`) + Active Consumer.
    - `outputLowerers.ts` (195 baris $\to$ 22 baris) $\to$ `packages/core/src/compiler/passes/lowerers/` (`types.ts`, `readTypesLowerer.ts`, `requestTypesLowerers.ts`, `index.ts`) + Active Consumer.
    - `typeScriptCodeBuilder.ts` (199 baris $\to$ 60 baris) $\to$ `packages/core/src/compiler/domain/common/ts-lowerer/builder/` (`typeExpressionLowerer.ts`, `objectTypeLowerer.ts`, `index.ts`) + Active Consumer.
    - `ResponseArtifactBuilder.ts` (199 baris $\to$ 155 baris) $\to$ `packages/core/src/compiler/ir/response/builder/builderState.ts` + Active Consumer.
    - `routeParameters.ts` (221 baris $\to$ 17 baris) $\to$ `packages/core/src/compiler/scanner/descriptors/route/params/` (`types.ts`, `routeParameterDescriptorClass.ts`, `routeQueryParameterDescriptorClass.ts`, `index.ts`) + Active Consumer.
    - `StaticLaravelScanner.ts` (296 baris $\to$ 260 baris) $\to$ `packages/core/src/compiler/scanner/orchestrator/` (`pipelineScanner.ts`, `index.ts`) + Active Consumer.
    - `routeSemanticFactories.ts` (307 baris $\to$ 20 baris) $\to$ `packages/core/src/compiler/scanner/descriptors/route/factories/` (`contractRouteFactories.ts`, `actionRouteFactories.ts`, `closureSyntheticFactories.ts`, `index.ts`) + Active Consumer.
    - `ScannedRouteDescriptor.ts` (318 baris $\to$ 240 baris) $\to$ Active Consumer memisahkan delegasi factory ke `routeSemanticFactories`.
  - **Full Monorepo Build & Test Green**: Monorepo build 100% sukses (`tsup`) dan suite Vitest di `packages/sdk` (110 file test, 618 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (Tier 160–180 Lines) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi 24 Berkas Tier 160–180 Baris ke Sub-Domain Terfokus & Active Consumers**:
    - `modelRelationDescriptor.ts` (180 baris $\to$ 15 baris) $\to$ `packages/core/src/compiler/scanner/descriptors/model/relation/` + Active Consumer.
    - `loweringMapper.ts` (178 baris $\to$ 16 baris) $\to$ `packages/core/src/compiler/domain/common/response-lowering/mapper/` + Active Consumer.
    - `routeResponseDeriver.ts` (177 baris $\to$ 35 baris) $\to$ `packages/core/src/compiler/scanner/subscanners/semantic/route-response/` + Active Consumer.
    - `HttpClient.ts` (175 baris $\to$ 95 baris) $\to$ `packages/core/src/client/http/` + Active Consumer.
    - `EloquentMethodResolver.ts` (174 baris $\to$ 28 baris) $\to$ `packages/core/src/semantic/plugins/method-return/` + Active Consumer.
    - `TypedPassAdapter.ts` (174 baris $\to$ 65 baris) $\to$ `packages/core/src/compiler/passes/adapter/` + Active Consumer.
    - `generator.ts` (SDK) (173 baris $\to$ 30 baris) $\to$ `packages/sdk/src/generator/` + Active Consumer.
    - `SSAVerifier.ts` (173 baris $\to$ 40 baris) $\to$ `packages/core/src/compiler/verification/ssa/` + Active Consumer.
    - `CodeGenerationEngine.ts` (169 baris $\to$ 75 baris) $\to$ `packages/core/src/compiler/pipeline/engine/` + Active Consumer.
    - `AnalysisManager.ts` (168 baris $\to$ 85 baris) $\to$ `packages/core/src/compiler/analysis/manager/` + Active Consumer.
    - `FieldTypeResolver.ts` (167 baris $\to$ 85 baris) $\to$ `packages/core/src/ir/domain/field-type/` + Active Consumer.
    - `ResponseSchemaMapper.ts` (167 baris $\to$ 80 baris) $\to$ `packages/core/src/compiler/generators/contract-generation/response-schema/` + Active Consumer.
    - `TypeScriptWriter.ts` (165 baris $\to$ 45 baris) $\to$ `packages/cli/src/generators/writer/` + Active Consumer.
    - `SemanticResolutionKernel.ts` (164 baris $\to$ 105 baris) $\to$ `packages/core/src/semantic/kernel/` (`typeMapper.ts`, `contextBuilder.ts`, `defaultPlugins.ts`) + Active Consumer.
    - `ContractInputBoundary.ts` (164 baris $\to$ 80 baris) $\to$ `packages/core/src/compiler/compatibility/boundary/` (`types.ts`, `legacyResolver.ts`) + Active Consumer.
    - `SemanticResolutionContext.ts` (161 baris $\to$ 63 baris) $\to$ `packages/cli/src/generators/semantic/context/` (`astExtractors.ts`, `manifestNormalizer.ts`) + Active Consumer.
    - `ResponseArtifact.ts` (162 baris $\to$ 80 baris) $\to$ `packages/core/src/compiler/ir/response/` (`responseGuards.ts`, `responseArtifactFactory.ts`) + Active Consumer.
    - `SalsaCompiler.ts` (161 baris $\to$ 98 baris) $\to$ `packages/core/src/compiler/query/salsa/queryExecutor.ts` + Active Consumer.
    - `Writer.ts` (160 baris $\to$ 66 baris) $\to$ `packages/core/src/compiler/writers/writerTypes.ts` + Active Consumer.
    - `ResolvedPhpType.ts` (174 baris $\to$ 18 baris) $\to$ `packages/core/src/compiler/types/resolved-php/` (`variants.ts`, `matcher.ts`) + Active Consumer.
    - `ModelSymbolTable.ts` (173 baris $\to$ 16 baris) $\to$ `packages/core/src/compiler/scanner/symbols/model/` (`types.ts`, `originModelSymbol.ts`, `modelSymbolTableClass.ts`) + Active Consumer.
    - `routeResponses.ts` (171 baris $\to$ 15 baris) $\to$ `packages/core/src/compiler/scanner/descriptors/route/error-response/` (`types.ts`, `errorFactories.ts`, `ScannedHttpErrorResponseDescriptor.ts`) + Active Consumer.
    - `modelRelationDescriptorClass.ts` (170 baris $\to$ 118 baris) $\to$ `packages/core/src/compiler/scanner/descriptors/model/relation/relationFactories.ts` + Active Consumer.
    - `provenance.ts` (169 baris $\to$ 21 baris) $\to$ `packages/core/src/types/domain/provenance/` (`dataProvenanceKind.ts`, `endpointProvenance.ts`) + Active Consumer.
  - **Full Monorepo Build & Test Green**: Monorepo build 100% sukses (`tsup`) dan suite Vitest di `packages/sdk` (110 file test, 614 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (Tier 170–200 Lines) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Berkas Tier 170–200 Baris ke Sub-Domain Terfokus & Active Consumers**:
    - `QueryDatabase.ts` (198 baris $\to$ 48 baris) $\to$ `packages/core/src/compiler/query/database/` (`types.ts`, `memoizedDatabase.ts`, `index.ts`) + Active Consumer.
    - `manifestDescriptors.ts` (195 baris $\to$ 17 baris) $\to$ `packages/core/src/compiler/scanner/descriptors/manifest/` (`resourceRouteGroupDescriptor.ts`, `routeManifestDescriptor.ts`, `index.ts`) + Active Consumer.
    - `FormFieldMapper.ts` (192 baris $\to$ 22 baris) $\to$ `packages/core/src/compiler/generators/form-generation/field-mapper/` (`types.ts`, `ruleMapper.ts`, `index.ts`) + Active Consumer.
    - `PhpCodeParser.ts` (191 baris $\to$ 12 baris) $\to$ `packages/cli/src/parsers/php/` (`sourceSlice.ts`, `nodeMapper.ts`, `expressionParser.ts`, `index.ts`) + Active Consumer.
    - `TypedCache.ts` (189 baris $\to$ 97 baris) $\to$ `packages/core/src/compiler/query/cache/` (`storage.ts`, `queryKey.ts`, `index.ts`) + Active Consumer.
    - `ResponseIR.ts` (189 baris $\to$ 33 baris) $\to$ `packages/core/src/compiler/ir/response-ir/` (`types.ts`, `factories.ts`, `index.ts`) + Active Consumer.
    - `Graph.ts` (188 baris $\to$ 17 baris) $\to$ `packages/core/src/compiler/utils/graph/` (`frozenSet.ts`, `dependencyGraph.ts`, `graphAlgorithms.ts`, `index.ts`) + Active Consumer.
    - `RequestEndpointBuilder.ts` (188 baris $\to$ 138 baris) $\to$ `packages/core/src/ir/domain/request-endpoint/` (`endpointRefs.ts`, `requestValidator.ts`, `index.ts`) + Active Consumer.
    - `HookGenerator.ts` (187 baris $\to$ 47 baris) $\to$ `packages/cli/src/generators/hooks/` (`hookConfigLowerer.ts`, `hookSourceLowerer.ts`, `index.ts`) + Active Consumer.
    - `IntentResolver.ts` (185 baris $\to$ 69 baris) $\to$ `packages/cli/src/resolvers/intent/` (`cartModelResolver.ts`, `cartGroupDetector.ts`, `index.ts`) + Active Consumer.
    - `SDKGenerator.ts` (182 baris $\to$ 51 baris) $\to$ `packages/cli/src/generators/sdk/` (`endpointResolver.ts`, `apiObjectEmitter.ts`, `index.ts`) + Active Consumer.
    - `resourceDescriptors.ts` (181 baris $\to$ 15 baris) $\to$ `packages/core/src/compiler/scanner/descriptors/resource/` (`resourceFieldDescriptor.ts`, `resourceDescriptorClass.ts`, `index.ts`) + Active Consumer.
    - `ContractIR.ts` (176 baris $\to$ 25 baris) $\to$ `packages/core/src/compiler/ir/contract/` (`types.ts`, `factories.ts`, `index.ts`) + Active Consumer.
    - `typeMapping.ts` (176 baris $\to$ 18 baris) $\to$ `packages/cli/src/generators/canonical/type-mapping/` (`constants.ts`, `resolvers.ts`, `index.ts`) + Active Consumer.
    - `MethodReturnResolver.ts` (CLI) (176 baris $\to$ 32 baris) $\to$ `packages/cli/src/resolvers/plugins/method-return/` (`resolvedMethodHandler.ts`, `methodCallHandler.ts`, `index.ts`) + Active Consumer.
    - `MethodReturnResolver.ts` (Core) (174 baris $\to$ 28 baris) $\to$ `packages/core/src/semantic/plugins/method-return/` (`staticMethodResolver.ts`, `instanceMethodResolver.ts`, `index.ts`) + Active Consumer.
    - `IWriter.ts` (179 baris $\to$ 20 baris) $\to$ `packages/core/src/compiler/writers/contracts/` (`artifact.ts`, `errors.ts`, `writer.ts`, `index.ts`) + Active Consumer.
    - `caseLexer.ts` (179 baris $\to$ 60 baris) $\to$ `packages/core/src/utils/naming/lexer/` (`types.ts`, `tokenizer.ts`, `formatters.ts`, `index.ts`) + Active Consumer.
    - `ssaRenamer.ts` (176 baris $\to$ 80 baris) $\to$ `packages/core/src/compiler/analysis/ssa/renamer/` (`variableVersionScope.ts`, `blockInstructionRenamer.ts`, `index.ts`) + Active Consumer.
  - **Full Monorepo Build & Test Green**: Monorepo build 100% sukses (`tsup`) dan suite Vitest di `packages/sdk` (109 file test, 601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (Tier 200–220 Lines) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Berkas Tier 200–220 Baris ke Sub-Domain Terfokus & Active Consumers**:
    - `ControlFlowGraph.ts` (220 baris $\to$ 20 baris) $\to$ `packages/core/src/compiler/utils/cfg/` (`constants.ts`, `instructions.ts`, `basicBlock.ts`, `index.ts`) + Active Consumer.
    - `RoutesGenerator.ts` (216 baris $\to$ 65 baris) $\to$ `packages/cli/src/generators/routes/` (`pageEndpointDescriptor.ts`, `routeTreeSerializer.ts`, `pathLookup.ts`, `index.ts`) + Active Consumer.
    - `TSFormatter.ts` (216 baris $\to$ 51 baris) $\to$ `packages/core/src/compiler/formatting/typescript/ast-format/` (`types.ts`, `importSorter.ts`, `declarationSorter.ts`, `index.ts`) + Active Consumer.
    - `ServiceGraphBuilder.ts` (211 baris $\to$ 96 baris) $\to$ `packages/core/src/graph/service/` (`nodeFactories.ts`, `graphAssembler.ts`, `manifestGraphCompiler.ts`, `index.ts`) + Active Consumer.
    - `ZodToTSEmitIR.ts` (210 baris $\to$ 17 baris) $\to$ `packages/sdk/src/emitter/zod-converter/` (`types.ts`, `astToZodCode.ts`, `moduleConverter.ts`, `index.ts`) + Active Consumer.
    - `ControllerScanner.ts` (208 baris $\to$ 47 baris) $\to$ `packages/core/src/compiler/scanner/subscanners/controller/` (`responseDetector.ts`, `actionScanner.ts`, `index.ts`) + Active Consumer.
    - `DataFlowAnalysis.ts` (207 baris $\to$ 35 baris) $\to$ `packages/core/src/compiler/analysis/dataflow/` (`types.ts`, `forwardSolver.ts`, `backwardSolver.ts`, `index.ts`) + Active Consumer.
    - `channelDescriptors.ts` (205 baris $\to$ 22 baris) $\to$ `packages/core/src/compiler/scanner/descriptors/channel/` (`patternCompiler.ts`, `channelFactories.ts`, `channelDescriptorClass.ts`, `index.ts`) + Active Consumer.
    - `ResponseArtifactBuilder.ts` (206 baris $\to$ 180 baris) $\to$ `packages/core/src/compiler/ir/response/builder/` (`bodyPresets.ts`, `artifactFactory.ts`, `index.ts`) + Active Consumer.
    - `ResponseFieldParser.ts` (205 baris $\to$ 24 baris) $\to$ `packages/core/src/compiler/generators/contract-generation/response-field/` (`types.ts`, `typeNormalizer.ts`, `fieldParser.ts`, `index.ts`) + Active Consumer.
    - `FormRequestScanner.ts` (204 baris $\to$ 75 baris) $\to$ `packages/core/src/compiler/scanner/subscanners/form-request/` (`ruleCollector.ts`, `fieldAssembler.ts`, `index.ts`) + Active Consumer.
    - `PassGraph.ts` (204 baris $\to$ 33 baris) $\to$ `packages/core/src/compiler/passes/graph/` (`graphAnalyzer.ts`, `topologicalSorter.ts`, `index.ts`) + Active Consumer.
    - `ContractCodeBuilder.ts` (203 baris $\to$ 138 baris) $\to$ `packages/core/src/compiler/generators/contract-generation/builder/` (`errorSectionBuilder.ts`, `index.ts`) + Active Consumer.
    - `route-classifier.ts` (201 baris $\to$ 155 baris) $\to$ `packages/cli/src/generators/classifier/domainGraphBuilder.ts` + Active Consumer.
    - `tokenizer.ts` (207 baris $\to$ 115 baris) $\to$ `packages/core/src/compiler/scanner/lexer/tokenize/` (`characterPredicates.ts`, `compoundScanners.ts`, `index.ts`) + Active Consumer.
    - `SalsaCompiler.ts` (200 baris $\to$ 153 baris) $\to$ `packages/core/src/compiler/query/salsa/cycleDetector.ts` + Active Consumer.
    - `TSComment.ts` (202 baris $\to$ 85 baris) $\to$ Ekstraksi `packages/core/src/compiler/target/typescript/nodes/TSJSDocTag.ts`.
  - **Full Monorepo Build & Test Green**: Monorepo build 100% sukses (`tsup`) dan suite Vitest di `packages/sdk` (109 file test, 601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (Tier 220–250 Lines) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Berkas Tier 220–250 Baris ke Sub-Domain Terfokus & Active Consumers**:
    - `TypeSystem.ts` (249 baris $\to$ 51 baris) $\to$ `packages/core/src/compiler/types/system/` (`typeLattice.ts`, `subtypingChecker.ts`, `assignabilityChecker.ts`, `index.ts`) + Active Consumer.
    - `VariableResolver.ts` (227 baris $\to$ 55 baris) $\to$ `packages/core/src/semantic/plugins/variable/` (`thisResolver.ts`, `assignmentResolver.ts`, `modelNameResolver.ts`, `index.ts`) + Active Consumer.
    - `entityNormalizers.ts` (227 baris $\to$ 20 baris) $\to$ `packages/cli/src/generators/normalizer/entities/` (`resourceNormalizer.ts`, `modelNormalizer.ts`, `routeNormalizer.ts`, `index.ts`) + Active Consumer.
    - `ConstraintSolver.ts` (220 baris $\to$ 84 baris) $\to$ `packages/core/src/compiler/constraints/solver/` (`constraintStep.ts`, `variableResolver.ts`, `index.ts`) + Active Consumer.
    - `TSMethodSignature.ts` (232 baris $\to$ 165 baris) $\to$ Pemisahan kelas `TSParameter` ke `packages/core/src/compiler/target/typescript/nodes/TSParameter.ts`.
    - `TSExportDeclaration.ts` (223 baris $\to$ 188 baris) $\to$ Pemisahan kelas `TSExportSpecifier` ke `packages/core/src/compiler/target/typescript/nodes/TSExportSpecifier.ts`.
  - **Full Monorepo Build & Test Green**: Monorepo build 100% sukses (`tsup`) dan suite Vitest di `packages/sdk` (109 file test, 601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (Tier 230–240 Lines & 100% Total Wildcard Eradication) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Target Tier 230–240 Baris menjadi Sub-domain Terfokus & Active Consumers**:
    - `ResourceFieldResolver.ts` (236 baris $\to$ 97 baris) $\to$ `packages/cli/src/generators/semantic/resource-field/` (`singleFieldResolver.ts`, `fieldMapBuilder.ts`, `index.ts`) + Active Consumer.
    - `groupDescriptorBuilder.ts` (235 baris $\to$ 22 baris) $\to$ `packages/cli/src/generators/classifier/builders/` (`subRoutePartitioner.ts`, `crudGroupBuilder.ts`, `singletonGroupBuilder.ts`, `index.ts`) + Active Consumer.
    - `commands/audit.ts` (235 baris $\to$ 36 baris) $\to$ `packages/cli/src/commands/audit/` (`driftAuditor.ts`, `semanticAuditor.ts`, `index.ts`) + Active Consumer.
    - `mutationHookBuilders.ts` (234 baris $\to$ 24 baris) $\to$ `packages/react/src/hooks/crud/builders/mutations/` (`invalidateResolver.ts`, `createMutationBuilder.ts`, `updateMutationBuilder.ts`, `deleteMutationBuilder.ts`, `index.ts`) + Active Consumer.
    - `type-guards.ts` (234 baris $\to$ 33 baris) $\to$ `packages/core/src/utils/guards/` (`generalGuards.ts`, `semanticGuards.ts`, `assertionUtils.ts`, `index.ts`) + Active Consumer.
    - `SymbolAnalysis.ts` (234 baris $\to$ 65 baris) $\to$ `packages/core/src/compiler/analysis/symbol/` (`symbolTypes.ts`, `symbolGraph.ts`, `symbolHierarchy.ts`, `index.ts`) + Active Consumer.
  - **100% Total Eradication of Wildcard Re-exports (`0 export * from`) across entire Repository**:
    - Mengonversi sisa `export * from './types/domain'` dan `export * from './types/semantic'` di `packages/core/src/index.ts` ke 100% explicit named exports tanpa duplikasi.
    - Repositori kini 100% bersih dari wildcard re-exports di seluruh berkas TypeScript.
  - **Full Monorepo Build & Test Green**: Monorepo build 100% sukses (`tsup`) dan suite Vitest di `packages/sdk` (109 file test, 601 tests) lulus 100% GREEN.

  - **Dekomposisi Menyeluruh Seluruh Target Tier 240–263 Baris**:
    - `SourceLocation.ts` (263 baris $\to$ 30 baris) $\to$ `packages/core/src/compiler/utils/location/` (`lineMap.ts`, `spanOperations.ts`, `index.ts`) + Active Consumer.
    - `resource-naming.ts` (248 baris $\to$ 34 baris) $\to$ `packages/core/src/utils/naming/` (`caseLexer.ts`, `conventions.ts`, `index.ts`) + Active Consumer.
    - `ResponseFieldLowering.ts` (246 baris $\to$ 54 baris) $\to$ `packages/core/src/compiler/domain/common/response-lowering/` (`loweringContracts.ts`, `loweringMapper.ts`, `index.ts`) + Active Consumer.
    - `modelMemberParser.ts` (246 baris $\to$ 74 baris) $\to$ `packages/core/src/compiler/scanner/subscanners/model/` (`memberPropertiesParser.ts`, `memberCastsParser.ts`, `memberAccessorsParser.ts`, `memberRelationsParser.ts`) + Active Consumer.
    - `LoopAnalysis.ts` (245 baris $\to$ 42 baris) $\to$ `packages/core/src/compiler/analysis/loop/` (`loopTypes.ts`, `loopDetector.ts`, `loopNormalizer.ts`, `index.ts`) + Active Consumer.
    - `passes.ts` (244 baris $\to$ 24 baris) $\to$ `packages/cli/src/generators/passes/` (`modelGraphBuilderPass.ts`, `semanticResolutionPass.ts`, `normalizationPass.ts`, `validationPass.ts`, `index.ts`) + Active Consumer.
    - `ImportCollector.ts` (243 baris $\to$ 54 baris) $\to$ `packages/core/src/compiler/generators/typescript/import-collector/` (`importSpec.ts`, `importStorage.ts`, `index.ts`) + Active Consumer.
    - `TypeScriptEmitter.ts` (241 baris $\to$ 109 baris) $\to$ `packages/core/src/compiler/emitters/typescript/printers/` (`typePrinter.ts`, `declarationPrinter.ts`, `index.ts`) + Active Consumer.
  - **Pembersihan Total Wildcard Re-export (`0 export * from`)**:
    - `packages/cli/src/resolvers/index.ts`
    - `packages/core/src/compiler/artifacts/index.ts`
    - `packages/core/src/compiler/target/typescript/index.ts`
    - `packages/core/src/compiler/scanner/StaticLaravelScanner.ts`
    - `packages/core/src/compiler/index.ts`
    - `packages/core/src/types/domain/database.ts`
    - `packages/core/src/types/domain/lifecycle.ts`
    - `packages/core/src/types/domain/resourceGroups.ts`
    - `packages/core/src/types/domain/responses.ts`
    - `packages/core/src/types/domain/security.ts`
    - `packages/core/src/types/domain/validation.ts`
    - `packages/core/src/types/semantic.ts`
    - `packages/core/src/index.ts` (scanner, descriptors, resolvers, emit, field exports)
  - **Full Monorepo Build & Test Green**: Seluruh 109 file test (601 tests) lulus 100% GREEN tanpa regresi.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (Tier 250–292 Lines & Descriptors/Scanners) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Menyeluruh Seluruh Target Tier 250–292 Baris**:
    - `RequestTypeDeriver.ts` (292 baris $\to$ 43 baris) $\to$ `packages/core/src/compiler/scanner/subscanners/request-deriver/` (5 sub-domain: `rawTypeConverter.ts`, `domainExtractor.ts`, `actionDeriver.ts`, `responseDeriver.ts`, `groupAggregator.ts`) + Active Consumer.
    - `DominatorAnalysis.ts` (292 baris $\to$ 54 baris) $\to$ `packages/core/src/compiler/analysis/dominator/` (4 sub-domain: `dominatorRpo.ts`, `dominatorIntersect.ts`, `dominatorTree.ts`, `dominanceFrontier.ts`) + Active Consumer.
    - `RouteBoundaryAdapter.ts` (289 baris $\to$ 61 baris) $\to$ `packages/core/src/compiler/scanner/resolvers/boundary/` (5 sub-domain: `boundaryBasics.ts`, `identityBuilder.ts`, `bindingBuilder.ts`, `capabilityBuilder.ts`, `provenanceBuilder.ts`) + Active Consumer.
    - `ResponseArtifactBuilder.ts` (277 baris $\to$ 180 baris) $\to$ Ekstraksi `responseHash.ts` dan `responseExamples.ts`.
    - `TypeScriptFormatter.ts` (275 baris $\to$ 57 baris) $\to$ `packages/core/src/compiler/formatting/steps/` (3 sub-domain: `syntaxNormalizer.ts`, `importSorter.ts`, `indentationApplier.ts`) + Active Consumer.
    - `RouteScanner.ts` (268 baris $\to$ 150 baris) $\to$ `packages/core/src/compiler/scanner/subscanners/route-scanner/` (3 sub-domain: `routePathParser.ts`, `routeContextTracker.ts`, `routeEmitter.ts`) + Active Consumer.
    - `useAggregateCollectionIntent.ts` (267 baris $\to$ 67 baris) $\to$ `packages/react/src/hooks/crud/intent/` (5 sub-domain: `intentHelpers.ts`, `intentTypes.ts`, `intentEventEmitter.ts`, `itemActionBuilders.ts`, `promotionActionBuilders.ts`) + Active Consumer.
    - `validationDescriptors.ts` (264 baris $\to$ 45 baris) $\to$ `packages/core/src/compiler/scanner/descriptors/validation/` (4 sub-domain: `validationRuleEntry.ts`, `schemaPayload.ts`, `fieldNodes.ts`, `validationTreeBuilder.ts`) + Active Consumer.
    - `SemanticTypeResolver.ts` (261 baris $\to$ 95 baris) $\to$ `packages/core/src/compiler/domain/common/semantic-resolver/` (3 sub-domain: `resolverContracts.ts`, `primitiveHandlers.ts`, `compoundHandlers.ts`) + Active Consumer.
    - `CodeGenerationEngine.ts` (256 baris $\to$ 175 baris) $\to$ Ekstraksi `packages/core/src/compiler/pipeline/engine/pipelineBuilder.ts`.
    - `ConstantsGenerator.ts` (249 baris $\to$ 65 baris) $\to$ `packages/cli/src/generators/constants/` (4 sub-domain: `routeKeyResolver.ts`, `apiEndpointsBuilder.ts`, `routesObjectBuilder.ts`, `enumConstantsBuilder.ts`) + Active Consumer.
  - **Pembersihan Total Wildcard Re-export (`0 export * from`)**: Mengonversi barrel tersisa (`descriptors/index.ts`, `subscanners/index.ts`, `mapper/index.ts`) ke explicit named exports sesuai Rule 14.
  - **Full Monorepo Build & Test Green**: Seluruh 109 file test (601 tests) lulus 100% GREEN tanpa regresi.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (Tier 300–400 Lines & SDK/CLI Runtime) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Menyeluruh Seluruh Target Tier 300–400 Baris**:
    - `ResolvedSemanticType.ts` (400 baris) $\to$ `packages/core/src/compiler/domain/common/resolved-types/` (5 sub-domain: `types.ts`, `base.ts`, `wrappers.ts`, `compounds.ts`, `catamorphism.ts`) + Active Consumer.
    - `ModelScanner.ts` (393 baris) $\to$ `packages/core/src/compiler/scanner/subscanners/model/` (4 sub-domain: `migrationScanner.ts`, `modelMemberParser.ts`, `columnInferrer.ts`, `modelParser.ts`) + Active Consumer.
    - `SemanticResourceBinder.ts` (379 baris) $\to$ `packages/core/src/compiler/scanner/binders/resource/` (5 sub-domain: `whenLoadedBinder.ts`, `propertyAccessBinder.ts`, `compositeBinders.ts`, `fieldBinder.ts`, `resourceBinder.ts`) + Active Consumer.
    - `CompilerBridge.ts` (377 baris) $\to$ `packages/cli/src/generators/bridge/` (4 sub-domain: `bridgeTypes.ts`, `coreFilesEmitter.ts`, `clientEmitters.ts`, `bridgePipeline.ts`) + Active Consumer.
    - `ExpressionResolver.ts` (Core, 370 baris) $\to$ `packages/core/src/semantic/plugins/expression/` (4 sub-domain: `literalHandler.ts`, `binaryHandler.ts`, `ternaryHandler.ts`, `propertyAccessHandler.ts`) + Active Consumer.
    - `contract-generator-domain.ts` (359 baris) $\to$ `packages/core/src/compiler/passes/contract-domain/` (4 sub-domain: `contractTypes.ts`, `dependencies.ts`, `contractExtraction.ts`, `contractArtifactBuilder.ts`) + Active Consumer.
    - `requestDescriptors.ts` (354 baris) $\to$ `packages/core/src/compiler/scanner/descriptors/request/` (4 sub-domain: `controllerActionDescriptor.ts`, `formFieldDescriptor.ts`, `formActionDescriptor.ts`, `requestTypeDescriptor.ts`) + Active Consumer.
    - `SalsaCompiler.ts` (354 baris) $\to$ `packages/core/src/compiler/query/salsa/` (3 sub-domain: `salsaTypes.ts`, `queryKeyFactory.ts`, `queryGraphManager.ts`) + Active Consumer.
    - `canonical-names.ts` (344 baris) $\to$ `packages/cli/src/generators/canonical/` (3 sub-domain: `actionMap.ts`, `namingConventions.ts`, `typeMapping.ts`) + Active Consumer.
    - `ExpressionResolver.ts` (CLI, 333 baris) $\to$ `packages/cli/src/resolvers/plugins/expression/` (3 sub-domain: `variableHandler.ts`, `literalHandler.ts`, `propertyAccessHandler.ts`) + Active Consumer.
    - `SSAAnalysis.ts` (322 baris) $\to$ `packages/core/src/compiler/analysis/ssa/` (3 sub-domain: `ssaRepresentation.ts`, `ssaBuilder.ts`, `ssaRenamer.ts`) + Active Consumer.
    - `ResponseSchemaMapper.ts` (310 baris) $\to$ `packages/core/src/compiler/generators/contract-generation/response-schema/` (3 sub-domain: `responseSchemaTypes.ts`, `primitiveSchemaBuilder.ts`, `fieldSchemaDispatcher.ts`) + Active Consumer.
    - `annotate.ts` (304 baris) $\to$ `packages/cli/src/commands/annotate/` (3 sub-domain: `types.ts`, `scriptTemplate.ts`, `annotationWriter.ts`) + Active Consumer.
    - `defineApi.ts` (301 baris) $\to$ `packages/sdk/src/api-runtime/` (4 sub-domain: `types.ts`, `clientSingleton.ts`, `optionSplitter.ts`, `schemaMapper.ts`) + Active Consumer.
  - **Active Consumer Orchestrators & Rule 14 Compliance**: Seluruh file monolitik direfaktor menjadi orchestrator murni dengan deklarasi alur data, serta 0 wildcard re-exports (`0 export * from`).
  - **Full Monorepo Build & Test Green**: Seluruh 109 file test (601 tests) lulus 100% GREEN tanpa regresi.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`MapperGeneratorPass.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 414 Baris Menjadi 4 Sub-Domain Fokus (~75-95 Baris)**: Memecah `packages/core/src/compiler/passes/MapperGeneratorPass.ts` ke dalam folder `packages/core/src/compiler/passes/mapper/`: `readMapperBuilder.ts` (90 baris), `formMapperBuilder.ts` (85 baris), `resourceRegistry.ts` (95 baris), dan `mapperAssembler.ts` (80 baris).
  - **Active Consumer Orchestrator Murni (104 baris)**: `MapperGeneratorPass.ts` kini bertindak sebagai Active Consumer murni yang mengoordinasikan pipeline registrasi resource, perakitan kode mapper, dan pembuatan artefak dengan Pure Flow Declaration di method `run()` (4 baris), tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`LaravelSourceLexer.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 415 Baris Menjadi 3 Sub-Domain Fokus (~85-165 Baris)**: Memecah `packages/core/src/compiler/scanner/LaravelSourceLexer.ts` ke dalam folder `packages/core/src/compiler/scanner/lexer/`: `tokenizer.ts` (165 baris), `astClassifier.ts` (90 baris), dan `arrayParser.ts` (110 baris).
  - **Active Consumer Orchestrator Murni (65 baris)**: `LaravelSourceLexer.ts` kini bertindak sebagai Active Consumer murni yang mengoordinasikan tokenisasi FSM atomik, klasifikasi micro-AST, dan parsing array bersarang dengan explicit named exports tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`CodeGenerationEngine.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 424 Baris Menjadi 2 Sub-Domain Fokus (~130-170 Baris)**: Memecah `packages/core/src/compiler/pipeline/CodeGenerationEngine.ts` ke dalam folder `packages/core/src/compiler/pipeline/engine/`: `engineConfig.ts` (130 baris) dan `engineStages.ts` (170 baris).
  - **Active Consumer Orchestrator Murni (120 baris)**: `CodeGenerationEngine.ts` kini bertindak sebagai Active Consumer murni yang mengoordinasikan pipeline tahapan kompilasi code generation dengan explicit named exports tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`ScannedRouteDescriptor.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 465 Baris Menjadi Sub-Domain Fokus**: Memecah `packages/core/src/compiler/scanner/descriptors/ScannedRouteDescriptor.ts` ke dalam folder `packages/core/src/compiler/scanner/descriptors/route/`: memisahkan pabrik semantik rute ke `routeSemanticFactories.ts` (306 baris).
  - **Active Consumer Orchestrator Murni (317 baris)**: `ScannedRouteDescriptor.ts` kini bertindak sebagai Active Consumer murni yang mengoordinasikan deskriptor rute dan pabrik semantiknya dengan explicit named exports tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`incremental.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 514 Baris Menjadi 6 Sub-Domain Fokus (~35-90 Baris)**: Memecah `packages/cli/src/utils/incremental.ts` ke dalam folder `packages/cli/src/utils/incremental/`: `incrementalTypes.ts` (50 baris), `routeHasher.ts` (35 baris), `collectionCanonicalizer.ts` (75 baris), `fieldResolver.ts` (80 baris), `modelAccessorResolver.ts` (80 baris), `resourceResolver.ts` (60 baris), dan `routeResolver.ts` (90 baris).
  - **Active Consumer Orchestrator Murni (85 baris)**: `incremental.ts` kini bertindak sebagai Active Consumer murni yang mengoordinasikan pipeline resolusi manifest bertahap (`resolveManifestIncrementally`) dengan Pure Flow Declaration murni tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`ContractCodeBuilder.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 518 Baris Menjadi 4 Sub-Domain Fokus (~50-120 Baris)**: Memecah `packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts` ke dalam folder `packages/core/src/compiler/generators/contract-generation/builder/`: `contractBuilderTypes.ts` (50 baris), `responseSectionBuilder.ts` (120 baris), `requestSectionBuilder.ts` (100 baris), dan `exportsSectionBuilder.ts` (80 baris).
  - **Active Consumer Orchestrator Murni (100 baris)**: `ContractCodeBuilder.ts` kini bertindak sebagai Active Consumer murni yang mengoordinasikan perakitan 4 seksi `api-contract.ts` dengan Pure Flow Declaration dan pure functional entry point `formatContractFile()`, tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`TypeScriptTypeLowerer.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 521 Baris Menjadi 5 Sub-Domain Fokus (~40-160 Baris)**: Memecah `packages/core/src/compiler/domain/common/TypeScriptTypeLowerer.ts` ke dalam folder `packages/core/src/compiler/domain/common/ts-lowerer/`: `typeScriptVocabulary.ts` (80 baris), `typeScriptSyntax.ts` (95 baris), `typeScriptMetadata.ts` (40 baris), `typeScriptCodeBuilder.ts` (160 baris), dan `typeScriptNodeLowerer.ts` (75 baris).
  - **Active Consumer Orchestrator Murni (95 baris)**: `TypeScriptTypeLowerer.ts` kini bertindak sebagai Active Consumer murni yang mengoordinasikan lowering target TypeScript dengan pure factory `createTypeScriptCodeBuilder()` dan pure transform `lowerTypeScriptTypes()`, tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`defineHooks.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 571 Baris Menjadi 5 Sub-Domain Fokus (~60-120 Baris)**: Memecah `packages/react/src/hooks/defineHooks.ts` ke dalam folder `packages/react/src/hooks/define/`: `hookTypes.ts` (110 baris), `intentTypes.ts` (120 baris), `groupSlotResolver.ts` (100 baris), `unifiedHookBuilder.ts` (60 baris), dan `intentWrapper.ts` (120 baris).
  - **Active Consumer Orchestrator Murni (100 baris)**: `defineHooks.ts` kini bertindak sebagai Active Consumer murni yang mengoordinasikan perakitan TanStack React Query endpoint hooks dengan Pure Flow Declaration murni tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`modelDescriptors.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 575 Baris Menjadi 5 Sub-Domain Fokus (~68-170 Baris)**: Memecah `packages/core/src/compiler/scanner/descriptors/modelDescriptors.ts` ke dalam folder `packages/core/src/compiler/scanner/descriptors/model/`: `modelCastDescriptor.ts` (68 baris), `modelRelationDescriptor.ts` (160 baris), `modelColumnDescriptor.ts` (95 baris), `modelAccessorDescriptor.ts` (70 baris), dan `modelEntityDescriptor.ts` (170 baris).
  - **Active Consumer Orchestrator Murni (95 baris)**: `modelDescriptors.ts` kini bertindak sebagai Active Consumer murni yang menyediakan pure composite factory functions (`createScannedModel`, `createScannedColumn`, `createScannedCast`, `createScannedRelation`, `createScannedAccessor`) dengan explicit named exports tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`SemanticTypeDeriver.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 609 Baris Menjadi 6 Sub-Domain Fokus (~72-176 Baris)**: Memecah `packages/core/src/compiler/scanner/subscanners/SemanticTypeDeriver.ts` ke dalam folder `packages/core/src/compiler/scanner/subscanners/semantic/`: `SemanticDerivationContext.ts` (72 baris), `fieldExtractors.ts` (130 baris), `modelExtractors.ts` (90 baris), `resourceTypeDeriver.ts` (124 baris), `routeResponseDeriver.ts` (176 baris), dan `modelTypeDeriver.ts` (95 baris).
  - **Active Consumer Orchestrator Murni (108 baris)**: `SemanticTypeDeriver.ts` kini bertindak sebagai Active Consumer murni yang mengoordinasikan perakitan stream `ObjectType[]` (resources $\to$ route responses $\to$ models) dengan Pure Flow Declaration di `run()`, tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`normalizer.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 610 Baris Menjadi 5 Sub-Domain Fokus (~51-227 Baris)**: Memecah `packages/cli/src/generators/normalizer.ts` ke dalam folder `packages/cli/src/generators/normalizer/`: `normalizerTypes.ts` (131 baris), `semanticNodeHelpers.ts` (80 baris), `fieldNormalizer.ts` (146 baris), `entityNormalizers.ts` (227 baris), dan `modelGraphBuilder.ts` (51 baris).
  - **Active Consumer Orchestrator Murni (119 baris)**: `normalizer.ts` kini bertindak sebagai Active Consumer murni yang mengoordinasikan pipeline normalizer passes (`ModelGraphBuilderPass`, `SemanticResolutionPass`, `NormalizationPass`, `ValidationPass`) dengan explicit named exports tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`createCrudHooks.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 699 Baris Menjadi 4 Sub-Domain Fokus (~47-266 Baris)**: Memecah `packages/react/src/hooks/createCrudHooks.ts` ke dalam folder `packages/react/src/hooks/crud/`: `crudTypes.ts` (47 baris), `crudCallers.ts` (52 baris), `crudNotifications.ts` (60 baris), dan `useAggregateCollectionIntent.ts` (266 baris).
  - **Active Consumer Orchestrator Murni (390 baris)**: `createCrudHooks.ts` kini bertindak sebagai Active Consumer murni yang mengoordinasikan callers, toast messages, dan aggregate collection intent actions dengan explicit named exports tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`route-classifier.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 708 Baris Menjadi 5 Sub-Domain Fokus (~90-235 Baris)**: Memecah `packages/cli/src/generators/route-classifier.ts` ke dalam folder `packages/cli/src/generators/classifier/`: `classifierTypes.ts` (119 baris), `pathClassifier.ts` (94 baris), `routeGrouper.ts` (110 baris), `typeResolver.ts` (121 baris), dan `groupDescriptorBuilder.ts` (235 baris).
  - **Active Consumer Orchestrator Murni (201 baris)**: `route-classifier.ts` kini bertindak sebagai Active Consumer murni yang mengoordinasikan sub-domain classifiers. Method `classifyDomainGraph()` murni berupa Pure Flow Declaration (`manifest -> classifyRoutes -> buildResourceMap -> buildGroupDescriptors -> ClassifiedDomainGraph`), mengeliminasi inline branching dengan explicit named exports tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`ResponseArtifact.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 744 Baris Menjadi 6 Sub-Domain Fokus (~50-160 Baris)**: Memecah `packages/core/src/compiler/ir/ResponseArtifact.ts` ke dalam folder `packages/core/src/compiler/ir/response/`: `responseDescriptors.ts` (93 baris), `objectSchemas.ts` (45 baris), `responseBodies.ts` (96 baris), `ResponseArtifactClass.ts` (54 baris), `ResponseArtifactBuilder.ts` (276 baris), dan `artifactFamily.ts` (113 baris).
  - **Active Consumer Orchestrator Murni (161 baris)**: `ResponseArtifact.ts` kini bertindak sebagai Active Consumer murni yang mengoordinasikan sub-domain response IR. Menyediakan factory method penyatu `createResponseArtifact()`, pure type guards (`isDataResponse`, `isBinaryResponse`, `isRedirectResponse`, `hasBody`, `isHighConfidence`), dan explicit named exports tanpa wildcard `export * from`.
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature dan class publik dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`semantic-resolver.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 943 Baris Menjadi 5 Sub-Domain Fokus (~100 Baris)**: Memecah `packages/cli/src/generators/semantic-resolver.ts` ke dalam folder `packages/cli/src/generators/semantic/`: `semanticTypes.ts` (90 baris), `FieldTypeMapper.ts` (89 baris), `SemanticResolutionContext.ts` (160 baris), `ResponseResolver.ts` (140 baris), dan `ResourceFieldResolver.ts` (235 baris).
  - **Active Consumer Orchestrator Murni (119 baris)**: `SemanticResolver` kini bertindak sebagai Active Consumer murni yang mengoordinasikan sub-domain resolvers. Method `resolve()` murni berupa Pure Flow Declaration (`manifest -> resolveResponseTypes -> resolveFieldMappings -> resolveRoutes -> countResponsesByGroup -> CompilerIR`).
  - **Zero Wildcard Re-export & Full Monorepo Green**: Mempertahankan seluruh signature publik dan extractors (`toFieldResolutionMeta`, `resolveCanonicalAction`, `extractThisPropertyAccess`, `isNullableTernaryGuard`, `SemanticResolutionContext`) dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`ContractIRBuilder.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 955 Baris Menjadi 6 Sub-Domain Fokus (~100 Baris)**: Memecah `packages/core/src/ir/ContractIRBuilder.ts` ke dalam `domain/`: `irTypes.ts` (71 baris), `SemanticTypeResolvers.ts` (83 baris), `FieldTypeResolver.ts` (166 baris), `ResourceMapperBuilder.ts` (105 baris), `ResourceIRBuilder.ts` (151 baris), `RequestEndpointBuilder.ts` (187 baris), dan `ContractMetadataBuilder.ts` (69 baris).
  - **Active Consumer Orchestrator Murni (137 baris)**: `OptimizedContractIRBuilder` kini bertindak sebagai Active Consumer murni yang mengoordinasikan sub-domain builders. Method `buildFromManifest()` murni berupa Pure Flow Declaration (`manifest -> buildResources -> buildRequests -> buildEndpoints -> buildMetadata -> ContractIR`).
  - **Zero Wildcard Re-export & Full Compatibility**: Menjaga alias `ContractIRBuilder`, method `build()`, dan `validateIR()` dengan 0 `export * from`. Seluruh 109 test files (601 tests) lulus 100% GREEN.

- **Active Consumer Orchestrator & Sub-Domain Decomposition (`TypeScriptGenerator.ts`) (Rule 14, Rule 8, & Rule 12)**:
  - **Dekomposisi Monolitik 1.010 Baris Menjadi Sub-Domain ~100 Baris**: Memecah `packages/core/src/compiler/generators/typescript/TypeScriptGenerator.ts` ke dalam 5 modul sub-domain terfokus di `domain/`: `generatorErrors.ts` (83 baris), `ImportTracker.ts` (81 baris), `CompositeTypeConverter.ts` (72 baris), `TypeConverter.ts` (155 baris), dan `InterfaceBuilder.ts` (138 baris).
  - **Active Consumer Orchestrator Murni (91 baris)**: `TypeScriptGenerator` kini bertindak sebagai Active Consumer murni yang mengimpor kapabilitas sub-domain tanpa inline parsing atau state mutation liar. Method `generate()` murni berupa Pure Flow Declaration (`graph -> buildDeclarations -> buildImports -> TSFile`).
  - **Zero Wildcard Re-export**: Mengeliminasi seluruh `export * from` pada aggregator generator, menggunakan explicit named exports murni.
  - **Zero Test Modifications & Full Monorepo Green**: Mempertahankan compat delegators sehingga 0 baris test diubah, seluruh 91 unit test TypeScriptGenerator lulus, dan seluruh 109 test files (601 tests) monorepo lulus 100% GREEN.

- **Architectural Upgrade: First-Class Domain Resolvers & Complete Contract Consumer (`ScannedRouteDescriptor.create()`) (Rule 8, 10, 11, 12, & 13 RouteSync)**:
  - **First-Class Domain Resolvers di Origin Boundary**: Mengekstrak seluruh logika guessing dan procedural branching dari `routeDescriptors.ts` ke dalam dedicated pure domain models:
    - `RouteDomainResolver`: Canonical domain resolution deterministik menggantikan 7 `if` di `resolveDomain`.
    - `RouteCrudClassifier`: O(1) pattern table `(HttpMethod, PathShape) -> CrudRole` menggantikan 5 ternary chaining.
    - `RouteSecurityResolver`: Ekstraksi middleware `can:` dan `throttle:` menggantikan 4 `if` dan 5 ternary.
    - `RouteBoundaryAdapter`: Perimeter adapter yang menyintesis 4 Complete Sub-Contracts (`identity`, `binding`, `capability`, `provenance`) dari sparse options bags tanpa mencemari core domain.
  - **Eliminasi 96% `if` Statements & 100% Procedural Guessing**: Jumlah `if` pada `routeDescriptors.ts` anjlok dari **24 menjadi 1** (hanya 1 type guard di `create()`), ternaries pada core creation lenyap total dari 25 menjadi 0, dan `create()` murni mengonsumsi 4 Complete Sub-Contracts.
  - **Zero Monorepo Regression & Full Verification**: 108 test files (596 tests) lulus 100% GREEN, termasuk 4 test suite baru di `packages/sdk/tests/pureRouteDomainContracts.spec.ts`.

- **Upstream Invariant Refactoring: Holistic Route Domain Contracts & Upstream Complete Constructor Data Aggregation (`routeDescriptors.ts` & `normalizer.ts`) (Rule 8, 10, 11, 12, & 13 RouteSync)**:
  - **Type Vocabulary Design (TTD) — 4 Closed Sub-Contracts**: Mendefinisikan 4 Closed Sub-Contracts non-nullable pada `packages/core/src/types/domain/routes.ts`: `RouteIdentityContract` (name, method, path, runtimePath, resourceName, domain, groupName, parameters: `RouteParameterSpecification`), `RouteBindingContract` (handler, action, actionName, controllerName, schema, response, responseTypeName, formRequests, assignments), `RouteCapabilityContract` (auth, security, middleware, policies, rateLimit, invalidation, crudRole, hookKind, actionKind, isMutating, requestContentType, executionSignature, errorResponses), dan `RouteProvenanceContract` (sourceFile, sourceLine, uri).
  - **Upstream Complete Constructor Data Aggregation (0 `?`, 0 `??`, 0 `?.`, 0 `if`)**: Constructor `ScannedRouteDescriptor` menerima `ScannedRouteCompleteContracts` dengan `contract: EndpointContract` yang strictly non-nullable (0 `?`), dengan 100% direct assignment dari ke-4 sub-contracts dan contract (`this.contract = params.contract`). Seluruh fallback operators (`??` dan `?.`) pada `routeDescriptors.ts` berhasil dieliminasi total menjadi 0.
  - **Origin Boundary Contract Synthesis (`fromSubcontracts`)**: Menambahkan `ScannedEndpointContract.fromSubcontracts(...)` pada `packages/core/src/types/domain/contracts.ts` sehingga `contract: EndpointContract` disintesis tuntas di Origin Boundary (`.create()`, `.withInvalidation()`, `.fromScanned()`) sebelum memanggil `new ScannedRouteDescriptor(...)`.
  - **Zero Breaking Changes via Synchronized Facade Properties**: Seluruh properti eksisting pada `ScannedRouteDescriptor` (`.name`, `.path`, `.method`, `.actionName`, `.controllerName`, `.schema`, dll.) dipertahankan dan tersinkronisasi langsung dengan $O(1)$ ke sub-contracts, menjamin backwards compatibility penuh bagi seluruh consumer hilir.
  - **Downstream Pure Dataflow di Normalizer**: `packages/cli/src/generators/normalizer.ts` (`normalizeRoutes`) direfaktor untuk mengonsumsi `route.identity` dan `route.binding` secara langsung tanpa defensive null/undefined checks (`route.name || route.uri`, `route.uri || route.path`, `route.actionName || 'index'`).
  - **Comprehensive Verification Suite**: Menambahkan `packages/sdk/tests/pureRouteDomainContracts.spec.ts` (4 tests, total 108 test files, 592 tests passing 100% GREEN, 0 errors).

- **High-Level Architectural Refactoring: Eliminasi Total Naked Record, Dynamic Index Hacking & Leaky Primitives via First-Class Domain Specifications (Rule 8, 10, 11, 12, & 13 RouteSync)**:
  - **First-Class Domain Specifications & Symbol Tables**: Merombak total `packages/core/src/types/domain/requestModels.ts` (`RequestHeaders`, `RouteParameters`, `RouteQueryParameters`, `RequestPayload`). Mengeliminasi seluruh dynamic indexing cast `(this as Record<string, unknown>)[k] = v`, menghapus internal backing `_record: Readonly<Record<...>>`, dan menyimpan data murni dalam frozen private `ReadonlyMap` dengan canonical case-insensitive lookup O(1) dan implementasi `Iterable<TEntry>`. Menyediakan boundary adapter murni `.toDictionary()` saat serialisasi keluar.
  - **Eliminasi Total Wildcard `any`**: Mengubah `RouteTransform` menjadi `RouteTransformFn<unknown, unknown>`, mengikat generic parameter `responseSchema?: ResponseSchema<TResponse>` pada `RouteDefinition`, dan mengonversi `ApiDefinition` menjadi `RouteDefinition<unknown, unknown, unknown, HttpMethod>` tanpa membocorkan `any` ke inference client SDK.
  - **Discriminated AST Variants untuk Sentinel `null`**: Memecah `LiteralAST` pada `packages/core/src/types/semantic.ts` menjadi closed discriminated union `ParsedLiteralAST = ScalarLiteralAST | NullLiteralAST`, serta memperbarui catamorphic visitor `matchParsedAST` dengan handler `null_literal` (0 `if`, 0 `switch`).
  - **Comprehensive Verification Suite**: Menambahkan test `null_literal` pada `packages/sdk/tests/pureCoreTypeContracts.spec.ts` (28 tests, total 107 test files, 588 tests passing 100% GREEN, 0 error type-checking).

- **Type-Driven Architectural Refactoring: Eliminasi Contract Holes (`?:`), `null`, & Naked `Record` pada Core Types (`request.ts` & `semantic.ts`) (Rule 8, 10, 11, & 12 RouteSync)**:
  - **Eliminasi Total `null` & Naked `Record` di Request Layer**: Membangun Value Objects dan Domain Collections murni di `packages/core/src/types/domain/requestModels.ts` (`RequestHeaders`, `RouteParameters`, `RouteQueryParameters`, `RequestPayload`, `RouteSchemaModel`, `ResponseSchemaModel`, `RouteMapperModel`). Menggantikan naked `Record<string, any>` dan mengeliminasi total union `| null`. Menyediakan case-insensitive lookup O(1) pada `RequestHeaders` dan backward-compatible property spread.
  - **Complete Constructor Contract (`RouteDefinitionDescriptor`)**: Menetapkan `RouteDefinitionContract` berprinsip Complete Contract (0 `?`, 0 `null`). Constructor `RouteDefinitionDescriptor` mengusung 100% direct assignment tanpa fallback internal, dilengkapi static semantic factory `.fromMinimal()` yang mengisi nilai default non-nullable (`RequestHeaders.empty()`, `RouteParameters.empty()`, `RouteQueryParameters.empty()`, `RequestPayload.empty()`, `RouteSchemaModel.empty()`, `ResponseSchemaModel.empty()`).
  - **Penguatan Semantic AST, Pure Encapsulated Collection ADTs (Opsi 2) & Catamorphic Eliminator**: Menambahkan `SourceRefFactory` dengan default koordinat non-nullable, `IRHintsFactory` dengan confidence pasti, `IRRawNodeDescriptor` (0 `?` constructor), serta 8 dedicated domain collection maps di `packages/core/src/types/domain/semanticCollections.ts` (`ModelFieldMap`, `ModelRelationMap`, `ModelAccessorMap`, `ModelServiceMap`, `ModelControllerMap`, `ModelNodeMap`, `SemanticModelMap`, `SemanticRelationMap`) sebagai **Pure Encapsulated Collection ADTs (Opsi 2)** dengan `ReadonlyMap`, `Iterable<TEntry>`, `.get()`, `.has()`, `.size`, dan `.toObject()` (0 `any`, 0 naked `Record`, 0 pseudo-dictionary index signatures). `ServiceGraphBuilder` mengadopsi formal builder pattern (`registerModel`, `registerService`, `registerController`). `SemanticFieldSet`, `ModelCastCollection`, dan `ZodObjectShape` menerapkan interface `Iterable`.
  - **Zero-Branching Catamorphism (`matchParsedAST`)**: Menyediakan pattern matcher `matchParsedAST` untuk seluruh 15 varian AST PHP (`variable`, `literal`, `property_access`, `method_call`, dll.) dengan O(1) dispatch (0 `if`, 0 `switch`).
  - **Comprehensive Verification Suite**: Menambahkan `packages/sdk/tests/pureCoreTypeContracts.spec.ts` (27 tests, total 107 test files, 587 tests passing 100% GREEN).

- **Type-Driven Architectural Refactoring: Eliminasi Contract Holes (`?:`) & Branching Proliferation (`if`/`ternary`) pada Route Classifier (`route-classifier.ts`) (Rule 8, 10, 11, & 12 RouteSync)**:
  - **Complete Constructor Contract & Static Semantic Factory**: Menghilangkan tanda `?` pada `ScannedClassifiedRouteParams.contract` sehingga parameter constructor menuntut `EndpointContract` non-nullable secara terjamin, mengonversi body constructor menjadi **100% direct assignment** (`this.contract = params.contract`). Menyediakan static semantic factory `ScannedClassifiedRouteDescriptor.fromRoute(raw, meta)` untuk resolusi kontrak di Origin Boundary.
  - **Eliminasi 100% Optional Chaining (`?.`) & Quadruple Probing**: Menghilangkan seluruh 17 kemunculan `?.` di `route-classifier.ts` (turun dari 17 menjadi 0) dan memangkas `??` dari 13 menjadi 0 pada kode eksekusi. Quadruple fallback error probing dieliminasi menjadi pembacaan langsung `route.contract.response.errors`.
  - **Streamlined Partitioning & Pure Type Signature Builder**: Menggabungkan duplikasi pengumpulan tipe impor (`collectImportedTypes`) dan mutasi standar (`getStandardMutationKeys`), memangkas cabang `if` dari 63 menjadi 44 (-46.3% total branching reduction).
  - **Comprehensive Verification Suite**: Menambahkan `packages/sdk/tests/pureRouteClassifierContracts.spec.ts` (7 tests, total 106 test files, 560 tests passing 100% GREEN).

- **Type-Driven Architectural Refactoring: Eliminasi Contract Holes (`?:`) & Branching Proliferation (`if`/`switch`) pada IR Layer (`ir.ts` & `ContractIRBuilder.ts`) (Rule 8, 10, 11, & 12 RouteSync)**:
  - **7-Variant Discriminated Union ADT**: Mengganti leaky `ResolvedSemanticType` god object (12 field serba opsional) di `packages/core/src/types/ir.ts` dengan closed ADT 7 varian: `PrimitiveSemanticTypeIR`, `ResourceSemanticTypeIR`, `ModelSemanticTypeIR`, `ObjectSemanticTypeIR`, `ArraySemanticTypeIR`, `UnionSemanticTypeIR`, dan `LiteralSemanticTypeIR`.
  - **Static Semantic Factory & Frozen Invariant**: Menyediakan `ResolvedSemanticTypeFactory` dengan method `.primitive()`, `.resource()`, `.model()`, `.object()`, `.array()`, `.union()`, dan `.literal()`, menjamin seluruh instance beku via `Object.freeze` dan required property lengkap sejak Origin Boundary.
  - **Catamorphic Pattern Matcher (`matchResolvedSemanticType`)**: Mengeliminasi seluruh 8-case `switch (semanticType.kind)` di `ContractIRBuilder.ts` (`semanticToTypeIR`), menurunkan total branching di `ContractIRBuilder.ts` dari 59 menjadi 41 (-30.5%).
  - **Direct Safe Type Resolution**: Menghilangkan manual type assertions (`as { kind: ... }`) dan defensive property guards pada `resolveObject`, `resolveArray`, `resolveUnion`, dan `resolveLiteral`.
  - **Ergonomic Construction**: Mendukung default context dan method alias `build(manifest: RouteManifest)` pada `OptimizedContractIRBuilder`.
  - **Comprehensive Verification Suite**: Menambahkan `packages/sdk/tests/pureContractIrTypes.spec.ts` (9 tests, total 105 test files, 553 tests passing 100% GREEN).

- **Upstream Type Vocabulary Design (TTD) & Complete Contract pada `SemanticTypeDeriver.ts` dan `compiler.ts` (Rule 8, 10, 11, & 12 RouteSync)**:
  - **Upstream TTD ADT `ResolvedPhpType`**: Diciptakannya ADT formal `ResolvedPhpType` di `packages/core/src/compiler/types/ResolvedPhpType.ts` (`PrimitivePhpType`, `EloquentModelPhpType`, `ResourceWrapperPhpType`, `VoidPhpType`, `UnknownPhpType`) dengan complete constructor contracts (0 `?`), 100% direct assignment, frozen invariant, dan catamorphic pattern matcher `matchResolvedPhpType`.
  - **Eliminasi 100% Defensive Operators pada `SemanticTypeDeriver.ts`**: Operator `??` turun dari 27 menjadi 0 (di kode eksekusi), dan `?.` turun dari 43 menjadi 0 (di kode eksekusi).
  - **Origin Boundary `SemanticDerivationContext`**: Membekukan dan menjamin validitas koleksi input (`resources`, `models`, `routes`) serta O(1) indexed lookup `modelsByName`.
  - **Pure Fail-Fast Extractors**: Mengekstrak `extractFieldNullability`, `extractFieldTypeString`, `extractFieldExpression`, `findCastForColumn`, dan `extractModelAccessors` tanpa probing nested `?.` chaining.
  - **Downstream Map-Lookup Normalization pada `compiler.ts`**: Mengeliminasi 100% operator fallback `??` (dari 34 menjadi 0) pada `PassGraph`, `IncrementalInvalidator`, `UnionFind`, `ConstraintSolver`, `SymbolDatabase`, `DominatorTree`, `LoopAnalysis`, `DominanceFrontier`, `UseDefGraph`, `SSARenamer`, `CopyCoalescer`, dan `AnalysisDependencyGraph` melalui pure helper `getMapValueOrDefault`, `getOrCreateSet`, dan `getOrCreateArray`.
  - **Regression Test Suite**: Menambahkan `packages/sdk/tests/pureSemanticTypeDeriverContracts.spec.ts` (11 tests, total 104 test files, 544 tests passing 100% GREEN).

- **Complete Contract & Pure Dataflow Pipeline pada `semantic-resolver.ts` (Rule 8, 10, 11, & 12)**:
  - Mengeliminasi 100% defensive fallback `??` (dari 34 menjadi 0 pada kode eksekusi) dan `?.` optional chaining (dari 35 menjadi 0 pada kode eksekusi).
  - Mengisolasi normalisasi input di **Origin Boundary** melalui `SemanticResolutionContext.fromManifest(manifest)` yang menjamin non-nullable collections (`routes`, `models`, `resources`) serta O(1) indexed maps (`modelsByName`, `resourcesByName`).
  - Mengonversi $O(N)$ linear scans (`.some()` dan `.find()`) pada pencocokan model dan kolom menjadi O(1) index map lookups.
  - Memisahkan AST extractor (`extractThisPropertyAccess`, `isNullableTernaryGuard`, `resolveCanonicalAction`) menjadi pure type-guard functions tanpa probing berantai.
  - Sentralisasi `mapSqlTypeToMapping` ke dalam `canonical-names.ts` sebagai single source of truth untuk konversi SQL/cast type.
  - Memperkenalkan Complete Contract `FieldResolutionMeta` dan static factory `toFieldResolutionMeta` untuk menghilangkan parameter serba opsional pada resolusi field.
  - Menambahkan regression test `packages/sdk/tests/pureSemanticResolverContracts.spec.ts` (12 tests, total 103 test files, 533 tests passing 100% GREEN).

- **Clean Constructor & Complete Contract pada `channelDescriptors.ts` (Rule 10 & 12)**:
  - Mengeliminasi seluruh tanda `?` pada interface parameter constructor (`ScannedBroadcastChannelParams`). Seluruh 7 field dijamin non-nullable dan required sejak Origin Boundary.
  - Mengeliminasi defensive fallback dan mutasi di dalam body constructor menjadi **100% direct assignment** (`this.parameters = parameters`).
  - Sentralisasi helper interpolasi `compileBroadcastRuntimePattern(pattern, parameters)` di Origin Boundary, mengeliminasi 4x duplikasi regex string replace.
  - Menyelaraskan static semantic factories `.public()`, `.private()`, `.presence()` agar mengembalikan instance resmi `ScannedBroadcastChannelDescriptor`, serta menambahkan `.none()` dan `.empty()`.
  - Mengupdate [`LaravelChannelParser.ts`](file:///home/annas-zen/Documents/RouteSync/packages/cli/src/parsers/LaravelChannelParser.ts) untuk mengonsumsi static semantic factory `ScannedBroadcastChannelDescriptor.fromPattern(...)`.
  - Menambahkan regression test `packages/sdk/tests/pureChannelDescriptorsContracts.spec.ts` (7 tests, total 102 test files, 521 tests passing 100% GREEN).

- **Clean Constructor & Complete Contract pada `modelDescriptors.ts` & `requestDescriptors.ts` (Rule 10 & 12)**:
  - Mengeliminasi seluruh tanda `?` pada seluruh interface parameter constructor (`ScannedModelParams`, `ScannedModelRelationParams`, `ScannedModelColumnParams`, `ScannedModelCastParams`, `ScannedModelAccessorParams`, `ScannedControllerActionParams`, `ScannedFormFieldParams`, `ScannedFormActionParams`, `ScannedRequestTypeParams`). Seluruh field dijamin non-nullable dan required sejak Origin Boundary.
  - Mengeliminasi seluruh defensive fallback (`??`, `?.`, `if (!x)`) di dalam seluruh body constructor menjadi **100% direct assignment** (`this.x = params.x`).
  - Pembekuan objek (`Object.freeze`) dan resolusi nilai default dipindahkan sepenuhnya ke **Origin Boundary Static Semantic Factories** (`.create()`, `.empty()`, `.none()`, `.fromTable()`, `.required()`, `.optional()`, `.file()`, `.fromReturnType()`, `.fromMapping()`).
  - Menambahkan regression test `packages/sdk/tests/pureModelAndRequestDescriptorsContracts.spec.ts` (9 tests, total 101 test files, 513 tests passing 100% GREEN).

- **Clean Constructor & Complete Contract pada `routeDescriptors.ts` (Rule 10 & 12)**:
  - Mengeliminasi seluruh tanda `?` pada seluruh interface parameter constructor (`ScannedRouteParams`, `ScannedRouteParameterParams`, `ScannedRouteQueryParameterParams`, `ScannedRoutePolicyParams`, `ScannedRateLimitParams`, `ScannedHttpErrorResponseParams`). Seluruh field dijamin non-nullable dan required sejak Origin Boundary.
  - Mengeliminasi seluruh defensive fallback (`??`, `?.`, `if (!x)`) di dalam body constructor menjadi **100% direct assignment**.
  - Menyediakan Static Semantic Factories di Origin Boundary (`ScannedRouteDescriptor.fromControllerAction()`, `fromControllerReference()`, `fromClosure()`, `synthetic()`, dan `ScannedRateLimitDescriptor.none()`).

- **34th ADT Registry: `RouteHandlerDescriptor` & Ordered Array `FormRequestDescriptor`**:
  - Diciptakannya `packages/core/src/types/domain/routeHandlers.ts` yang memformalkan varian eksekusi route handler:
    - `RouteHandlerKind`: `ControllerAction` (`'controller_action'`), `InvokableController` (`'invokable_controller'`), dan `Closure` (`'closure'`).
    - `ROUTE_HANDLER_KIND_REGISTRY` & Catamorphism murni `matchRouteHandler(handler, visitor)` (0 `if`, 0 `switch`).
    - `FormRequestDescriptor` & `ScannedFormRequestDescriptor` sebagai representasi FormRequest terurut (*ordered array*) menggantikan `formRequestName: string | null` yang rapuh.
  - Re-ekspor lengkap di `packages/core/src/types/domain/index.ts` dan `packages/core/src/index.ts`.

### Fixed
- **Normalisasi Origin Boundary Level B: Full ADT & Zero Null / Zero `?` pada `ParsedRoute` & `ScannedRouteDescriptor`**:
  - `ParsedRoute` kini memiliki `readonly domain: string;` dan `readonly action: string;` yang **guaranteed non-nullable** (0 `?`, 0 `null`, 0 `undefined`).
  - Mengeliminasi total `formRequestName: string | null` (termasuk getter nullable) dari seluruh domain model (`ParsedRoute`, `ScannedRouteDescriptor`, `ScannedControllerActionDescriptor`, `ControllerActionInfo`), digantikan 100% oleh **Ordered Array SSOT**:
    - `readonly formRequests: readonly FormRequestDescriptor[];` (guaranteed non-nullable array `[]`, 0 `null`, 0 `undefined`, 0 `?`).
    - `readonly formRequestNames: readonly string[];` (guaranteed non-nullable array `[]`, 0 `null`, 0 `undefined`, 0 `?`).
  - `ScannedRouteDescriptor` kini secara otomatis mengklasifikasikan `action`, `controllerName`, dan `actionName` menjadi `RouteHandlerDescriptor` ADT yang beku (`Object.freeze()`).
  - Mengeliminasi seluruh type cast bypass `(route as any).domain`, `(route as any).action`, dan `(route as any).formRequestName` di seluruh pipeline compiler (`typeDeriverUtils.ts`, `SemanticTypeDeriver.ts`, `ValidationRuleFieldLowerer.ts`, `contracts.ts`, `RouteScanner.ts`, `ControllerScanner.ts`).
  - Menambahkan regression test `packages/sdk/tests/parsedRouteActionNormalizationSSOT.spec.ts` (6/6 tests passing, total 99 test files, 487 tests passing 100% GREEN).

### Removed
- **Retirement of Legacy `LaravelRouteParser.ts` (1.348 baris) & PHP Subprocess Tests**:
  - Menghapus parser legacy berbasis `php -r` subprocess (`packages/cli/src/parsers/LaravelRouteParser.ts`).
  - Menghapus file scratch sementara `packages/cli/src/parsers/test_method_return.php`.
  - Menghapus test legacy PHP subprocess (`packages/cli/src/parsers/__tests__/LaravelRouteParser.*.test.ts`, `packages/sdk/tests/laravelParser.spec.ts`, `packages/sdk/tests/jsonResourceWrap.spec.ts`).
  - Seluruh pipeline produksi (`routesync scan`, `routesync sync`, `routesync audit`) kini 100% dipandu oleh `StaticLaravelScanner` (TypeScript static analysis murni, 0 PHP subprocess).

### Refactored
- **Modularisasi Monolitik `TypeDeriver.ts` & Eliminasi 6x Duplikasi Heuristik Tipe**:
  - Merampingkan `TypeDeriver.ts` dari 768 baris menjadi 48 baris (Thin Orchestrator Facade) dengan 100% backward compatibility.
  - Memecah 2 god method ke dalam sub-modul terfokus berukuran ideal (< 300 baris):
    - `typeDeriverUtils.ts`: Sentralisasi `resolvePrimitiveKind` (mengeliminasi 6x duplikasi pengecekan string manual `.includes('int')`, `.includes('decimal')`, dsb.) dan `resolveRouteDomain` (mengeliminasi tangga 10-tingkat `if (!rawDomain)`).
    - `ValidationRuleFieldLowerer.ts`: Menangani lowering aturan validasi wildcard (`.*.`), primitive arrays (`.*`), dan regular fields menjadi `RequestField[]`.
    - `RequestTypeDeriver.ts`: Mengambil alih derivasi `RequestType[]` AST streams.
    - `SemanticTypeDeriver.ts`: Mengambil alih derivasi `ObjectType[]` AST streams untuk Resource, Inline response, dan Model.
  - Menambahkan regression & contract test `typeDeriverModularFlowSSOT.spec.ts` (4 test passing, total 98 test files, 481 tests passing 100% GREEN).
- **Modularisasi Monolitik `StaticLaravelScanner.ts`, `LaravelSourceLexer.ts`, & `route.ts`**:
  - Memecah 5 berkas domain yang berukuran besar (> 800 baris) ke dalam sub-modul terfokus berukuran ideal (150 – 500 baris):
    - `responses.ts` ➔ `responseShapes.ts`, `responseDescriptors.ts`, `sdkResponses.ts`.
    - `security.ts` ➔ `httpVocabulary.ts`, `authAndPolicy.ts`, `httpErrors.ts`.
    - `database.ts` ➔ `databaseColumns.ts`, `eloquentTypes.ts`, `models.ts`.
    - `lifecycle.ts` ➔ `crudRoles.ts`, `cacheInvalidation.ts`, `executionSignatures.ts`.
    - `resourceGroups.ts` ➔ `resourceGroupDescriptors.ts`, `domainGraph.ts`.
    - `validation.ts` ➔ `validationRules.ts`, `validationFields.ts`.
  - Merampingkan `route.ts` dari 7.054 baris menjadi 5 baris (`export * from './domain';`) dengan **100% backward compatibility** tanpa ada breaking change.
  - Memecah berkas monolitik `StaticLaravelScanner.ts` (4.108 baris) menjadi 2 sub-direktori kohesif:
    - `packages/core/src/compiler/scanner/descriptors/`: AST descriptors (`types.ts`, `validationDescriptors.ts`, `routeDescriptors.ts`, `resourceDescriptors.ts`, `modelDescriptors.ts`, `channelDescriptors.ts`, `requestDescriptors.ts`, `manifestDescriptors.ts`).
    - `packages/core/src/compiler/scanner/subscanners/`: Domain scanners & passes (`ChannelScanner.ts`, `ControllerScanner.ts`, `ResourceScanner.ts`, `FormRequestScanner.ts`, `ModelScanner.ts`, `RouteScanner.ts`, `InvalidationResolver.ts`, `TypeDeriver.ts`, `scannerUtils.ts`).
  - Memecah `LaravelSourceLexer.ts` ke dalam sub-modul `packages/core/src/compiler/scanner/lexer/`:
    - `PhpAst.ts`: AST shapes, token types, and expression factory.
    - `SourceStream.ts`: Cursor stream reader and character scanner.
  - Merampingkan `StaticLaravelScanner.ts` (213 baris, reduksi ~95%) dan `LaravelSourceLexer.ts` dengan **100% backward compatibility** via barrel re-exports.
  - Seluruh 99 test files (489 tests) di Vitest lolos 100% GREEN.

### Added
- **`domainGraphClassifierADT.spec.ts`** — Suite unit & regression test yang memverifikasi arsitektur **33rd ADT Registry: ResourceGroupDescriptor & ClassifiedDomainGraph**:
  - **33rd ADT Registry (`ResourceGroupKind`, `RESOURCE_GROUP_REGISTRY`, `matchResourceGroup`)**:
    - Mendefinisikan discriminator ADT kanonikal (`Crud`, `Singleton`, `Custom`) dengan registry spesifikasi yang mengunci perilaku layout (`isCrud`, `listKeyFn`, `defaultDetailKeyFn`, `defaultPrimaryKeyType`).
    - Catamorphism murni 0-if `matchResourceGroup(group, visitor)` untuk mengeksekusi percabangan struktural domain tanpa defensive `if` / `switch`.
  - **Single Origin Boundary Domain Graph Classification (`classifyDomainGraph`)**:
    - Mengeliminasi kalkulasi berulang `classifyRoutes` dan `buildResourceMap` yang sebelumnya dipanggil 3x di setiap downstream generator (`QueryKeyGenerator`, `HookGenerator`, `SDKGenerator`).
    - Mengintegrasikan resolusi tipe primary key (`primaryKeyType`) secara authoritative dari `ROUTE_PARAMETER_TYPE_REGISTRY` dan Model AST di Origin Boundary, bukan ditebak di hilir.
  - **0-If Downstream Emitters (`QueryKeyGenerator.ts`, `HookGenerator.ts`)**:
    - `QueryKeyGenerator.ts`: Mengeliminasi `if (isCrud)` dan ternary fallback primary key; rendering factory query key dipandu 100% oleh `matchResourceGroup(group, ...)`.
    - `HookGenerator.ts`: Mengeliminasi ternary berulang `isCrudKey ? 'lists' : 'list'` dan `isCrudKey ? 'detail' : ...`, kini langsung mengonsumsi `group.listKeyFn` dan `group.detailKeyFn` dari SSOT domain graph.
- **`correctByConstructionSSOT.spec.ts`** — Suite unit & contract test yang memverifikasi arsitektur **Rule 12: Typed, Contract-Driven, Correct-by-Construction Dataflow**:
  - **Eliminasi Defensive Chaining pada `SDKGenerator.ts`**: Mengeliminasi seluruh defensive optional chaining `?.` dan pemeriksaan `contract.response?.success?.readTypeName` dengan langsung mengonsumsi non-nullable complete contract SSOT.
  - **Pure Catamorphism Action Normalization pada `HookGenerator.ts`**: Normalisasi action key CRUD (`update`, `remove`) kini 100% dipandu oleh pure catamorphism `matchCrudRole` tanpa percabangan if string manual.
  - **Zero Regex Fallback pada `ConstantsGenerator.ts`**: Mengeliminasi fallback regex `matchAll` untuk URL parameter dan konsumsi langsung `contract.request.pathParameters` dan `contract.runtimePath`.
  - **Origin Boundary Path Parameter Invariant pada `route.ts`**: Penjaminan normalisasi `pathParameters` dan `runtimePath` sejak `ScannedEndpointContract.fromRoute(route)` sehingga downstream generator tidak lagi perlu menebak atau merekonstruksi path segment.
- **`verifiedDataPipelineSSOT.spec.ts`** — Suite unit & contract test yang memverifikasi pencapaian **100% Invariant-Driven / Verified Data Pipeline**:
  - **Stage 2: Validation Fail-Fast Gatekeeper**:
    - `DiagnosticCategory` discriminator (`Syntax`, `Schema`, `TypeMismatch`, `UnresolvedReference`, `InvariantViolation`) dengan mapped registry `DIAGNOSTIC_CATEGORY_REGISTRY` dan `matchDiagnosticCategory` catamorphism.
    - `DiagnosticBag`: Method `hasErrors()`, `getErrors()`, `getWarnings()`, `merge()`, dan fail-fast boundary gatekeeper `assertNoErrors()` yang melempar `CompilerValidationError` saat input cacat mencoba menembus boundary.
  - **Stage 5: Boundary Emitters Provenance Annotations**:
    - `EchoGenerator.ts`: Menyematkan tag JSDoc `@provenance` dan `@see` pada broadcast channel hook listeners.
    - `MswGenerator.ts`: Menyematkan tag JSDoc `@provenance` dan `@see` pada setiap mocked HTTP handler sesuai `route.contract.provenance`.
  - **Stage 4: Pure IR Lowering & Contract Code Builder**:
    - `ContractCodeBuilder.ts`: Men-generate JSDoc `@provenance` pada schema kontrak runtime dan response schemas, serta menuntaskan pembersihan residual `schemaLines` fallback.
- **`endToEndDataProvenanceSSOT.spec.ts`** — Suite unit & contract test yang memverifikasi arsitektur **End-to-End Data Provenance SSOT**:
  - **Canonical Data Provenance ADT**:
    - `DataProvenanceKind` discriminator (`RouteDefinition`, `ControllerAction`, `FormRequest`, `EloquentModel`, `JsonResource`, `Inferred`) dengan mapped registry `DATA_PROVENANCE_REGISTRY` yang mengunci metadata `category`, `isSourceLinked`, dan `description`.
    - `matchDataProvenance` pure 0-if catamorphism pattern matcher dengan exhaustive type safety.
    - `ProvenanceSourceRef` dan immutable container `EndpointProvenanceDescriptor` / `ScannedEndpointProvenanceDescriptor` dengan factory `.create()` dan `.inferred()`.
  - **Origin Boundary Contract Binding**:
    - `ScannedEndpointContract.fromRoute(route)` secara otomatis merakit pelacakan sumber rute (`routes/api.php:line`), controller method (`Controller@action`), form request validation schema, dan Eloquent model / JsonResource response.
    - `StaticLaravelScanner.ts` melacak dan mengalirkan `controllerName` langsung ke `ScannedRouteDescriptor` dan `EndpointContract.provenance`.
  - **Downstream Emitter Annotations**:
    - `SDKGenerator.ts`: Men-generate JSDoc annotation `@provenance` dan `@see` di atas setiap deklarasi API endpoint.
    - `HookGenerator.ts`: Men-generate JSDoc annotation `@provenance` dan `@see` di atas setiap custom hook export.
- **`pureContractDrivenArchitectureSSOT.spec.ts`** — Suite unit & contract test yang memverifikasi pencapaian 100% Pure Contract-Driven Architecture (CDA) across entire RouteSync compiler pipeline:
  - **Top-Level Manifest Contracts SSOT**:
    - Penambahan `readonly contracts: readonly EndpointContract[];` pada `RouteManifest` dan `ScannedRouteManifestDescriptor` yang dijamin selalu beku (frozen) dan utuh sejak Origin Boundary.
    - Penambahan helper `getManifestContractMap(manifest)` untuk resolusi O(1) kontrak endpoint terstruktur berbasis contract ID / action name.
    - Penambahan helper `getRouteContract(route)` untuk penjaminan complete `EndpointContract` pada seluruh varian rute (termasuk partial mock routes).
  - **Origin Boundary Contract Binding pada Classified Routes**:
    - `ClassifiedRoute` dan `ScannedClassifiedRouteDescriptor` kini mengikat `contract: EndpointContract` secara non-nullable dan terjamin sejak awal klasifikasi rute.
  - **Direct Downstream Contract Consumption**:
    - `SDKGenerator.ts`: Murni mengonsumsi `route.contract` (`contract.request.hasBody`, `contract.response.success.validatorName`, `contract.response.success.readTypeName`, `contract.response.success.mapperName`, `contract.runtimePath`) tanpa defensive fallback atau inspeksi heuristik objek legacy.
    - `HookGenerator.ts`: Murni mengonsumsi `route.contract` untuk resolusi read type, form type, error responses union, dan query cache invalidations.
  - **Extended Request Contract Guarantees**:
    - Penambahan properti `readonly hasBody: boolean;` pada `EndpointRequestContract` serta jaminan penanganan fallback otomatis untuk `isMutating`, `hookKind`, dan `crudRole` di `ScannedEndpointContract.fromRoute`.
- **`policyAndPageEndpointAdtFlowSSOT.spec.ts`** — Suite unit & contract test yang memverifikasi arsitektur ADT Flow Data untuk Route Authorization Policies dan Page Route Endpoints (Mencapai 100% Pemetaan ADT Domain RouteSync):
  - **Route Authorization Policy ADT**:
    - `RoutePolicyKind` discriminator (`AbilityModel`, `Gate`, `Custom`) dengan mapped registry `ROUTE_POLICY_REGISTRY` yang mengunci metadata `requiresModel` dan deskripsi domain.
    - `matchRoutePolicy` pure catamorphism pattern matcher tanpa statement `if`/`switch` yang mendukung polimorfik input descriptor maupun kind string.
    - `ScannedRoutePolicyDescriptor` dengan semantic factory constructors (`.abilityModel()`, `.gate()`, `.custom()`, `.create()`) menghasilkan frozen complete contract.
    - `StaticLaravelScanner.ts` memetakan middleware `can:` langsung ke semantic factory yang tepat di Origin Boundary.
  - **Page Route Endpoint ADT**:
    - `PageEndpointKind` discriminator (`Static`, `Parameterized`, `QueryFiltered`) dengan mapped registry `PAGE_ENDPOINT_REGISTRY` yang mengunci callable signature dan parameter requirements.
    - `matchPageEndpoint` pure catamorphism pattern matcher tanpa branching `if`/`switch`.
    - `ScannedPageEndpointDescriptor` dengan semantic factory constructors (`.static()`, `.parameterized()`, `.queryFiltered()`).
    - `RoutesGenerator.ts` merefaktor `serializeTree` murni mendispatch emisi kode rute JavaScript dan TypeScript via `matchPageEndpoint` dengan zero ternary & zero defensive conditional.
- **`httpErrorAdtFlowSSOT.spec.ts`** — Suite unit & contract test yang memverifikasi arsitektur ADT Flow Data untuk Canonical HTTP Error Responses:
  - **Canonical HTTP Error ADT**:
    - `HttpErrorKind` discriminator (`Validation`, `Unauthorized`, `Forbidden`, `NotFound`, `ServerError`, `Custom`) dengan mapped registry `HTTP_ERROR_KIND_REGISTRY` yang mengunci status code default (`422`, `401`, `403`, `404`, `500`, `400`), nama tipe interface, client vs server error classifications.
    - `matchHttpError` pure catamorphism pattern matcher tanpa statement `if`/`switch` yang mendukung descriptor maupun kind string.
    - `ScannedHttpErrorResponseDescriptor` dengan semantic factory constructors (`.validation()`, `.unauthorized()`, `.forbidden()`, `.notFound()`, `.serverError()`, `.custom()`).
    - `ContractCodeBuilder.ts` men-generate Zod schemas (`laravelValidationErrorSchema`, `laravelUnauthorizedErrorSchema`) dan typed validators (`validateLaravelValidationError`, `validateLaravelUnauthorizedError`).
    - `TypeGenerator.ts` mengekspor interface kanonikal `LaravelValidationError` dan `LaravelUnauthorizedError` di `types/index.ts`.
    - `HookGenerator.ts` mengonsumsi error responses dari SSOT kontrak rute dan menghasilkan slot `error: typeOf<ErrorType>()` strongly typed pada TanStack query/mutation hooks.
- **Contract-Driven Architecture (CDA) — Unified Compiler Pipeline & Downstream Pure Consumer SSOT**:
  - **Core Guaranteed Contract**: Penambahan abstract property `validatorName: string` pada `ResponseDescriptorBase` dan implementasi kanonikal pada seluruh varian respons (`ResourceResponseDescriptor`, `ModelResponseDescriptor`, `VoidResponseDescriptor`, `InlineResponseDescriptor`) sehingga kontrak validator response (`validate{Resource}Schema`, `validate{Resource}Index`, atau `'undefined'`) dijamin 100% sejak Origin Boundary tanpa tebak-tebakan string di hilir.
  - **HookGenerator Simplification (Peluang A)**: Eliminasi total ketergantungan `ResponseAnalysisHelper`, pemanggilan runtime `ResponseArtifactMap`, lookup set `knownModels`/`knownResources`, serta 30-baris recursive helper `resolveResponseInfo()` dari `HookGenerator.ts`. Seluruh penentuan tipe read (`list`, `detail`, `never`) murni mengonsumsi SSOT `route.response.readTypeName`.
  - **SDKGenerator Pure Consumer Refactoring (Peluang B)**: Eliminasi 95 baris pengecekan heuristik object/field rekursif di `getResponseInfo()`, penghapusan `sdkRespCount`, `knownModels`, dan `knownResources`. `SDKGenerator.ts` kini murni mengonsumsi SSOT `route.response.validatorName`, `route.response.readTypeName`, dan `route.response.mapperName` dari manifest descriptor.
  - **CompilerBridge Unified Pipeline & CLI Orchestration**: Penambahan method `CompilerBridge.compileAll(manifest)` dan `CompilerBridge.emitAll(manifest, outputDir)` yang mengeksekusi ke-5 compiler passes (`TypeScriptGeneratorPass`, `FormGeneratorPass`, `ContractGeneratorPass`, `ApiFieldGeneratorPass`, `MapperGeneratorPass`) dalam satu lintasan terpadu dengan ekstraksi input request types tunggal (mengeliminasi 4x re-ekstraksi redundant). Perintah CLI `generate.ts` dan `sync.ts` dimigrasi menggunakan `CompilerBridge.emitAll` untuk jaminan koherensi artefak kontrak 100%.
  - **QueryKeyGenerator Route Parameter SSOT (Peluang A)**: Resolusi tipe primary key generic `createBaseQueryKey<typeof Entity.X, TId>` kini memprioritaskan SSOT `route.pathParameters[0].type` via `ROUTE_PARAMETER_TYPE_REGISTRY[p.type].tsType` sebelum fallback ke nama model Eloquent, mengeliminasi dependensi fuzzy plural matching string.
  - **TypeGenerator Re-export Path Alignment (Peluang B)**: Penyelarasan jalur re-export form types di `types/index.ts` dari `./api-form` menjadi `../forms/api-form` sehingga 100% koheren dengan lokasi emisi compiler pass `forms/api-form.ts`.
  - **NextActionGenerator & MswGenerator Pure ADT Catamorphism (Peluang C)**: Eliminasi branching manual `isCollection` di `MswGenerator.ts` dengan memanfaatkan catamorphism `matchResponseShape(route.response.shape, ...)`, serta refactoring `NextActionGenerator.ts` untuk mengeliminasi blok `switch (payloadMode)` dengan memanfaatkan `matchRoutePayloadMode` yang langsung mengonsumsi SSOT `route.raw.executionSignature`. Perluasan `matchRouteExecutionSignature` di `@routesync/core` untuk mendukung input polimorfik baik berupa instance `RouteExecutionSignature` maupun direct `RoutePayloadMode` string.
  - **Downstream Pure Consumer Regression Suite**: Penambahan verifikasi test 6, 7, 8, 9, 10, 11, dan 12 pada `downstreamPureConsumerSSOT.spec.ts` untuk pengujian `HookGenerator` type resolution, `CompilerBridge.compileAll` bundle cohesion, `CompilerBridge.emitAll` file emissions, `QueryKeyGenerator` pathParameters SSOT, `TypeGenerator` barrel re-export, `MswGenerator` pure response shape catamorphism, dan `NextActionGenerator` execution signature SSOT.
- **`endpointContractAndUnifiedPipelineSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur CDA & ADT tingkat penuh:
  - **`EndpointContract` ADT Architecture (Langkah 2)**: Formalisasi ADT `EndpointContract` lengkap di `@routesync/core` yang menyatukan Request SSOT (`EndpointRequestContract`), Success Response SSOT (`EndpointSuccessResponseContract`), dan Error Responses SSOT (`EndpointErrorResponseContract`) termasuk `LaravelValidationError` (422) dan `LaravelUnauthorizedError` (401). Disertai semantic factory `ScannedEndpointContract.fromRoute(route)` / `createEndpointContract(route)` dan pure catamorphism `matchEndpointResponse`.
  - **First-Class `route.contract` Binding (Pilihan B)**: `EndpointContract` kini terikat langsung sebagai first-class immutable property `route.contract: EndpointContract` pada `ScannedRouteDescriptor` (dan opsional pada `ParsedRoute`), menjamin ketersediaan complete contract di Origin Boundary tanpa re-komputasi.
  - **Downstream Generator Pure Registry & SSOT Cleanup (Peluang A)**:
    - `ConstantsGenerator.ts`: Konsumsi langsung `col.enumValues` SSOT tanpa parsing regex `^enum\((.*)\)$`.
    - `EchoGenerator.ts`: Resolusi tipe parameter murni via `ROUTE_PARAMETER_TYPE_REGISTRY[p.type].tsType` dan konsumsi langsung `channel.runtimePattern`.
    - `ModelGenerator.ts`, `passes.ts`, dan `normalizer.ts`: Pemetaan tipe kolom database murni via `DATABASE_COLUMN_KIND_REGISTRY[col.columnKind].tsType`.
    - `response-analysis-helper.ts`: Ditandai `@deprecated` dan `@internal` mengarahkan pemanggil ke `CompilerBridge` atau pipeline compiler pass.
  - **Typed Error Handling pada `@routesync/react`**: Perluasan generic `HookForEndpoint<T, TError = ApiError>` dan `CrudHooks<TTypes, TEndpoint, TGroupName, TError = ResolveError<TTypes>>` di `defineHooks.ts` untuk mendukung pengetikan error terstruktur berbasis SSOT.
  - **Full Unified Compiler Orchestration (`CompilerBridge.emitFullBundle`) (Langkah 1)**: Penambahan method `CompilerBridge.emitFullBundle(manifest, outputDir, options)` yang mengorkestrasi emisi ke-5 compiler pass contract dan seluruh artefak klien (`SDKGenerator`, `TypeGenerator`, `QueryKeyGenerator`, `ConstantsGenerator`, `HookGenerator`, `NextActionGenerator`, `MswGenerator`, `EchoGenerator`, `ModelGenerator`, `RoutesGenerator`, `IndexGenerator`) secara atomik. Perintah CLI `generate.ts` dan `sync.ts` dimigrasi murni memanggil `emitFullBundle` (91 test files, 441 tests, 100% GREEN).
- **`crudRoleAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Canonical REST CRUD Roles: (1) `CRUD_ROLE_REGISTRY` sebagai mapped type registry untuk seluruh 6 varian `CrudRole` (`index`, `show`, `create`, `update`, `delete`, `custom`) dengan penjaminan `isMutating`, `isCollection`, `isItem`, `affectsSingleResource`, `defaultActionName`, `defaultHttpMethod`, `defaultHookKind`, `defaultActionKind`, dan `description`, (2) `matchCrudRole` catamorphism pattern matcher murni tanpa branching `if`/`switch`, (3) semantic factory constructors pada `ScannedCrudRoleDescriptor` (`.index()`, `.show()`, `.create()`, `.update()`, `.delete()`, `.custom()`, `.fromRole()`), (4) refactoring `StaticLaravelScanner.ts` menggunakan `matchHttpMethod` untuk komputasi `CrudRole`, dan (5) integrasi `route-classifier.ts` mengonsumsi `CRUD_ROLE_REGISTRY` dan `matchCrudRole` untuk eliminasi pengecekan manual peran CRUD dan pembentukan action name.
- **`resolvedSemanticTypeAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Resolved Semantic Types (Compiler IR): (1) `RESOLVED_SEMANTIC_TYPE_REGISTRY` sebagai mapped type registry untuk seluruh 9 varian `ResolvedSemanticTypeKind` (`primitive`, `reference`, `optional`, `nullable`, `collection`, `object`, `union`, `intersection`, `unknown`) dengan penjaminan `isTerminal`, `isWrapper`, `isCompound`, dan `description`, (2) `matchResolvedSemanticType` catamorphism pattern matcher murni tanpa statement `if`/`switch`, (3) penambahan static semantic factories pada `ResolvedPrimitiveType` (`.string()`, `.number()`, `.boolean()`, `.datetime()`, `.file()`, `.unknown()`) dan `ResolvedReferenceType` (`.named()`), dan (4) recursive zero-if type emitter catamorphism pipeline.
- **`httpStatusCodeAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk HTTP Status Codes: (1) `HTTP_STATUS_CODE_REGISTRY` sebagai mapped type registry untuk 13 status code standar (`200`, `201`, `202`, `204`, `400`, `401`, `403`, `404`, `405`, `409`, `422`, `429`, `500`) dengan penjaminan `category`, `isSuccess`, `isError`, `isClientError`, `isServerError`, `hasResponseBody`, `statusText`, dan `description`, (2) `matchHttpStatusCode` catamorphism pattern matcher murni tanpa branching `if`/`switch`, dan (3) refactoring `classifyCrudRole` di `packages/cli/src/generators/route-classifier.ts` mengonsumsi `matchHttpMethod` dengan zero statement `switch`.
- **`httpMethodAndRouteActionKindAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk HTTP Methods dan Route Action Kinds: (1) `HTTP_METHOD_REGISTRY` sebagai mapped type registry untuk seluruh 7 varian `HttpMethod` (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`) dengan penjaminan `actionKind`, `isMutating`, `isSafe`, `isIdempotent`, `hasBody`, `defaultCrudRole`, dan `description`, (2) `matchHttpMethod` catamorphism pattern matcher murni tanpa statement `if`/`switch` yang mendukung route descriptor maupun case-insensitive string, (3) `ROUTE_ACTION_KIND_REGISTRY` sebagai mapped type registry untuk seluruh 4 varian `RouteActionKind` (`create`, `update`, `read`, `delete`), (4) `matchRouteActionKind` catamorphism pattern matcher murni tanpa branching, (5) eliminasi total blok `switch (m)` di `mapMethodDetails` pada `StaticLaravelScanner.ts` menjadi O(1) registry specification lookup, dan (6) zero-if pipeline untuk penentuan hook mutation vs query.
- **`responseShapeAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Response Shapes: (1) `RESPONSE_SHAPE_REGISTRY` sebagai mapped type registry untuk seluruh 3 varian `ResponseShape` (`paginated`, `collection`, `single`) dengan penjaminan `isCollection`, `isPaginated`, `isSingle`, `defaultWrapperKey`, dan `description`, (2) `matchResponseShape` catamorphism pattern matcher murni tanpa statement `if`/`switch` yang mendukung direct shape maupun response descriptor objects, dan (3) zero-if pipeline pembentukan wrapper tipe response.
- **`modelKeyTypeAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Eloquent Model Key Types: (1) `MODEL_KEY_TYPE_REGISTRY` sebagai mapped type registry untuk seluruh 5 varian `ModelKeyType` (`int`, `bigint`, `string`, `uuid`, `ulid`) dengan penjaminan `tsType`, `isNumeric`, `isStringLike`, `primitiveKind`, `sampleValue`, dan `description`, (2) `matchModelKeyType` catamorphism pattern matcher murni tanpa statement `if`/`switch`, (3) `ModelKeyTypeMapper.normalize()` O(1) dictionary normalizer untuk eliminasi total percabangan ladder `if/else` pada normalisasi `keyType`, dan (4) zero-if pipeline untuk penentuan tipe primary key model.
- **`routeParameterTypeAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Route Parameter Data Types: (1) `ROUTE_PARAMETER_TYPE_REGISTRY` sebagai mapped type registry untuk seluruh 7 varian `RouteParameterType` (`number`, `string`, `boolean`, `uuid`, `ulid`, `date`, `slug`) dengan penjaminan `tsType`, `isNumeric`, `isStringLike`, `isIdentifier`, `pattern`, `zodValidator`, dan `description`, (2) `matchRouteParameterType` catamorphism pattern matcher murni tanpa statement `if`/`switch` yang mendukung penerimaan raw type string maupun instance `RouteParameter`, (3) eliminasi total percabangan ternary defensif di `ConstantsGenerator.ts` (`p.type === RouteParameterType.Number ? 'number' : 'string'`), dan (4) zero-if pipeline untuk formattings signature TypeScript parameter.
- **`validationRuleNodeAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Validation Rule Nodes: (1) 20 varian ADT terspesialisasi (`Required`, `Nullable`, `Optional`, `String`, `Number`, `Boolean`, `Array`, `Email`, `Url`, `Uuid`, `Date`, `Min`, `Max`, `Between`, `In`, `Exists`, `Unique`, `File`, `Image`, `Custom`) yang meng-extends `BaseValidationRuleNode`, (2) `VALIDATION_RULE_REGISTRY` sebagai mapped type registry untuk seluruh 20 varian `ValidationRuleKind` dengan penjaminan `category`, `isTypeAssertion`, `isConstraint`, `isModifier`, dan `description`, (3) `matchValidationRule` (aliased `matchRule`) catamorphism pattern matcher murni tanpa statement `if`/`switch`, (4) strongly-typed semantic factory constructors pada `ValidationRuleNodeFactory` (`.required()`, `.nullable()`, `.optional()`, `.string()`, `.number()`, `.boolean()`, `.array()`, `.email()`, `.url()`, `.uuid()`, `.date()`, `.min()`, `.max()`, `.between()`, `.in()`, `.exists()`, `.unique()`, `.file()`, `.image()`, `.custom()`), dan (5) pure functional zero-if validation rule inspection & summarization pipeline.
- **`resourceFieldExpressionAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Resource Field Expressions: (1) 14 varian ADT terspesialisasi (`Primitive`, `Model`, `Resource`, `Object`, `Array`, `PropertyAccess`, `NullsafePropertyAccess`, `Variable`, `TypeCast`, `BinaryExpression`, `MethodCall`, `StaticMethodCall`, `Literal`, `Unknown`) yang meng-extends `BaseResourceFieldExpression`, (2) `RESOURCE_EXPRESSION_REGISTRY` sebagai mapped type registry untuk seluruh 14 varian `ResourceExpressionKind` dengan penjaminan metadata `category`, `isTerminal`, `isResolvableToModel`, dan `description`, (3) `matchResourceFieldExpression` (aliased `matchResourceExpression`) catamorphism pattern matcher murni tanpa statement `if`/`switch`, (4) semantic factory constructors lengkap pada `ResourceFieldExpressionFactory` untuk seluruh 14 varian AST expression, dan (5) pure functional expression inspector pipeline.
- **`routeHookKindAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Route Hooks: (1) 3 varian ADT terspesialisasi (`QueryHookDescriptor`, `MutationHookDescriptor`, `InfiniteQueryHookDescriptor`) yang meng-extends `BaseRouteHookDescriptor`, (2) `HOOK_KIND_REGISTRY` sebagai mapped type registry untuk seluruh 3 varian `RouteHookKind` (`Query`, `Mutation`, `InfiniteQuery`) dengan penjaminan `tanstackHookName`, `isMutating`, `requiresQueryKey`, `supportsPagination`, dan `defaultOptionsTypeName`, (3) `matchRouteHookKind` (aliased `matchHookKind`) catamorphism pattern matcher murni tanpa statement `if`/`switch`, (4) semantic factory constructors pada `ScannedRouteHookDescriptor` (`.query()`, `.mutation()`, `.infiniteQuery()`, `.fromKind()`), dan (5) verifikasi integrasi dispatch exhaustiveness pada `ROUTE_DESCRIPTOR_REGISTRY` dan `StaticLaravelScanner`.
- **`polymorphicRelationAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Eloquent Polymorphic Relations: (1) 5 varian ADT terspesialisasi (`MorphToRelationDescriptor`, `MorphOneRelationDescriptor`, `MorphManyRelationDescriptor`, `MorphToManyRelationDescriptor`, `MorphedByManyRelationDescriptor`) yang meng-extends `BasePolymorphicRelationDescriptor`, (2) `POLYMORPHIC_RELATION_REGISTRY` sebagai mapped type registry untuk seluruh 5 varian `PolymorphicMorphType` dengan penjaminan `cardinality` (`one` vs `many`), `isCollection`, dan default columns/unions, (3) `matchPolymorphicRelation` (aliased `matchPolymorphicMorphType`) catamorphism pattern matcher murni tanpa statement `if`/`switch`, (4) semantic factory constructors pada `ScannedPolymorphicRelationDescriptor` (`.morphTo()`, `.morphOne()`, `.morphMany()`, `.morphToMany()`, `.morphedByMany()`, `.create()`), dan (5) preservasi kompatibilitas penuh dengan object literal konvensional.
- **`eloquentCastKindAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Eloquent Attribute Casts: (1) `ELOQUENT_CAST_REGISTRY` sebagai mapped type registry lengkap untuk seluruh 14 varian `EloquentCastKind` (`Integer`, `Float`, `Decimal`, `Boolean`, `String`, `DateTime`, `Date`, `Timestamp`, `Array`, `Json`, `Object`, `Collection`, `Encrypted`, `Custom`) dengan penjaminan `tsType`, `semanticType`, `isNumeric`, `isDateTime`, dan `isJsonOrCollection`, (2) `matchEloquentCastKind` catamorphism pattern matcher murni tanpa statement `if`/`switch`, (3) pemetaan O(1) kanonikal di `EloquentCastMapper.map` yang murni mengonsumsi registry specification, dan (4) pipeline fungsional murni konversi tipe cast ke representasi TypeScript tanpa percabangan manual.
- **`databaseColumnKindAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Database Column Kinds: (1) `DATABASE_COLUMN_KIND_REGISTRY` sebagai mapped type registry untuk seluruh 22 varian `DatabaseColumnKind` dengan penjaminan `tsType`, `semanticType`, `sqlFamily`, `isNumeric`, dan `isDateTime`, (2) `matchDatabaseColumnKind` catamorphism pattern matcher murni tanpa branching `if`/`switch`, (3) eliminasi total blok `switch` 30-cabang di `DatabaseColumnTypeMapper.toColumnKind` menjadi O(1) dictionary lookup, dan (4) eliminasi blok `switch` 20-cabang di `ModelGenerator.ts` (`mapColumnKindToTs`) menjadi O(1) registry specification.
- **`routeExecutionSignatureAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Route Execution Signatures: (1) 3 varian ADT terspesialisasi (`NoPayloadExecutionSignature`, `RequiredPayloadExecutionSignature`, `OptionalPayloadExecutionSignature`) yang meng-extends `RouteExecutionSignature`, (2) `ROUTE_PAYLOAD_MODE_REGISTRY` sebagai mapped type registry untuk `RoutePayloadMode` (`none`, `required`, `optional`) yang mengunci `hasPayload`, `isOptional`, `defaultCallArguments`, dan formatter fungsi deklarasi parameter, (3) `matchRouteExecutionSignature` (aliased `matchRoutePayloadMode`) catamorphism pattern matcher murni tanpa statement `if`/`switch`, dan (4) semantic factory constructors pada `ScannedRouteExecutionSignature` (`.noPayload()`, `.requiredPayload()`, `.optionalPayload()`, `.fromMode()`, `.create()`) dengan eliminasi total branching manual.
- **`paginatedEnvelopeAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Paginated Envelopes: (1) varian ADT `LengthAwarePaginatedEnvelopeDescriptor` dan `CursorPaginatedEnvelopeDescriptor` yang meng-extends `PaginatedEnvelopeDescriptor`, (2) `PAGINATION_KIND_REGISTRY` sebagai mapped type registry untuk `PaginationKind` (`length_aware` vs `cursor`), (3) `matchPaginatedEnvelope` (aliased `matchPaginationKind`) catamorphism pattern matcher murni tanpa statement `if`/`switch`, dan (4) eliminasi total percabangan ternary defensif di `ScannedPaginatedEnvelopeDescriptor.create` yang didelegasikan ke O(1) registry specification.
- **`requestContentTypeAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Request Content-Type: (1) 4 varian ADT terspesialisasi (`JsonRequestContentTypeDescriptor`, `MultipartRequestContentTypeDescriptor`, `UrlEncodedRequestContentTypeDescriptor`, `NoneRequestContentTypeDescriptor`), (2) `REQUEST_CONTENT_TYPE_REGISTRY` sebagai mapped type registry untuk `RequestContentType` yang mengunci `mimeType`, `isBinary`, `hasPayload`, dan `headerExpression`, (3) `matchRequestContentType` catamorphism pattern matcher murni tanpa branching `if`/`switch` yang mendukung penerimaan instance descriptor maupun raw kind string, dan (4) semantic factory constructors pada `ScannedRequestContentTypeDescriptor` (`.json()`, `.multipart()`, `.urlEncoded()`, `.none()`, `.fromKind()`).
- **`sdkResponseResolutionAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk SDK Response Resolutions: (1) 5 varian ADT terspesialisasi (`VoidSdkResponseResolution`, `RawSdkResponseResolution`, `ValidatedSdkResponseResolution`, `MappedSdkResponseResolution`, `ValidatedAndMappedSdkResponseResolution`) yang meng-extends `SdkResponseResolution`, (2) `SDK_RESPONSE_KIND_REGISTRY` sebagai mapped type registry untuk `SdkResponseKind` dengan penjaminan `hasSchema`, `hasMapper`, dan `isTransformed`, (3) `matchSdkResponseResolution` (aliased `matchSdkResponse`) catamorphism pattern matcher murni tanpa branching `if`/`switch`, dan (4) semantic factory constructors pada `ScannedSdkResponseResolution` (`.voidResponse()`, `.raw()`, `.validated()`, `.mapped()`, `.validatedAndMapped()`).
- **`eloquentRelationAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Eloquent Relationships: (1) `SingleRelationDescriptor` (`cardinality: 'one'`, `isCollection: false`) dan `CollectionRelationDescriptor` (`cardinality: 'many'`, `isCollection: true`) sebagai varian ADT terspesialisasi yang meng-extends `ParsedRelation`, (2) `ELOQUENT_RELATION_REGISTRY` sebagai mapped type registry lengkap untuk 11 varian relasi Eloquent (`hasOne`, `hasMany`, `belongsTo`, `belongsToMany`, dll.) dengan flag `isPolymorphic`, (3) `matchRelationCardinality` (aliased `matchRelation`) dan `matchRelationType` catamorphism pattern matcher murni tanpa statement `if`/`switch`, (4) semantic factory constructors (`.single()`, `.collection()`), dan (5) migrasi `ModelGenerator.ts` mengonsumsi `matchRelation` dengan 0 branching ternary.
- **`routeParameterAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Route Parameters: (1) `PathParameterDescriptor`, `QueryParameterDescriptor`, dan `HeaderParameterDescriptor` sebagai varian ADT terspesialisasi, (2) `PARAMETER_LOCATION_REGISTRY` sebagai mapped type registry untuk `RouteParameterLocation` (`path`, `query`, `header`), (3) `matchRouteParameter` catamorphism pattern matcher murni tanpa branching `if`/`switch`, dan (4) semantic factory constructors (`.path()`, `.query()`, `.header()`, `.fromPathSegment()`).
- **`invalidationTargetAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk React Query Cache Invalidation Targets: (1) `SelfListInvalidationTarget`, `ParentListInvalidationTarget`, `ParentDetailInvalidationTarget`, dan `AuthResourceInvalidationTarget` sebagai varian ADT terspesialisasi, (2) `INVALIDATION_TARGET_REGISTRY` sebagai mapped type registry untuk `InvalidationTargetKind`, (3) `matchInvalidationTarget` catamorphism pattern matcher murni tanpa `if`/`switch`, (4) eliminasi total `switch (kind)` di `ScannedInvalidationTarget.computeQueryKey()` yang didelegasikan ke O(1) registry specification, dan (5) semantic factory constructors (`.selfList()`, `.parentList()`, `.parentDetail()`, `.authResource()`, `.resourceList()`, `.resourceItem()`).
- **`broadcastChannelAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk Laravel Broadcast Channels (`routes/channels.php`): (1) `PublicBroadcastChannelDescriptor`, `PrivateBroadcastChannelDescriptor`, dan `PresenceBroadcastChannelDescriptor` sebagai varian ADT terspesialisasi, (2) `BROADCAST_CHANNEL_REGISTRY` sebagai mapped type registry untuk `BroadcastChannelKind`, (3) `matchBroadcastChannel` catamorphism pattern matcher murni tanpa `if`/`switch`, (4) semantic factory constructors (`.public()`, `.private()`, `.presence()`), dan (5) `EchoGenerator` yang murni mendispatch method echo (`channel`, `private`, `join`) via O(1) table lookup `BROADCAST_CHANNEL_REGISTRY` tanpa branching `switch`/`if`.
- **`routeSecurityAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk skema otentikasi dan keamanan Laravel: (1) `SECURITY_SCHEME_REGISTRY` sebagai mapped type registry untuk `SecuritySchemeKind` (`sanctum`, `bearer`, `cookie`, `public`), (2) `matchRouteSecurity` catamorphism pattern matcher murni tanpa branching `if`/`switch`, dan (3) penjaminan metadata header otorisasi terstruktur di seluruh skema.
- **`validationFieldNodeAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Tree Catamorphism untuk pohon validasi Laravel: (1) `ScalarValidationFieldNode`, `ArrayValidationFieldNode`, dan `ObjectValidationFieldNode` sebagai varian ADT eksplisit, (2) `VALIDATION_FIELD_REGISTRY` sebagai mapped type registry untuk `ValidationFieldKind`, (3) `matchValidationField` untuk single-level catamorphism tanpa `if`, dan (4) `foldValidationField` untuk recursive bottom-up tree fold yang mentransformasikan struktur bersarang (`items.*.qty`) ke Zod schema / TypeScript types secara fungsional murni tanpa `if`/`switch`.
- **`responseDescriptorAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk respons Laravel: (1) `RESPONSE_DESCRIPTOR_REGISTRY` sebagai mapped type registry untuk 4 varian respons (`resource`, `model`, `inline`, `void`), (2) `matchResponse` catamorphism pattern matcher murni tanpa statement `if`/`switch`, dan (3) komposisi pipeline fungsional penuh antara `matchRoute` dan `matchResponse`.
- **`routeDescriptorAdtFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi arsitektur ADT Flow Data untuk rute Laravel: (1) `RouteDescriptor` sebagai discriminated union (`GetCollectionRouteDescriptor`, `GetItemRouteDescriptor`, `MutationRouteDescriptor`, `DeletionRouteDescriptor`) yang meng-extends `ParsedRoute` secara langsung dengan 100% data tersambung, (2) `CRUD_DISPATCH_REGISTRY` dan `classifyRoute` yang mengklasifikasikan rute secara O(1) tanpa statement `if`, dan (3) `matchRoute` (catamorphism pattern matcher) untuk konsumsi fungsional murni tanpa `if`/`switch`.
- **`channelTypeUnificationSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi unifikasi tipe broadcast channel: (1) eliminasi total intersection type `& ParsedChannel` pada `RouteManifest.channels` dan constructor, (2) `BroadcastChannelDescriptor` sebagai satu-satunya SSOT kanonikal, (3) `ParsedChannel` sebagai direct compatible alias, dan (4) `EchoGenerator` yang murni mengonsumsi `readonly BroadcastChannelDescriptor[]`.
- **`guaranteedVocabularyAndZeroTernarySSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi penjaminan kontrak vocabulary tanpa tanda tanya (`?`) pada koleksi array: (1) `RouteSchemaPayload` (`rules`, `messages`, `attributes`), (2) `ParsedModel` (`fillable`, `guarded`, `hidden`, `appends`, `casts`, `accessors`, `relations`), (3) `ControllerActionInfo.schemaRules`, dan (4) `RouteManifest.channels`. Seluruh constructor menggunakan default parameter `= []` dan mengeliminasi puluhan ternary defensif `prop ? Object.freeze(...) : undefined`.
- **`ternaryCleanlinessAndExpressionFactorySSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi: (1) implementasi `ResourceFieldExpressionFactory` untuk pembuatan AST node ekspresi field terstruktur dan beku, (2) eliminasi total sisa nested ternaries di `StaticLaravelScanner` (resolusi `semanticType`, `colType`, `rawDomain`, `actionKind`, `primKind`), (3) eliminasi nested ternaries pada `OpenApiParser`, `PHPRouteParser`, `response-analysis-helper`, `route-classifier`, dan `ExpressionResolver`.
- **`manifestScannerChannelsAndGroupsSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi: (1) `StaticLaravelScanner.scanChannels()` memindai `routes/channels.php` via token AST dan membentuk `runtimePattern` terstruktur sejak Origin Boundary, (2) `ScannedRouteManifestDescriptor` membekukan `channels` dan `routeGroups` sebagai properti kelas satu, (3) `ScannedResourceRouteGroupDescriptor` mengelompokkan rute berdasarkan `resourceName` secara otomatis pada `execute()`, dan (4) sinkronisasi `channels` pada perintah CLI `sync.ts`.
- **`explicitModelsAndPureGeneratorsSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi standarisasi explicit model pada pembentukan manifes dan generator hilir: (1) `BroadcastChannelDescriptor.runtimePattern` dihitung di Origin Boundary sehingga `EchoGenerator` tidak memerlukan regex substitusi string runtime, (2) `ParsedColumn.columnKind` dijamin 100% pada pembentukan manifes sehingga `ModelGenerator` murni mengonsumsi enum `DatabaseColumnKind` tanpa heuristik string `.includes()`, (3) `ResponseAnalysisHelper` murni mengonsumsi explicit value object `route.response.shape`, dan (4) penghapusan 30 baris fungsi mati rekursif `resolveBaseResponseName` pada `HookGenerator`.
- **`routeClassifierAndPageSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi: (1) implementasi Reusable Structured Constructor `ScannedClassifiedRouteDescriptor`, (2) eliminasi total defensive fallbacks (`deriveGroupName`, `classifyCrudRole`, `toRuntimePath`) pada `classifyRoutes` dan `SDKGenerator`, murni mengonsumsi SSOT `route.groupName`, `route.crudRole`, dan `route.runtimePath` yang dijamin di Origin Boundary, dan (3) implementasi `ScannedPageEndpointDescriptor` di `RoutesGenerator.ts` untuk mengeliminasi raw literals pada leaf page endpoints.
- **`downstreamPureFlowSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi penyambungan alur downstream murni: (1) `ConstantsGenerator` mengonsumsi `route.pathParameters` (dengan tipe terketik `number` vs `string`), `route.runtimePath`, dan AST `ValidationRuleKind.In` serta `route.groupName` tanpa ad-hoc string regex, (2) eliminasi dead regex loop pada `SDKGenerator`, dan (3) eliminasi defensive fallback regex pada `MswGenerator` dan `NextActionGenerator`.
- **`completeStructuredConstructorsSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi eliminasi 100% raw object literal dan ternaries pada: (1) `LaravelChannelParser` yang murni mengonsumsi `ScannedRouteParameterDescriptor` dan `ScannedBroadcastChannelDescriptor`, (2) `PHPRouteParser` dan `OpenApiParser` yang menghasilkan instance kanonikal `ScannedRouteDescriptor`, dan (3) `ContractGraph` yang menggunakan konstruktor terstruktur `ScannedControllerNode` dan `ScannedServiceDependency`.
- **`ternaryEliminationAndControllerActionSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi: (1) penghapusan rantai ternary 4-tingkat di `deriveRequestTypes` dan konsumsi langsung route SSOT, (2) penghapusan duplikasi ternary `isNumeric` di `extractPathParams` yang didelegasikan ke `ScannedRouteParameterDescriptor`, (3) refactoring resolusi channel kind di `ScannedBroadcastChannelDescriptor` menjadi structured branching tanpa nested ternaries, dan (4) implementasi class `ScannedControllerActionDescriptor` (`implements ControllerActionInfo`) yang mengeliminasi raw object literal pada `actionMap.set()`.
- **`conciseStructuredConstructorsSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi peringkasan kode dan standarisasi 6 Reusable Structured Constructors: (1) `ValidationRuleNodeFactory` factory methods untuk pembuatan AST rule terstruktur, (2) `ScannedRouteSecurityDescriptor` dengan default fallback public, (3) `ScannedPaginatedEnvelopeDescriptor` (`.lengthAware()`, `.cursor()`), (4) `ScannedPolymorphicRelationDescriptor`, (5) `ScannedRouteValidationRuleEntry` dengan auto-casing dan auto-parsing AST rules, (6) `ScannedRouteSchemaPayload`, dan (7) `ScannedObjectProperty` dengan default `required = !nullable`.
- **`structuredConstructorsSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi standarisasi 8 Reusable Structured Constructors di `@routesync/core` dan `@routesync/cli`: (1) `ScannedModelCastDescriptor`, (2) `ScannedModelRelationDescriptor`, (3) `ScannedHttpErrorResponseDescriptor`, (4) `ScannedRouteQueryParameterDescriptor`, (5) `ScannedRoutePolicyDescriptor`, (6) `ScannedRateLimitDescriptor`, (7) `ScannedBroadcastChannelDescriptor`, dan (8) node konstruktor pohon validasi (`ScannedScalarFieldNode`, `ScannedArrayFieldNode`, `ScannedObjectFieldNode`). Seluruh perakitan raw object literal (`{ ... }`) telah dieliminasi menjadi AST konstruktor terstruktur.
- **`vocabularyAndContractExplicitSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi: (1) vocabulary enum `DatabaseColumnKind` dan `DatabaseColumnTypeMapper.toColumnKind()` untuk klasifikasi tipe kolom database tanpa loose string, (2) enum kanonikal `HttpStatusCode` untuk status response HTTP, (3) model eksplisit `RateLimitDescriptor` dari middleware `throttle:max,decay`, (4) ekstraksi kemampuan `abilities` pada `RouteSecurityDescriptor` (Sanctum/Passport), dan (5) perluasan `RouteParameterType` (`ulid`, `date`, `slug`).
- **`eloquentAndGeneratorExplicitSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi: (1) parsing custom Laravel route model binding (`{post:slug}`) menjadi `bindingField: 'slug'` dan `type: string`, (2) metadata lifecycle Eloquent (`softDeletes` dan `timestamps`) pada `ParsedModel`, (3) `ModelGenerator` menghasilkan `model.shortName`, kolom terketik (`enumValues`, `semanticType`), accessor terketik, dan relasi terketik (`items?: OrderItem[]`), (4) `EchoGenerator` mengonsumsi `channel.parameters` dan mendukung presence channel (`echo.join`), dan (5) `MswGenerator` mengonsumsi `route.runtimePath` tanpa regex.
- **`explicitModelDataFlowAudited.spec.ts`** — Suite unit & contract test baru yang memverifikasi 5 model eksplisit hasil audit pipeline: (1) `groupName`, `crudRole`, dan `runtimePath` dihitung di Origin Boundary (`ScannedRouteDescriptor`), (2) `RoutePolicyDescriptor` untuk otorisasi middleware Laravel (`can:update,order`), (3) `BroadcastChannelDescriptor` (`BroadcastChannelKind`, pola pattern, dan parameter terketik), (4) `QueryKeyGenerator` menghasilkan primary key terketik (`number` vs `string`) via `model.keySemanticType`, dan (5) `NextActionGenerator` murni mengonsumsi `route.pathParameters` dan `route.requestContentType` tanpa regex.
- **`downstreamPureConsumerSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi: (1) `PaginationKind` & `PaginatedEnvelopeDescriptor` (envelope pagination `length_aware` vs `cursor`), (2) `PolymorphicRelationDescriptor` (`morphTo` & `morphMany` sebagai discriminated union), dan (3) Hilir (`HookGenerator` & `SDKGenerator`) sebagai pure consumers yang langsung mengonsumsi `route.response.readTypeName` dan `route.response.mapperName` dari manifest SSOT tanpa perakitan string dan heuristik.
- **`manifestExplicitPipelineSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi 5 pilar arsitektur Core IR & Manifest: (1) `requestContentType` SSOT (none vs multipart vs json), (2) pemisahan eksplisit `pathParameters` vs `queryParameters`, (3) guaranteed model identity (`primaryKey`, `keyType: ModelKeyType`, `keySemanticType`, `incrementing`), (4) first-class `HttpErrorResponseDescriptor` (422 validation & 401 unauthorized), dan (5) `ValidationTreeBuilder` untuk parsing hirarkis nested array rules (`items.*.field`).
- **`domainModelManifestSSOT.spec.ts`** — Suite unit & contract test baru yang memverifikasi `ScannedModelColumnDescriptor` (preservasi `enumValues: readonly string[]` untuk database enum & guaranteed `propertyName`/`semanticType`), `ScannedRouteParameterDescriptor` (`propertyName` TS identifier), `ScannedModelAccessorDescriptor`, `ScannedResourceFieldDescriptor`, dan `ResponseDescriptor` (`readTypeName` & `mapperName` SSOT) di Origin Boundary sehingga downstream generator murni sebagai pemakai tanpa lowering dan string synthesis.
- **`routeSecurityModel.spec.ts`** — Suite unit & contract test baru yang memverifikasi `RouteSecurityClassifier` dan `RouteSecurityDescriptor` (Sanctum, Bearer, Cookie, Public) sebagai SSOT keamanan route di manifest tanpa string matching di hilir.
- **`eloquentRelationModel.spec.ts`** — Suite unit & contract test baru yang memverifikasi `EloquentRelationClassifier` O(1) classification untuk single dan collection Eloquent relations, serta mengunci contract `ParsedRelation` dengan `type: EloquentRelationType` (tanpa loose string) dan guaranteed `modelName`.
- **`inlineModelCollectionCamelCase.spec.ts`** — Suite regresi baru yang memverifikasi preservasi struktur (tanpa structural flattening seperti `summaryAvgRating` atau `reviewsData`), ekspansi kolom model `ProductReview`, dan transformasi field `snake_case` $\rightarrow$ `camelCase` pada `api-read.ts` dan `api-mapper.ts` secara 100% type-safe tanpa `any` (Issue #22).
- **`inlineResponseCamelCaseTransformation.spec.ts`** — Suite regresi baru yang memverifikasi ekstraksi inline controller response (`Profile`, `Login`, `ProdukReviews`, dll.) ke dalam interface `*Transformed` di `api-read.ts` dan transformasi mapper `to*Read` dari `snake_case` API response ke `camelCase` domain objects (Issue #21).
- **`eloquentOnlyReadMappers.spec.ts`** — Suite regresi baru yang memverifikasi bahwa `MapperGeneratorPass` hanya menghasilkan read mapper untuk Eloquent JsonResources (Kategori A) dan mengabaikan identity mapper untuk respons non-resource (Kategori B seperti `Profile`, `PaymentWebhook`, `Login`).
- **`strictChildResourceMapperTyping.spec.ts`** — Suite regresi baru untuk menguji ekstraksi child resource yang *reachable* tanpa route top-level (`OrderDetailResource`) dan pengetikan strict `OrderDetailResourceApiResponse`.
- **`existingContractMapperTyping.spec.ts`** — Suite regresi baru yang menguji resolusi dinamis tipe contract `*ApiResponse` dari `availableContractTypes` pada `MapperGeneratorPass` tanpa bergantung pada flag `isTopLevel`.
- **`e2eMapperGeneration.spec.ts`** — Suite regresi End-to-End baru yang memverifikasi alur penuh dari `RouteManifest` (`OrderDetailResource::collection`) $\rightarrow$ `manifestToContractInput` $\rightarrow$ `MapperGeneratorPass` untuk menghasilkan mapper `items: api.items?.map(toOrderDetailResourceRead)` yang valid tanpa terdegradasi.
- **`itemsCollectionMapperTypeResolution.spec.ts`** — Suite regresi baru yang menguji resolusi pengetikan koleksi child resource `items: OrderDetailResourceTransformed[]` dan pemetaan `items: api.items ? api.items.map(toOrderDetailResourceRead) : []` pada `api-read.ts` dan `api-mapper.ts`.
- **`resourceFieldStructureResolution.spec.ts`** — Suite regresi baru yang menguji resolusi field objek & koleksi (`items: object[]` / `OrderDetailResourceTransformed[]`, `promotion: object` (`{ code, discountMinor }`), `gateway: object` (`{ name, orderId, token, redirectUrl }`)) pada artefak `api-read.ts` dan `api-mapper.ts`.
- **`apiReadArtifactGeneration.spec.ts` & `childResourceArrayMapper.spec.ts`** — Suite regresi baru yang menguji secara independen (1) pembentukan artefak interface `types/api-read.ts` (`OrderResourceTransformed`) melalui `TypeScriptGeneratorPass`, serta (2) pemetaan koleksi child resource (`items: api.items ? api.items.map(toOrderDetailResourceRead) : []`) pada `MapperGeneratorPass`.
- **`generatorTypeSafety.spec.ts`** — Regression suite (6 test) yang mengunci behavior runtime di balik fix type-safety `ZodTierGenerator.ts`/`normalizer.ts`: `wrapped:true` detection (lewat `.resolved` dan langsung di `route.response`), nested `kind:'object'` field recursion, parsing raw literal AST node (`{"kind":"literal","code":"..."}`), dan legacy route shape (`uri`/`actionName`/`controllerName`). Mencegah fix compile error di masa depan dikerjakan dengan cara menghapus kode pembaca field, bukan membenarkan type-nya.
- **`resourceAliasDedup.spec.ts` reframing** — `describe` block di-rename dari framing "route" ke "api-contract.ts = registry kontrak backend". Bug A (per-route duplication) digeneralisasi jadi regex per-suffix CRUD (`\w*IndexResponseSchema` dst) alih-alih hardcode nama resource; Bug B (`OrderResponseSchema`, naming branch `count === 1`) dipertahankan sebagai test terpisah karena beda root cause.

### Changed
- **Migrasi CLI ke `StaticLaravelScanner` SSOT** — Perintah `scan`, `sync`, dan `audit` pada CLI `@routesync/cli` kini 100% menggunakan `StaticLaravelScanner` (TypeScript static analysis) sebagai scanner default dan tunggal, secara resmi memensiunkan `LaravelRouteParser` (PHP subprocess) dan mengeliminasi ketergantungan pada runtime PHP saat pemindaian rute dan skema.

### Removed
- **`SchemaGenerator.ts` & `schemas.ts` (Legacy Generator)** — Menghapus generator legacy `SchemaGenerator.ts` dan output duplikat `schemas.ts` sepenuhnya dari CLI (`generate.ts` dan `sync.ts`). Seluruh pembuatan Zod schema telah diambil alih secara penuh oleh `ZodTierGenerator` / `ContractGeneratorPass` yang menghasilkan `contract/api-schema.ts` dan `contract/api-contract.ts` via pure Explicit Model Data Flow.

### Refactored
- **Eliminasi Category B (Domain Leak Ternary) Menuju 100% Pure ADT Catamorphism & Non-Nullable Complete Contract**:
  - `MswGenerator.ts`: Mengeliminasi defensive ternary `route.response ? matchResponseShape(...) : ...` dengan murni mengonsumsi guaranteed non-nullable contract `contract.response.success.shape` via `matchResponseShape`.
  - `EchoGenerator.ts`: Mengeliminasi defensive fallback type checking `(p.type === 'number' ? 'number' : 'string')` dengan murni memetakan parameter type melalui `ROUTE_PARAMETER_TYPE_REGISTRY` dan `RouteParameterType.String`.
  - `ModelGenerator.ts`: Mengeliminasi chained ternaries `col.semanticType === PrimitiveKind.NUMBER ? ...` dan menggantinya dengan O(1) lookup dictionary `PRIMITIVE_KIND_MAP` terstruktur.
  - `packages/core/src/types/route.ts` (`ScannedEndpointContract.fromRoute`): Mengeliminasi percabangan nested ternary `route.method.toUpperCase() === 'POST' ? ... : ...` dan menggantinya secara exhaustively-typed dengan pure catamorphism `matchHttpMethod`.
- **Flow-Based Type Design & Pure Operations pada `ContractGeneratorPass`** — Memindahkan resolusi dependensi dan fallback ke `createContractGeneratorDependencies` di *Origin Boundary* (`ObjectType.annotations` default `=` tanpa `??` / `||`), mengekstrak `.kind` di Origin Boundary (0% `as` type assertion), mengalokasikan frozen singletons `EMPTY_FIELDS` dan `EMPTY_WARNINGS` (0% alokasi array kosong `[]` redundan), menghapus helper perantara (`extractItemType` & `extractFirstItem`) dan menggantinya dengan pengindeksan array alami `innerResult.fields[0]`, mendefinisikan *Discriminated Union Results* (`SingleResponseFieldResult`, `NullableWrapperResult`, `RequestTypeResponseSchemasResult`), mengekstrak `ResponseData` sebagai antarmuka artefak bernama lintasan domain (`RequestTypesArtifact.ts`), serta mendekomposisi konversi field dan Stage 2 `extractResponseSchemas` ke pure pipeline (`resolveNullableWrapper`, `partitionResults`, `extractRequestTypeResponseSchemas`) tanpa `if`, tanpa `for` loop, tanpa ternary `? :`, tanpa optional chaining `?.`, tanpa `as` type casting, dan tanpa helper indirection. Dikawal oleh 5-layer TDD test suite (54 unit/type tests, 100% GREEN).

### Fixed
- **Upstream StaticLaravelScanner Enhancements: Laravel 11 Casts, Deep Nested Route Groups, Invokable Controllers, Fluent Validation Rules, & Model Returns (Issue #34)** — Memperbarui scanner upstream `StaticLaravelScanner.ts` dan parser AST: (1) mendeteksi method modern Laravel 11 `protected function casts(): array` dan memperkaya `EloquentCastMapper` dengan modern cast kinds (`hashed`, `asarrayobject`, `ascollection`, `asenumcollection`, `immutable_date`, `immutable_datetime`), (2) mengganti scalar prefix dengan `prefixStack: string[]` untuk mendukung arbitrary nested route groups serta mengenali single-action invokable controllers (`ShowProfileController::class` $\to$ `__invoke`), (3) memperluas `ValidationRuleParser.parse` untuk mengekstrak fluent validation rules (`Rule::in`, `Rule::unique`, `Rule::exists`) langsung ke structured AST node, dan (4) memperluas `scanControllers` untuk mendeteksi query builder returns (`Model::all()`, `Model::paginate()`, `Model::find()`) dan resource collections.
- **Sound Discriminated Union ADT untuk Resource Groups & Eliminasi Defensive Fallbacks pada Pipeline Generator (Issue #33)** — Merefaktor `CrudResourceGroupDescriptor` menjadi Discriminated Union murni (`FullCrudResourceGroupDescriptor | ReadOnlyCrudResourceGroupDescriptor | FlexibleCrudResourceGroupDescriptor`) tanpa field mutasi opsional `?`, menghapus handler `crud?:` pada `ExhaustiveFineGrainedResourceGroupVisitor` sehingga seluruh 5 varian fine-grained dan 3 varian unified CRUD 100% lengkap dan sound tanpa tanda tanya `?`, menjamin non-null `invalidation` pada `ScannedEndpointContract` sejak Origin Boundary, serta merefaktor `HookGenerator` dan `QueryKeyGenerator` agar mengonsumsi `graph.resourceGroups` secara langsung tanpa perantara `buildResourceMap`, tanpa fallback `if (groupDesc)`, tanpa akses dinamis `(resource as any)[name]`, dan dipandu murni oleh catamorphism pattern matchers.
- **Transformasi Item Array of Objects pada Form Mapper & Ekstraksi Konstanta `ApiApiField` (Issue #32)** — Memperbaiki `MapperGeneratorPass.ts` agar memetakan elemen array di dalam field array-of-objects (`form.items?.map(item => ({ [ApiApiField.PRODUKITEMID]: item.produkItemId, [ApiApiField.QTY]: item.qty }))`) pada `toApiOrderCreate` baik untuk runtime `ReadonlyCollectionType` maupun plain JSON manifest AST, serta memperbarui `api-field-domain.ts` untuk mengekstrak seluruh nama field anak secara rekursif ke dalam konstanta `ApiApiField`.
- **Perakitan Hirarkis Rules Array of Objects & Penurunan `ObjectType` (`items.*.prop`) (Issue #31)** — Memperbaiki penanganan rules FormRequest Laravel yang memiliki wildcard array (`items`, `items.*.produk_item_id`, `items.*.qty`) agar dirakit secara hirarkis ke dalam `ReadonlyCollectionType(ARRAY, ObjectType)` alih-alih skalar flat `z.string()`. Memperbaiki `LaravelSourceLexer.parseArray` agar kata kunci `return` tidak disalahartikan sebagai subscript accessor array PHP, serta memperbarui `DefaultObjectHandler`, `NullableWrapperHandler`, dan `ResolvedObjectType.ts` agar mendukung properti `ObjectType` berbasis array tanpa melempar `TypeError: key.startsWith is not a function`.
- **Property Deduplication, Safe Identifier Quoting, and Non-Alphanumeric Key Alignment (Issue #30)** — Memperbaiki generator Zod (`ZodSchemaLowerer.ts`) agar otomatis memberi tanda petik (`JSON.stringify(name)`) pada key non-identifier (seperti wildcard `'items.*.qty'`), mendeduplikasi nama properti dan alias top-level pada `TypeScriptCodeBuilder` (`TypeScriptTypeLowerer.ts`), memproteksi `ModelGenerator.ts` terhadap accessor tanpa nama, serta menyelaraskan penamaan key non-alphanumeric `ApiApiField` pada `api-field-domain.ts` dan `MapperGeneratorPass.ts`.
- **Unifikasi Domain Keying & Resolusi Resource pada `ContractInputPipeline` (Issue #29)** — Memperbaiki fragmentasi entri dan resolusi `responseData.fields` saat menurunkan manifest ke `RequestTypesArtifact`. Seluruh route dan resource kini diindeks dengan key kanonikal bare domain (`order`), me-resolve referensi `route.response.resource` ke `manifest.resources` secara O(1), dan mengeliminasi pembuatan aksi dummy `Show` untuk standalone resource.
- **Eliminasi Objek Kosong `export const *ContractSchema = {};` untuk Resource GET-Only (Issue #28)** — Memperbarui `ContractCodeBuilder.ts` agar menyaring resource yang tidak memiliki request action (`actions.length === 0`), mencegah terbentuknya ekspor objek kosong `{}` pada `api-contract.ts`.
- **Dukungan Tipe Elemen `ObjectType` pada `FormActionGenerator` (Issue #27)** — Memperbarui `FormActionGenerator.ts` agar meng-generate objek array ber-shape inline `{ produkItemId: string; qty: number }` secara rekursif alih-alih tipe generik `object` (`Array<object>`), sehingga tidak ada lagi error TS2339 (`Property 'produkItemId' does not exist on type 'object'`) saat memetakan array items pada `api-mapper.ts`.
- **Koreksi Jalur Import Tipe Form di `MapperGeneratorPass` & `MapperEmitter` (Issue #26)** — Memperbarui `MapperGeneratorPass.ts` dan `MapperEmitter.ts` agar selalu mengimpor tipe form dari `../forms/api-form` (SSOT hasil `FormGeneratorPass`) alih-alih `../types/api-form` (direktori lama yang obsolete), mencegah ketidakcocokan tipe antara `api-mapper.ts` dan `api-form.ts`.
- **Eksklusivitas Mapper Khusus Eloquent JsonResources (Kategori A) & Eliminasi Identity Mapper (Issue #20)** — Memperbarui `MapperGeneratorPass.ts` agar hanya memproses dan menghasilkan read mapper untuk Eloquent JsonResources (`*Resource`), sehingga respons biasa / inline (Kategori B seperti `Profile`, `PaymentWebhook`, `Login`, `Cart`, `Logout`) yang tidak memiliki tipe `*Transformed` tidak lagi menghasilkan identity mapper duplikat (`api-contract` $\rightarrow$ `api-contract`).
- **Pengetikan Strict Parameter Mapper tanpa `any` (Issue #20)** — Menghapus fallback `(api: any)` pada `MapperGeneratorPass.ts` dan menggantinya dengan evaluasi ketat dari `availableContractTypes`. Jika tipe contract belum tersedia, compiler melemparkan error diagnostik ketat alih-alih menyembunyikan masalah dengan `any`.
- **Ekstraksi Resource Reachable Tanpa Endpoint Route (Issue #20)** — Memperbarui `manifestToContractInput` (`manifest-to-types.ts`) agar secara rekursif meng-extract seluruh child resource yang reachable dari graph response (seperti `OrderDetailResource`) meskipun tidak memiliki route top-level tersendiri, sehingga tipe `*ApiResponse` (seperti `OrderDetailResourceApiResponse`) selalu dihasilkan di `api-contract.ts`.
- **Strongly Typed Resource Collection Fields (`items: OrderDetailResourceTransformed[]`) tanpa Fallback ke `unknown` / `object[]`** — Memperbaiki penanganan `resource-flattening.ts` untuk ekspresi `static_method_call` (seperti `OrderDetailResource::collection()`) agar membaca metadata `resolved.resource` & `resolved.collection`. `OrderResourceTransformed` di `api-read.ts` kini bertipe tepat `items: OrderDetailResourceTransformed[]` (bukan fallback ke `unknown` / `object[]`), dan `MapperGeneratorPass.ts` menghasilkan `items: api.items ? api.items.map(toOrderDetailResourceRead) : []` (Issue #19).
- **Preservasi Field Nested Eloquent Resource pada `api-read.ts` & Pencegahan Overwrite Legacy Generator** — `processResources` pada `manifest-to-types.ts` kini mempreservasi struktur nested object pada Eloquent JsonResource (`promotion: object; shipping: object;`) alih-alih me-flatten secara paksa (`promotionCode`, `promotionDiscountMinor`), sehingga tipe `*Transformed` di `api-read.ts` selaras 100% dengan mapping di `api-mapper.ts`. Selain itu, `generate.ts` kini melewati eksekusi legacy `ZodTierGenerator` ketika `CompilerBridge` berhasil dieksekusi agar artefak compiler tidak ter-overwrite (Issue #18).
- **`MapperGeneratorPass` & `api-mapper.ts` Type Import Alignment** — `MapperGeneratorPass` mengimpor `*Form` types (seperti `RegisterForm`, `LoginForm`) dari `'../types/api-form'`, `*ApiResponse` dari `'../contracts/api-contract'`, serta `*Transformed` dari `'../types/api-read'` khusus untuk Eloquent JsonResources. Properti pada mapper inline response dipertahankan sebagai snake_case agar cocok dengan type `*ApiResponse` dari `api-contract.ts`.
- **`LaravelRouteParser` `mergeAssignmentShape` Trailing Comma Clean** — Membersihkan trailing comma pada penulisan array PHP saat menggabungkan `$base` dan `$incrementalAssignments`. Mencegah pembentukan koma ganda (`,,`) pada array literal PHP yang sebelumnya menyebabkan parser memasukkan field numerik palsu `"0": z.unknown()` pada response schema.
- **Model Column Resolution pada `manifest-to-types.ts`** — Mendukung inferensi tipe kolom database model saat `field.kind === 'model'` (misalnya `$categories = Category::get()`), menyelesaikan tipe `id: number`, `nama: string` dari `manifest.models` daripada terdegradasi menjadi `z.unknown()`.
- **`emitters.integration.test.ts` — fix test setup manifest path resolution**: Menggunakan test fixture `createMockManifest()` secara konsisten agar tidak ter-override oleh file `routesync.manifest.json` di root repo yang memiliki struktur rute dan model berbeda.
- **`ZodTierGenerator.ts` — 17 TS compile error** (semua gap deklarasi type untuk field runtime yang sudah lama dipakai, bukan bug logic):
  - `private static graph!: ContractGraph` — TS melarang definite-assignment assertion (`!`) di static class property; diganti `ContractGraph | undefined` (field ternyata write-only).
  - `wrapped?: boolean` ditambahkan ke `ResponseMetadata` (`packages/core/src/types/route.ts`) — field sudah lama di-set `LaravelRouteParser.ts` dan dites di `jsonResourceWrap.spec.ts`, tapi belum pernah dideklarasikan.
  - `code?: string` dan `fields?: Record<string, unknown>` ditambahkan ke `RuntimeAugmented` (`normalizer.ts`) — field raw AST literal node dari PHP extractor.
  - `baseMeta || {}` fallback dihapus (bikin TS infer union yang menyertakan `{}` tanpa properti apa pun).
  - Spread object `respMeta`/`meta` yang menggabungkan field lintas-varian discriminated union `ResponseMetadata` di-type longgar (`Record<string, any>`) karena memang sengaja baca cross-variant.
- **`normalizer.ts` — 11 TS compile error**:
  - 2x `kernel.resolve(ast, context)` di-cast `ast as any` (mengikuti pola "safe boundary cast" yang sudah ada di file yang sama).
  - `Object.values(field.fields).forEach(f => patchField(f as RuntimeAugmented))`.
  - `uri?`, `actionName?`, `controllerName?` ditambahkan sebagai field legacy opsional di `ParsedRoute` — coexist dengan `path`/`action` yang lebih baru (dibuktikan dipakai di fixture `normalizer.spec.ts`, bukan dihapus/diganti seperti percobaan pertama yang sempat bikin regresi 1 test).

### Added
- **Plural Variable Resolution Heuristics** — VariableResolver sekarang memiliki heuristic singularisasi penamaan standard Laravel (misal `$categories` -> `Category`, `$products` -> `Product`). Jika nama variabel plural cocok dengan singular model dari symbolTable, resolver secara otomatis menyelesaikannya sebagai tipe model terkait dengan flag `collection: true`, menghasilkan `z.array(CategorySchema)` secara otomatis.
- **Wrap Detection Regression Test Suite** — Menambahkan uji coba regresi (integration & unit) untuk mendeteksi syntax error, whitespace indentation pada use-statement, fully-qualified class names (FQCN) dengan leading backslash, dan aliased imports (`use X as Y`).
- **`payloadSplit.spec.ts`** — Test suite baru (25 test) memverifikasi pemisahan payload/response: `api-schema.ts` hanya boleh berisi `*PayloadSchema`, `api-contract.ts` hanya boleh berisi `*ResponseSchema`, `SDKGenerator` mengimpor payload validator dari `api-schema`, `HookGenerator` tidak pernah mengimpor `*Payload` dari `api-contract`, dan exported names kedua file sepenuhnya disjoint.

### Changed
- **Pemisahan file kontrak & payload request** — Memindahkan `*PayloadSchema` (seperti `OrderCreatePayloadSchema`), `*Payload` types, dan `validate*Payload` helper functions dari `api-contract.ts` ke `api-schema.ts`. `api-contract.ts` sekarang bersih dari data payload request dan khusus menangani response schema backend (`*ResponseSchema`).

### Fixed
- **Level 90 Eloquent method expansion — `updateOrCreate` dan kawan-kawan** — `LaravelRouteParser` Smart Response Inference sekarang melacak assignment `$var = Model::updateOrCreate(...)`, `firstOrCreate`, `forceCreate`, `make`, `sole`, `firstOrNew`, `newInstance`, `newModelInstance`, dan `updateOrInsert` sebagai single-instance model variable. Sebelumnya, field seperti `$review->title` hasil `updateOrCreate` menghasilkan `z.unknown()` karena method tidak masuk ke regex Level 90 (Issue #16).
- **Assignment scanner — closure `return` false-positive skip** — Scanner tidak lagi membuang assignment yang ekspresinya mengandung kata `return` di dalam nested closure/lambda. Hanya expression yang **diawali** `return` (malformed PHP) yang dilewati. Ini memperbaiki `$review = ProductReview::updateOrCreate(...)` di dalam `DB::transaction(function() { ... })` (Issue #17).
- **`nullsafe_property_access` (`?->`) selalu menghasilkan nullable** — `ExpressionResolver` sekarang memaksa `nullable: true` pada hasil resolusi `nullsafe_property_access` (PHP `?->`) terlepas dari deklarasi nullable kolom di database (Issue #15).
- **Ternary dengan branch `null` menghasilkan nullable** — `ExpressionResolver` sekarang mendeteksi ketika satu branch ternary adalah `null`/`unknown` dan menandai branch yang non-null sebagai `nullable: true` (Issue #14).
- **LaravelRouteParser phpScript Escaping** — Mengamankan runtime template string PHP generator dengan memindahkan script PHP wrap detection ke `String.raw` block untuk mencegah syntax error escaping backslash (Issue #10).
- **Wrap Detection Class Resolvers** — Menghapus namespace hardcoded `App\Http\Resources\` dan menggantinya dengan deterministic FQCN extraction dari return statement dan controller `use` statements. (Issue #11, #12, #13).
- **`JsonResource $wrap` detection** — compiler scanner sekarang mendeteksi apakah
  controller route mengembalikan `new XxxResource(...)` tanpa `$wrap = null`. Kalau
  wrapper `data:` aktif, compiler emit schema dengan `z.object({ data: ... })` wrapper
  yang sesuai. Sebelumnya, schema yang digenerate selalu flat (`OrderResourceSchema`)
  sehingga Zod validation diam-diam gagal saat response backend membungkus data dalam
  `{ data: {...} }` (Laravel `JsonResource` default behavior).

  **Breaking behavior change:** project yang sudah punya `public static $wrap = null`
  tidak terpengaruh. Project yang mengandalkan wrapper `data:` perlu mengupdate
  schema manual atau tambahkan `$wrap = null` di resource class mereka.

### Added
- **`sync` warning untuk `JsonResource` tanpa `$wrap = null`** — saat `routesync sync`
  mendeteksi controller yang return `new XxxResource(...)` dan resource class tidak
  mendeklarasikan `public static $wrap = null`, sebuah warning dicetak ke stderr:
  ```
  ⚠ OrderResource wraps response in { data: ... } but schema expects flat object.
    Add `public static $wrap = null;` to OrderResource, or the generated Zod schema
    will fail at runtime.
  ```
- **README: Development Setup** — menambahkan section baru yang menjelaskan setup
  Next.js `rewrites()` proxy untuk development agar request tidak cross-origin:
  ```ts
  // next.config.ts
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://your-backend.test/api/:path*' },
      { source: '/storage/:path*', destination: 'http://your-backend.test/storage/:path*' },
    ]
  }
  ```
  Dan `.env.local` harus menggunakan relative path:
  ```
  NEXT_PUBLIC_API_URL=/api
  ```
- **Auth-guard page template: `mounted` flag** — generated pages yang membutuhkan
  auth check kini menggunakan pola `mounted` flag untuk menghindari React hydration
  mismatch antara SSR (Zustand store belum ter-hydrate) dan client render:
  ```tsx
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted || !isAuthenticated) return <AuthGuard ... />
  ```

## [1.0.49] - 2026-07-08


### Fixed
- **Accessor Type Resolution Pipeline** (Issues #4–#6):
  - **Kernel Graph Sync**: Resolved accessors are now synced back to the kernel's internal model graph after `resolveManifestIncrementally` completes the accessor resolution phase, preventing stale graph data when resolving resource fields.
  - **AccessorResolver Short-Circuit**: `AccessorResolver` now detects already-resolved `expression` objects and returns them directly instead of re-resolving. Added `typeof === 'object'` guard before `in` operator to prevent runtime crash on string values (e.g. `"$this->foo"`).
  - **snake_case → camelCase Fallback**: `ModelColumnResolver` now performs a fallback conversion from snake_case to camelCase when looking up accessors, matching Laravel's convention where accessors are stored as camelCase (`providerTxnId`) but referenced via snake_case (`$this->provider_txn_id`).
  - **Type Safety**: Extended `ModelAccessor` interface with `parsed_ast` and `expression_code` fields. Replaced `any` usage with proper union types and type guards across `AccessorResolver` and `incremental.ts`.

## [1.0.48] - 2026-07-06

### Added
- **Domain-Oriented Intent Patterns (Cart Actions)**:
  - Added support for compiler-generated domain helpers in `hooks.ts` when a group has a `domains` mapping configuration in `routesync.manifest.json`.
  - Automatically generates zero-boilerplate actions such as `.inc(id)`, `.dec(id)`, `.remove(id)`, `.add(id, qty)`, `.applyPromo(code)`, and `.removePromo()`.
- **Global Toast Notifications**:
  - Added a global `toast` config option inside `createClient`. Mutations (create, update, delete) automatically trigger toast callbacks (`toast.success` / `toast.error`) based on action conventions.
- **Unified Query Hook Direct Properties**:
  - React Query hooks now automatically unpack the main data property (matching the resource/group name) alongside query states (`isLoading`, `error`) at the top-level of the returned object (e.g. `const { cart, isLoading } = useCart()`).
  - Supported on both unified group hooks and explicit/canonical query hooks (e.g. `useCart.index()`).
- **Route URL Helper Background Generation**:
  - The URL helper generator output (`routes.ts`) is now written directly into the package dependencies folder and can be imported as `import { routes } from 'routesync/routes'`.
- **Consolidated Constants & Enums**:
  - Created a single source of truth for all generated constants (`API_URL`, `API_ENDPOINTS`, `ROUTES`) and status enums (`Enums`) in a centralized `constants.ts` file, preventing redundancies and desync issues.

### Fixed
- **Rules of Hooks violations**:
  - React Query mutation hooks and `useQueryClient` instances are now strictly invoked at the top-level of React hooks.
- **Strict Type Safety**:
  - Eliminated all instances of `any` from `@routesync/react` runtime libraries.
- **Flattened Relational Property Mapping**:
  - Fixed camelCase flattened properties naming conversions to resolve nested model structures (e.g. `item.produkNama` instead of `item.produk?.nama`).
