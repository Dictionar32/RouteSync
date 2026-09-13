# Implementation Plan: Pure End-to-End Dataflow Pipelines (0 IIFE, 0 Wrapper, Direct Streams)

Refactor RouteSync from imperative, procedural control flow (cascading `if/else`, boolean flag bags, mutating `let resolved...`, `switch`, fallback guessing, `continue` filtering, static monoliths, `any` escape hatches, `options?: Partial<T>` holes, OOP `class CompilerBridge` with `new CompilerBridge()`, and inline IIFE wrappers `(() => { const art = ...; return { ... }; })()`) to **Pure End-to-End Dataflow Pipelines** guided by Single Source of Truth (SSOT), Complete Guaranteed Contracts, and Correct-by-Construction design (**Rules 8, 10, 11, 12**).

---

## 1. Upstream Root Cause & Architectural Violations Being Eliminated

| Layer | Control-Flow / IIFE / Wrapper Root Cause | Target Pure Dataflow Architecture |
|---|---|---|
| **1. Compiler Lowering Expressions (`CompilerBridge.ts`)** | Inline IIFEs `apiFields: (() => { const art = ...; return { ... }; })()` which hide imperative procedural scripts inside object literals | **Pure Functional Pipeline Composition**: Each pass output is already a Complete Value Object or lowered directly through a dedicated pure function: `lowerApiFieldOutput(requestArtifact)` directly returning `{ code, metadata }`. Zero inline IIFE `(() => ...)()`, zero temporary variable leaking. |
| **2. Upstream Compiler Transforms (`packages/core/src/compiler/passes/`)** | OOP classes demanding arrays `run([inputs]): [output]`, and secondary parameter holes like `dependencies?: ...` which reintroduce `?` and fallback branching | **Pure Single-Argument Transform Functions (1 Input $\to$ 1 Output)**: Pure functions accepting ONLY the single mandatory artifact and directly returning the result: `lowerTypeScriptArtifact(artifact)`, `lowerFormArtifact(artifact)`, `lowerContractArtifact(artifact)`, `lowerApiFieldArtifact(artifact)`, `lowerMapperArtifact(artifact)`. **0 `?`, 0 secondary options, 0 class instances, 0 array-wrapping `[artifact]`, 0 `new`.** |
| **3. Compiler Orchestrator Structure** | Class-based monolith with static wrapper methods instantiating `new CompilerBridge()` | **Pure Functional Pipeline (0 Class, 0 `new`)**: Elimination of `class CompilerBridge`. Primary pipeline: `compileManifest(manifest)` dan `emitFullBundle(manifest, outputDir, coreEmitter, clientEmitters)`. `emitCoreArtifacts` adalah convenience alias `emitFullBundle(manifest, outputDir, CoreFilesEmitter, [])`. `CompilerBridge` const namespace untuk backward-compat. |
| **4. Route Descriptors (`routeDescriptors.ts`)** | `ScannedRouteDescriptor.create()` has 25 optional parameters with `?`, 100-line procedural script with `let resolved...`, string splitting `if (action.includes('@'))`, and guessing ladders | Dedicated **Explicit Semantic Factories** (`fromControllerAction`, `fromControllerReference`, `fromClosure`, `synthetic`). Constructor demands complete `ScannedRouteParams` (0 `let`, 0 `??`, 0 `if`). |
| **5. Route Parameters & Policies** | `bindingField: string | null`, `modelParameter?: string | null`, `rateLimit: RateLimitDescriptor | null` | Complete non-nullable contracts: `bindingField: string` (`""` for no binding), `modelParameter: string` (`""` for gates), and `ScannedRateLimitDescriptor.none()` (0 `null`, 0 `?`). |
| **6. Emitters (`HookGenerator`, `QueryKeyGenerator`)** | `switch (group.kind)` and imperative loop over `group.all` with 5 sequential `if (...) continue` filters; `handledActionKeys: Set<string>` mutable tracker; `if (group.isCrud)` | **Self-Projecting ADT Lowering**: Groups implement `lowerCacheConfig(addInvs)` and `lowerQueryKeyBlock()`. Generator is a pure stream delegator (1 stream, 1 pass `for`, 0 `if`, 0 `switch`). |
| **7. Resource Groups (`route-classifier.ts`)** | Groups carry flat unpartitioned `all: readonly TRoute[]`, forcing downstream to rediscover CRUD vs mutations vs queries | Pre-partitioned at Origin Boundary: `crudRoutes`, `extraMutations`, and `customQueries` stored as immutable non-nullable arrays. |

