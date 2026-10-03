# Phase 595 — Analysis Relational Cutover

## Intent

Move remaining compiler analysis/adapter state from host-language control and collection authority into immutable relation data, recursive relation folds, and explicit witness functions.

## Research basis

The architecture follows several independently established compiler/analysis patterns:

- Soufflé models analysis facts as typed relations and rules over relations.
- MLIR PDLL/DRR separates declarative matching/rewrite descriptions from the generated execution machinery.
- WebAssembly specifies validation with declarative typing judgements and derives an evaluator from those constraints.
- egglog combines equality saturation with Datalog-style relational reasoning.
- Statix models name binding with scope-graph constraints.
- CompCert structures verified compilation as semantic-preserving transformations between formally specified intermediate languages.
- CIRCT uses a central IR as the convergence point between frontends and progressive lowering to backends.

## Production changes

### CompilationState

`CompilationState` is now an immutable relation witness. Artifact storage is `RelationIndex<ArtifactKey, Artifact>`, with relation lookup, insertion, projection and folding. The old class constructor, mutable local merge accumulator, host absence checks, and host collection state are gone.

### TypedPassAdapter

The adapter is now `createTypedPassAdapter`, returning a frozen executable-pass witness. Cache lookup and pass execution are expressed through relation options. The class construction boundary is removed from production code.

### Mapper analysis

`resourceRegistry.ts` now accumulates resource discovery facts through immutable relations. Child resource traversal is recursive relation closure. Import sets are relation memberships instead of `Set` instances.

`mapperAssembler.ts` consumes those relation tuples directly.

### Contract analysis

Contract extraction and artifact assembly now use relation projection/fold rather than array `map`/`reduce`/`for` traversal.

### Fingerprints

Feature flags are represented as immutable relation tuples instead of `ReadonlyMap`. Fingerprint normalization projects and sorts those tuples.

### Type lowering

`ZodSchemaLowerer` had its remaining constructor-based error path removed. The lowerer continues to dispatch through semantic relation operations.

### Dead/empty file vacuum

The zero-byte production TypeScript file `packages/core/src/compiler/generators/CompilerBridge.ts` was confirmed to have no source imports/references and removed. Temporary `phase439_responseDetector.tmp` and stale `routeResourceFacts.ts.bak` were also removed.

49 zero-byte production TypeScript files remain because they are still referenced by source imports and therefore were not deleted blindly.

## Audit

The AST audit scans 1,334 production TypeScript files.

All nine Phase-595 target files have zero AST occurrences of:

- `if`, `while`, `for`, `switch`
- `.map`, `.filter`, `.reduce`, `.flatMap`
- host `undefined`, `null`, `??`, `===`, `!==`
- `as unknown`
- `Set`, `Map`, `any`
- `new`
- ternary expressions

The repository is **not** globally zero-leak yet. The remaining counts are recorded in `PHASE595_ANALYSIS_RELATIONAL_CUTOVER_AUDIT.json` and are the next frontiers rather than being hidden by local zero reports.

## Typecheck limitation

`npx tsc --noEmit --skipLibCheck` remains blocked before project checking because the workspace lacks the configured `node` and `vitest/globals` type definitions. Every Phase-595 modified file passes TypeScript parse/transpile validation with zero diagnostics.
