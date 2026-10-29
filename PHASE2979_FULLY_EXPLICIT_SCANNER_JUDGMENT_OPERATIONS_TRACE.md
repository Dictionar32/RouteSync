# Phase 2979 — Fully Explicit Simplicity: Typed Runtime Scanner Judgment Operations

## Implemented upstream slice

`packages/core/src/types/upstream/scannerTokenStructureInterface.ts` now gives the scanner's four judgment families domain continuations:

- `TokenOccurrenceJudgment.continueWith`
- `TokenOccurrencesJudgment.continueWith`
- `TokenPartitionJudgment.continueWith`
- `DelimitedTokenJudgment.continueWith`

The runtime constructors are private implementation details. Public construction flows through `scannerJudgmentOperations: ScannerJudgmentOperationsInterface = Object.freeze({...})`. This removes the exported generic arrow constructors and prevents consumers from having to re-derive the meaning of raw scanner outcomes merely by inspecting `kind`.

`scannerTokenStructureAlgebra.ts` constructs results through these operations. The facade remains an explicitly typed runtime object: `scannerTokenStructureInterface: ScannerTokenStructureInterface = Object.freeze({...})`. Navigation/cursor arithmetic stays private to this scanner domain; no shared relation foundation is recreated.

## Example consumer

```ts
const meaning = judgment.continueWith({
  matched: evidence => evidence.contents,
  notFound: () => emptySourceEvidence,
  malformed: failure => sourceBlocker.fromDelimiterFailure(failure),
});
```

This example illustrates the intended call shape. The handler names and outputs must be the domain's real contracts; a consumer should not turn this into a generic fallback that erases source failures.

## Runtime trace

```text
UPSTREAM
  token observations
    → scannerTokenStructureInterface
    → occurrence / candidate-collection / partition / delimiter judgment
    → judgment.continueWith(domain handlers)
    → route/source AST projection
CLI
  upstream composition consumes typed source judgments
    → manifest scan invocation
MANIFEST
  manifest preparation and builder preserve source/model/route evidence
IR
  semantic IR lowering and manifest graph consume the canonical model
```

Phase 2979 changes the scanner judgment boundary in upstream. CLI, manifest and IR remain in the trace and inventory because their downstream migrations must be verified along the actual reachable import path; this phase does not claim that every export or relation consumer in those layers has been migrated.

## Interface-first rule

For public runtime APIs, prefer:

```ts
export interface NamedRuntimeInterface {
  readonly run: (input: NamedInput) => NamedJudgment;
}

export const namedRuntime: NamedRuntimeInterface = Object.freeze({
  run: (input: NamedInput): NamedJudgment => domainOperation(input),
});
```

Do not mechanically replace every internal function. Migrate runtime boundaries and their consumers together, preserve explicit source blockers, and do not hide type/data loss behind `undefined`, `null`, arbitrary strings, booleans or silent fallbacks.

## Backlog and non-negotiable constraints

- Continue migrating `packages/core/src/types/upstream` consumers so the domain operations are actually used downstream, not only declared.
- Continue tracing the reachable path through CLI, manifest builder, manifest graph and IR from the build log.
- Keep `packages/core/src/types/upstream/collections.ts` empty.
- Do not restore `packages/core/src/semantic/relations/relationMembership.ts`, `relationalSequence.ts`, or `semanticRelations.ts`.
- Do not replace the removed foundation with another generic relation foundation; move domain responsibility into the relevant ADTs/interfaces.

## Verification

The focused strict TypeScript check for `scannerTokenStructureInterface.ts` and `scannerTokenStructureAlgebra.ts` passed. Five compiled runtime smoke assertions passed. Structural audit results and the remaining export/import inventory are recorded in `PHASE2979_FULLY_EXPLICIT_SCANNER_JUDGMENT_OPERATIONS_AUDIT.json`. Full workspace typecheck, full tests and full CLI/manifest build were not run and are not claimed.