---

## 2. Target Architecture Specifications

### A. Upstream Pure Transform & Output Lowering Functions (`packages/core/src/compiler/passes/`)

Instead of forcing callers to manually unpack artifacts or write inline IIFEs to construct output objects, the domain exports **Pure Direct Mappings**:

```typescript
// Pure Upstream Artifact Lowerers (1 Input → 1 Output, 0 '?', 0 'new'):
export function lowerTypeScriptArtifact(artifact: SemanticTypesArtifact): GeneratedTypeScriptArtifact;
export function lowerFormArtifact(artifact: RequestTypesArtifact): GeneratedFormArtifact;
export function lowerContractArtifact(artifact: RequestTypesArtifact): GeneratedContractArtifact;
export function lowerApiFieldArtifact(artifact: RequestTypesArtifact): GeneratedApiFieldArtifact;
export function lowerMapperArtifact(artifact: RequestTypesArtifact): GeneratedMapperArtifact;

// Pure Downstream Compiler Output Lowerers (Direct Return, 0 IIFE):
export function lowerReadTypesOutput(artifact: SemanticTypesArtifact, manifest: RouteManifest): CompilerOutput;
export function lowerFormTypesOutput(artifact: RequestTypesArtifact, manifest: RouteManifest): FormOutput;
export function lowerContractsOutput(artifact: RequestTypesArtifact, manifest: RouteManifest): ContractOutput;
export function lowerApiFieldsOutput(artifact: RequestTypesArtifact): ApiFieldOutput;
export function lowerMappersOutput(artifact: RequestTypesArtifact): MapperOutput;
```

### B. Pure Functional Pipeline Orchestrator (0 Class, 0 `new`, 0 IIFE, Direct Return)

The entire `compileManifest` function becomes a **Pure Composed Value Expression**:

```typescript
export interface CompilerEmitContext {
  readonly manifest: RouteManifest;
  readonly outputDir: string;
  readonly domainGraph: ClassifiedDomainGraph<ClassifiedRoute>;
  readonly contractsBundle: CompiledContractsBundle;
}

export interface CompilerEmitter {
  readonly id: string;
  emit(context: CompilerEmitContext): Promise<readonly string[]>;
}

/**
 * CoreFilesEmitter — writes the 5 core artifacts.
 * Sama seperti emitter lain: menerima CompilerEmitContext, menulis file, return paths.
 * Tidak ada stage terpisah, tidak ada split, tidak ada concat downstream.
 */
export const CoreFilesEmitter: CompilerEmitter = Object.freeze({
  id: 'core-files',
  async emit({ contractsBundle, outputDir }: CompilerEmitContext): Promise<readonly string[]> {
    const entries = [
      { file: path.join(outputDir, 'types',     'api-read.ts'),      code: contractsBundle.readTypes.code },
      { file: path.join(outputDir, 'forms',     'api-form.ts'),      code: contractsBundle.formTypes.code },
      { file: path.join(outputDir, 'contracts', 'api-contract.ts'),  code: contractsBundle.contracts.code },
      { file: path.join(outputDir, 'contracts', 'api-field.ts'),     code: contractsBundle.apiFields.code },
      { file: path.join(outputDir, 'mappers',   'api-mapper.ts'),    code: contractsBundle.mappers.code  }
    ];

    await Promise.all(entries.map(async e => {
      await fs.ensureDir(path.dirname(e.file));
      await fs.writeFile(e.file, e.code);
    }));

    return Object.freeze(entries.map(e => e.file));
  }
});

export const DEFAULT_CLIENT_EMITTERS: readonly CompilerEmitter[] = Object.freeze([
  TypeBarrelEmitter,
  SdkClientEmitter,
  ConstantsEmitter,
  QueryKeyEmitter,
  HookEmitter
]);


/**
 * Pure Dataflow Expression:
 * manifest → CompiledContractsBundle
 * (0 class, 0 new, 0 IIFE, 0 array wrapping [artifact], 0 secondary options, 0 '?')
 */
export function compileManifest(manifest: RouteManifest): CompiledContractsBundle {
  const semanticArtifact = manifestToSemanticTypes(manifest);
  const requestArtifact  = manifestToContractInput(manifest);

  return Object.freeze({
    readTypes: lowerReadTypesOutput(semanticArtifact, manifest),
    formTypes: lowerFormTypesOutput(requestArtifact, manifest),
    contracts: lowerContractsOutput(requestArtifact, manifest),
    apiFields: lowerApiFieldsOutput(requestArtifact),
    mappers:   lowerMappersOutput(requestArtifact)
  });
}

/**
 * Pure Dataflow Pipeline:
 * manifest → CompiledContractsBundle → { coreEmitter, clientEmitters } → { writtenPaths, clientArtifacts }
 *
 * coreEmitter dan clientEmitters dipisah sebagai parameter bernama — hasilnya
 * langsung bertipe, 0 slice, 0 magic number, 0 flat, 0 merge.
 * clientArtifacts: readonly (readonly string[])[] — satu array per emitter,
 * sesuai shape yang dikembalikan Promise.all secara langsung.
 */
export async function emitFullBundle(
  manifest: RouteManifest,
  outputDir: string,
  coreEmitter: CompilerEmitter = CoreFilesEmitter,
  clientEmitters: readonly CompilerEmitter[] = DEFAULT_CLIENT_EMITTERS
): Promise<FullBundleEmittedArtifacts> {
  const contractsBundle = compileManifest(manifest);
  const domainGraph     = classifyDomainGraph(manifest);

  const context: CompilerEmitContext = Object.freeze({
    manifest,
    outputDir,
    domainGraph,
    contractsBundle
  });

  const writtenPaths    = Object.freeze(await coreEmitter.emit(context));
  const clientArtifacts = Object.freeze(
    await Promise.all(clientEmitters.map(e => e.emit(context)))
  );

  return Object.freeze({
    readTypes:       contractsBundle.readTypes,
    formTypes:       contractsBundle.formTypes,
    contracts:       contractsBundle.contracts,
    apiFields:       contractsBundle.apiFields,
    mappers:         contractsBundle.mappers,
    writtenPaths,
    clientArtifacts
  });
}

// Convenience — emit hanya core files (tanpa client emitters):
export const emitCoreArtifacts = (manifest: RouteManifest, outputDir: string) =>
  emitFullBundle(manifest, outputDir, CoreFilesEmitter, []);

// Re-export CompilerBridge sebagai pure namespace untuk backward-compatibility dengan tests:
export const CompilerBridge = Object.freeze({
  compileAll:      compileManifest,
  emitAll:         emitCoreArtifacts,
  emitFullBundle
});

```

