# Phase 2977 — Fully Explicit Simplicity: Typed Runtime Scanner Operations

## Source-backed model

The runtime path is modeled as domain hand-offs, not a single procedural pipeline:

1. **Scanner token structure** — `ScannerTokenStructureInterface` receives token evidence and returns a typed judgment (`found` / `not_found` / `malformed`, `complete` / `malformed`, `partitioned` / `malformed`, or `matched` / `not_found` / `malformed`). The public runtime objects are explicitly typed as `ScannerTokenStructureAlgebra` and `ScannerTokenStructureInterface`.
2. **Source selection** — `LaravelRouteSourceSelection` preserves source presence as a domain outcome. Its present/absent ADT owns `continueWith`; a selected-but-missing source remains a blocker rather than being silently treated as an optional default.
3. **Route scan** — route-scan outcomes own `continueToSourceAstProjection`, preserving source-selection, read, response, and policy blockers as typed outcomes.
4. **Semantic pipeline assembly** — CLI composition receives the typed assembly result and dispatches through `assembly.continueWith`; it does not rebuild semantic authority.
5. **CLI manifest operation** — `routeSyncCliManifestScanOperationFactory` exposes a typed runtime object whose `scan` delegates to the supplied manifest composition authority.
6. **Manifest runtime** — `routeSyncManifestScanOperationFactory`, `routeSyncManifestScanner`, and `manifestBuilderOperationPreparation` are interface-typed runtime objects.
7. **Manifest graph** — `manifestGraphCompilationOperations` is an interface-typed downstream operation over the graph-specific manifest surface.

## Interface-first usage shape

```ts
export interface ScannerRuntimeOperationsInterface {
  readonly scan: (input: ScannerInput) => ScannerJudgment;
}

export const scannerRuntimeOperations: ScannerRuntimeOperationsInterface = Object.freeze({
  scan: (input: ScannerInput): ScannerJudgment => scannerDomain.scan(input),
});
```

This is the intended export shape for public runtime operations. Do not export a runtime `function name(parameter: Parameter): Output {}` or an inferred `export const name = (parameter: Parameter): Output => ...` where the exported API can instead be represented by a named interface and a frozen object. Internal helpers may remain private implementation details; this rule is not a mechanical demand to turn every local function into an object.

## ADT continuation principle

A discriminant and payload alone describe a result but do not define what the domain permits downstream. The desired model is:

```ts
export interface ScannerJudgmentHandlers<Result> {
  readonly found: (evidence: TokenEvidence) => Result;
  readonly notFound: () => Result;
  readonly malformed: (failure: ScannerFailureEvidence) => Result;
}

export type ScannerJudgment =
  | Readonly<{ kind: 'found'; evidence: TokenEvidence; continueWith: <Result>(handlers: ScannerJudgmentHandlers<Result>) => Result }>
  | Readonly<{ kind: 'not_found'; continueWith: <Result>(handlers: ScannerJudgmentHandlers<Result>) => Result }>
  | Readonly<{ kind: 'malformed'; failure: ScannerFailureEvidence; continueWith: <Result>(handlers: ScannerJudgmentHandlers<Result>) => Result }>;
```

This is a design example, not a claim that every scanner token judgment has already been migrated to it. Source-presence and route-scan outcomes already demonstrate domain-owned continuation. Scanner token judgments remain a follow-up migration target; their current discriminated unions still mostly carry data for consumers to branch on.

## Trace and audit interpretation

`PHASE2977_RUNTIME_SCANNER_UPSTREAM_CLI_MANIFEST_AUDIT.json` records the source-level checks and a current count of imports from the three intentionally deleted relation-foundation modules. CLI can have zero direct imports and still fail transitively through the Core public barrel. Therefore, the count is not a CLI-only problem: migrate actual upstream consumers and the public-export dependency chain by domain.

The next implementation slice should be scanner-token judgment continuation (found/not-found/malformed) and then the upstream consumers that import deleted relation modules, followed by manifest graph consumers. Preserve missing-source/read failures as explicit blockers. Do not restore or recreate `relationMembership.ts`, `relationalSequence.ts`, or `semanticRelations.ts`; do not fill `types/upstream/collections.ts`.

## Verification boundary

The phase audit is structural. It does not claim a complete relation-foundation migration or full TypeScript build success. A full build/typecheck should be run once dependencies are available; historical `build.log` reports unresolved imports that remain to be migrated.
