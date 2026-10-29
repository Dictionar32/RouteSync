# Phase 2978 — Fully Explicit Simplicity: Typed Runtime Scanner Operations

## Implemented slice

`packages/core/src/types/upstream/scannerTokenStructureInterface.ts` now models `TokenOccurrenceJudgment` as an actionable ADT. Each terminal variant owns `continueWith`, and the operation delegates to a closed set of handlers (`found`, `notFound`, `malformed`). Consumers can act on a judgment without re-deriving its meaning from a primitive discriminant check.

The scanner facade remains an explicit runtime export:

```ts
export const scannerTokenStructureInterface: ScannerTokenStructureInterface = Object.freeze({
  locateTopLevel: /* typed operation */,
  // other scanner operations
});
```

The concrete `locateTopLevel` path constructs judgments through `tokenOccurrenceFound`, `tokenOccurrenceNotFound`, and `tokenOccurrenceMalformed`, so the operation exists on values emitted by the runtime rather than only in a type declaration. Regression coverage exercises found and not-found continuations.

## Navigation ownership

`scannerTokenStructureAlgebra.ts` no longer imports `relationAdvanceIndex` or `relationGate` from the deleted `semantic/relations/relationalSequence` foundation. Cursor advancement and scanner-local transition selection are now owned by the scanner module's `ScannerTokenNavigationInterface`. This is a scanner-specific implementation detail, not a replacement shared relation foundation. Cursor indexes remain internal to the algebra; the consumer-facing occurrence judgment contains token evidence rather than a cursor index.

## Runtime trace and boundaries

```text
Token stream + token-value observation
  → ScannerTokenStructureInterface.locateTopLevel
  → TokenOccurrenceJudgment (found | not_found | malformed)
  → judgment.continueWith(domain handlers)
  → upstream scanner consumer
  → CLI composition
  → manifest preparation/build
  → IR lowering / manifest graph
```

The edited slice is upstream token scanning. CLI, manifest, and IR are inventoried for remaining exported function declarations, arrow factories, and direct imports from the three deleted foundation modules. This phase does **not** claim all those consumers have already been migrated; counts are retained as follow-up evidence.

## Interface-first runtime pattern

Target form:

```ts
export interface NamedRuntimeInterface {
  readonly run: (input: NamedInput) => NamedJudgment;
}

export const namedRuntime: NamedRuntimeInterface = Object.freeze({
  run: (input: NamedInput): NamedJudgment => domainOperation(input),
});
```

The goal is not a mechanical syntax rewrite. Public runtime exports should expose explicit contracts; domain ADTs should own continuation operations; internal recursion may still use control flow for token recognition. Do not hide source blockers with fallback values, reconstruct an ADT from parallel primitives, or restore `relationMembership.ts`, `relationalSequence.ts`, or `semanticRelations.ts`. `packages/core/src/types/upstream/collections.ts` remains empty.

## Verification limits

The audit is structural and reports its inventory. It does not replace a full package typecheck or runtime test suite. Build/typecheck status must be reported separately from these checks.