### C. Self-Projecting Resource Groups (Rule 12 Pure Dataflow)

$$\text{Stream}(\text{Domain}) \xrightarrow{\text{yield* } x.\text{lower}()} \text{Stream}(\text{Output Lines}) \xrightarrow{\text{write}()} \text{File}$$

**1 Stream, 1 Pass (`for`), 0 `if`, 0 `switch`, 0 multiple `for`**:

```typescript
export interface ResourceGroupLoweringTrait<TRoute = ParsedRoute> {
  lowerQueryKeyBlock(): Iterable<string>;
  lowerCacheConfig(addInvs: (route: TRoute, invs: string[]) => void): Iterable<string>;
}

// In HookGenerator:
for (const group of graph.resourceGroupGraph.all) {
  yield `  /* ===== ${group.titleName.toUpperCase()} ===== */`;
  yield* group.lowerCacheConfig(addInvs);
  yield ``;
}

// In QueryKeyGenerator:
for (const group of graph.resourceGroupGraph.all) {
  yield `  /* ===== ${group.titleName.toUpperCase()} ===== */`;
  yield* group.lowerQueryKeyBlock();
  yield ``;
}
```

### D. Explicit Semantic Route Factories (Rule 10 Complete Contracts)

1. `ScannedRouteDescriptor.fromControllerAction(params)`: Direct from AST `ControllerActionInfo`.
2. `ScannedRouteDescriptor.fromControllerReference(params)`: Route with known controller & action string, but no method AST body.
3. `ScannedRouteDescriptor.fromClosure(params)`: Route handled by a closure (with empty `controllerName: ""`, `ClosureHandlerDescriptor`, and empty schema).
4. `ScannedRouteDescriptor.synthetic(params)`: Dedicated test fixture builder with Complete Contract.
5. Constructor takes `ScannedRouteParams` with 0 `?`, 0 `??`, and 0 `null`.

---

## 3. The 8-Step Refactoring Workflow (Rule 8)

