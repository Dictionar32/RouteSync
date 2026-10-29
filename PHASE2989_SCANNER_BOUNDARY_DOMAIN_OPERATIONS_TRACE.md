# Phase 2989 — Scanner Boundary Domain Operations

## Goal

Continue the fully explicit typed runtime scanner migration by making statement-boundary decisions owned by the scanner domain. Preserve a closed, serializable public judgment while private decisions expose domain continuation operations.

## Implementation

`packages/core/src/types/upstream/scannerStatementBoundaryAlgebra.ts` no longer imports `relationEqual`, `relationAll`, `relationAdvanceIndex`, or `relationGate` from the deleted generic relation foundations. The implementation now owns:

- `DelimiterLookup`: opener / closer / ordinary token recognition with `continueWith`.
- `TerminatorPosition`: top-level semicolon versus ordinary position with `continueWith`.
- `StartCursorJudgment`: valid versus invalid compatibility cursor with `continueWith`.
- `BoundaryProjection`: dispatches the closed `StatementBoundaryJudgment` into the legacy cursor-shaped projection.

The public canonical boundary result remains the closed union `terminator | end_of_input | malformed`. Runtime exports remain explicit interface-typed objects:

```ts
export const scannerStatementBoundaryContractAlgebra: ScannerStatementBoundaryInterface = Object.freeze({
  resolve: <Token>(query: StatementBoundaryQuery<Token>): StatementBoundaryJudgment<Token> => {
    // scanner-owned boundary operation
  },
});
```

The compatibility facade is also retained as `export const scannerStatementBoundaryAlgebra: StatementBoundaryAlgebra = Object.freeze({...})` because existing tests and package consumers use its cursor-shaped output. The facade delegates delimiter recognition to the canonical partition algebra.

## Runtime trace

```text
PHP source token descriptors
  -> astClassifierRuntime.parseStatements(...)
  -> scannerStatementSequenceAlgebra.parse(...)
  -> scannerStatementBoundaryContractAlgebra.resolve(...)
  -> closed StatementBoundaryJudgment
  -> sequence partition validation / statement parsing
  -> PHP AST runtime result
  -> upstream manifest builder / source model and semantic inventory
  -> controllerInvocationManifestBuilder.build(...)
  -> routeSyncCliManifestScanOperationFactory.create(...).scan(...)
  -> ControllerInvocationManifestCompositionAuthority.compose(...)
  -> ManifestBuilderJudgment.continueWith(...)
  -> CLI scan/sync terminal projection and output
```

Source anchors inspected:

- `packages/core/src/compiler/frontend/php/astClassifierRuntime.ts`: `parseStatements` passes source token slices to `scannerStatementBoundaryContractAlgebra.resolve` through the sequence contract.
- `packages/cli/src/commands/scan.ts`: command invokes `manifestScanOperation.scan(...)` and then consumes the returned manifest judgment through its continuation operation.
- `packages/cli/src/manifestScanOperationInterface.ts`: CLI scan factory is exported as an interface-typed runtime object.
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`: manifest-builder judgment is handled with `judgment.continueWith({ onComplete, onBlocked })`.

This confirms the composition boundaries and scanner call site. It does not by itself prove that every individual scanner judgment is preserved unchanged through manifest serialization and IR; that requires a separate field-level provenance audit.

## Verification

- Structural audit command: `npm run audit:phase2989-scanner-boundary-domain-operations`.
- Targeted strict TypeScript check passed for `scannerStatementBoundaryInterface.ts`, `scannerTokenStructureAlgebra.ts`, and `scannerStatementBoundaryAlgebra.ts`.
- Runtime smoke test passed for nested top-level terminator detection, unexpected closer, mismatched closer, unclosed delimiter, invalid start, end-of-input, and canonical partition judgment (7 checks).
- Full repository build/typecheck/test suite not run: repository dependencies are not installed in this workspace snapshot.

## Remaining work / constraints

- Do not restore `relationMembership.ts`, `relationalSequence.ts`, or `semanticRelations.ts`.
- Phase 2988's wider audit recorded hundreds of remaining imports from those removed foundations. This phase removes the boundary algebra's direct imports only; it does not claim the repository-wide migration is complete.
- Continue by migrating upstream consumer clusters through their domain-owned ADTs, then trace field-level evidence into CLI, manifest, and IR.
- Do not mechanically eliminate genuine token traversal branches. The goal is to move knowledge/decisions into typed domain judgments and keep downstream flow simple.