### Step 1: Trace Actual Flow & Origin Boundary
- **Upstream Origin Boundary**:
  - In `packages/core/src/compiler/passes/`, define pure functions `lowerTypeScriptArtifact`, `lowerFormArtifact`, `lowerContractArtifact`, `lowerApiFieldArtifact`, `lowerMapperArtifact` that take EXACTLY 1 artifact and directly return 1 artifact (0 `?`, 0 secondary parameters).
  - Define pure output lowerers `lowerReadTypesOutput`, `lowerFormTypesOutput`, `lowerContractsOutput`, `lowerApiFieldsOutput`, `lowerMappersOutput` returning the final contract objects directly without IIFEs.
- **Compiler Pipeline Origin Boundary**:
  - In `CompilerBridge.ts`, export primary pipeline functions `compileManifest` dan `emitFullBundle(manifest, outputDir, coreEmitter, clientEmitters)`.
  - `emitCoreArtifacts` adalah convenience alias: `emitFullBundle(manifest, outputDir, CoreFilesEmitter, [])` — bukan pipeline function terpisah.
  - **Eliminate `class CompilerBridge` with `new CompilerBridge()` entirely**.
- **Origin Boundary for Routes**: Move all string splitting (`Controller@action`), domain determination, and handler classification to `RouteScanner`.
- **Origin Boundary for Groups**: In `classifyDomainGraph`, partition routes into `crudRoutes`, `extraMutations`, and `customQueries` upfront.

### Step 2: Determine Type Family
- **Upstream Pass Functions**: `(artifact: I) => O` (Single Argument, Pure Mapping).
- **Compiler Orchestration Family**: `compileManifest`, `emitFullBundle`, `CoreFilesEmitter`, `CompilerEmitter`, `CompilerEmitContext`. `emitCoreArtifacts` adalah alias, bukan anggota family.
- **`FullBundleEmittedArtifacts`**: `clientArtifacts: readonly (readonly string[])[]` — per-emitter shape, bukan flat. `Promise.all` langsung menghasilkan shape ini, 0 `.flat()`, 0 merge.
- **Route Family**: `ParsedRoute` ADT variants (`ControllerActionRoute`, `ClosureRoute`).
- **Resource Group Family**: `ResourceGroupDescriptor<TRoute>` ADT variants with `ResourceGroupLoweringTrait`.

### Step 3: Type Vocabulary Design (TTD)
- Export pure transform function signatures in `packages/core/src/compiler/passes/index.ts` with 0 `?`.
- Update `packages/core/src/types/domain/resourceGroupDescriptors.ts`:
  - `ResourceGroupLoweringTrait`
  - `extraMutations: readonly TRoute[]`
  - `customQueries: readonly TRoute[]`
- Update `routeDescriptors.ts`:
  - `bindingField: string` (0 `null`)
  - `modelParameter: string` (0 `null`)
  - `rateLimit: RateLimitDescriptor` via `ScannedRateLimitDescriptor.none()` (0 `null`)

### Step 4: Type Contract Tests
- Write type-level tests in `packages/sdk/tests/pureDataflowTypeContracts.spec.ts`:
  - Verify pure transform functions take EXACTLY 1 argument (artifact) with 0 optional parameters `?`.
  - `compileManifest` dan `emitFullBundle` adalah pure callable functions (0 `new`, 0 IIFE).
  - `emitCoreArtifacts` adalah alias — verifikasi ia memanggil `emitFullBundle(manifest, outputDir, CoreFilesEmitter, [])`.
  - Every `ResourceGroupDescriptor` variant implements `ResourceGroupLoweringTrait`.
  - `extraMutations` dan `customQueries` are non-nullable arrays.
  - Zero `null` in route parameters, policies, and rate limits.

### Step 5: Flow Tests & Origin Tests
- Write flow tests verifying:
  - Direct calls to `compileManifest(manifest)` return valid `CompiledContractsBundle` without class instantiation and without IIFEs.
  - Direct calls to `lowerContractArtifact(artifact)` return valid `GeneratedContractArtifact` without secondary parameters.
  - `classifyDomainGraph` partitions `extraMutations` and `customQueries` without data loss or duplication.
  - `group.lowerQueryKeyBlock()` and `group.lowerCacheConfig()` produce exact code blocks.

### Step 6: Refactor Implementation
1. **`packages/core/src/compiler/passes/` (Upstream)**:
   - Implement `lowerTypeScriptArtifact(artifact)`, `lowerFormArtifact(artifact)`, `lowerContractArtifact(artifact)`, `lowerApiFieldArtifact(artifact)`, `lowerMapperArtifact(artifact)`.
   - Implement direct output lowerers: `lowerReadTypesOutput`, `lowerFormTypesOutput`, `lowerContractsOutput`, `lowerApiFieldsOutput`, `lowerMappersOutput`.
   - 0 `?`. Exactly 1 argument, directly returning the artifact.
2. **`packages/cli/src/generators/CompilerBridge.ts`**:
   - Replace the class with primary pipeline functions `compileManifest` dan `emitFullBundle(manifest, outputDir, coreEmitter, clientEmitters)`.
   - `emitCoreArtifacts` sebagai convenience alias — 1 baris, langsung delegate ke `emitFullBundle`.
   - 0 `new`, 0 class instances, 0 IIFE, 0 array wrapping `[artifact]`, 0 `?`.
   - Provide `CompilerBridge` const namespace for 100% backward-compatibility with tests.
3. **`packages/core/src/types/domain/resourceGroupDescriptors.ts`**:
   - Implement `lowerQueryKeyBlock()` and `lowerCacheConfig()` on all 5 `Scanned*ResourceGroupDescriptor` classes.
   - Add `extraMutations` and `customQueries` to constructor parameters and properties.
4. **`packages/cli/src/generators/route-classifier.ts`**:
   - In `classifyDomainGraph`, partition `extraMutations` and `customQueries` upfront when constructing each resource group.
5. **`packages/cli/src/generators/HookGenerator.ts`**:
   - Mandatory `domainGraph: ClassifiedDomainGraph<ClassifiedRoute>` parameter.
   - Replace `switch (group.kind)` and the 5-layer `for (...) { if (...) continue; }` loop with `yield* group.lowerCacheConfig(addInvs)`.
   - Remove `handledActionKeys: Set<string>`.
6. **`packages/cli/src/generators/QueryKeyGenerator.ts`**:
   - Mandatory `domainGraph: ClassifiedDomainGraph<ClassifiedRoute>` parameter.
   - Replace `if (group.isCrud)` with `yield* group.lowerQueryKeyBlock()`.
7. **`packages/core/src/compiler/scanner/descriptors/routeDescriptors.ts`**:
   - Replace procedural script in `ScannedRouteDescriptor.create()` with explicit factories (`fromControllerAction`, `fromControllerReference`, `fromClosure`, `synthetic`).
   - Clean up `ScannedRouteParameterDescriptor` and `ScannedRoutePolicyDescriptor` (guaranteed non-nullable strings).
8. **`packages/core/src/compiler/scanner/subscanners/RouteScanner.ts`**:
   - At Origin Boundary, construct complete routes using `fromControllerAction`, `fromControllerReference`, and `fromClosure`.

### Step 7: Run Regression Tests
- Build all packages:
  ```bash
  npm run build
  ```
- Run the entire test suite:
  ```bash
  cd packages/sdk && npx vitest run --reporter=verbose
  ```
  **Wajib 100% GREEN (semua 99 test files lulus).**

### Step 8: Compare Output Before vs After
- Verify that generated output files (`hooks.ts`, `query-key.ts`, `api-contract.ts`) remain 100% deterministic and identical in structure.

---

## Verification Plan

### Automated Tests
- `npm run build`
- `cd packages/sdk && npx vitest run --reporter=verbose`
- Regression test files in `packages/sdk/tests/`:
  - `domainGraphClassifierADT.spec.ts`
  - `correctByConstructionSSOT.spec.ts`
  - `pureDataflowTypeContracts.spec.ts` (new)

### Manual Inspection & Code Review
- Verify 0 IIFEs `(() => ... )()` anywhere in the pipeline.
- Verify 0 `class CompilerBridge` and 0 `new CompilerBridge()` anywhere in the pipeline.
- Verify 0 `?` in pure transform function signatures.
- Verify direct functional invocation `lowerContractArtifact(requestArtifact)`.
- Verify 0 `[artifact]` array wrapping in `compileManifest()`.
- Verify 0 `if (options.xyz)` in `CompilerBridge.ts`.
- Verify 0 boolean flags driving procedural execution.
- Grep verify: 0 `switch` in `HookGenerator.ts`.
- Grep verify: 0 `if (r.method === 'GET') continue` in `HookGenerator.ts`.
- Grep verify: 0 `if (group.isCrud)` in `QueryKeyGenerator.ts`.
- Grep verify: 0 mutating `let resolved...` in `routeDescriptors.ts`.
