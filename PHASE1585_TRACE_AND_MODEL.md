# Phase 1585 — RequestType Semantic Wiring Cutover

## Goal

Remove RequestType semantic decision-making from scanner wiring and scanner orchestration. Do not replace `if` with `relationGate` as a cosmetic rewrite; centralize the existing resolution/contribution policy behind a semantic solver interface.

## Trace before this phase

- `compiler/scanner/wiring/routeManifestTypeLowering.ts` called `RequestTypeDeriver.derive(...)` directly.
- `compiler/scanner/subscanners/RequestTypeDeriver.ts` created a `DerivationContext` and called `aggregateRequestTypeGroups(...)`.
- `compiler/scanner/subscanners/request-deriver/groupAggregator.ts` owned request lookup, no-request exclusion, group existence, action merge, and response merge decisions.
- `actionDeriver.ts` and `responseDeriver.ts` also lived in the scanner subtree while computing semantic contributions.
- `compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts` exists separately, but its proof-carrying `RequestTypeDerivationSemanticAuthorityAssessment` is not yet connected to this RequestType artifact projection path.

## Changes

- Added `RequestTypeDerivationProjectionInterface` as the compiler-facing contract for the existing RequestType projection operation.
- Added `requestTypeDerivationProjectionPipeline`, the single entry point that builds the derivation context and invokes the semantic solver.
- Moved the group resolution/reconciliation implementation into `compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts`.
- Moved action and response contribution implementations into `actionContribution.ts` and `responseContribution.ts` under the semantic package.
- Converted scanner `RequestTypeDeriver`, `groupAggregator`, `actionDeriver`, and `responseDeriver` into compatibility facades/re-exports; they no longer own the decision logic.
- Updated `routeManifestTypeLowering.ts` to call the projection interface directly. It no longer calls the scanner facade.
- Preserved the old solver body and behavior; this phase is an ownership/wiring cutover, not a semantic-policy rewrite.

## Important limits

This phase removes semantic resolution/reconciliation from the wiring layer, but does **not** yet connect the projection pipeline to the closed proof-authority contract in `requestTypeDerivationInterface.ts`. The current projection interface returns `RequestType[]`, not `RequestTypeDerivationSemanticAuthorityAssessment`. Do not claim proof-carrying authority is end-to-end until a solver produces the full closed judgment/proof/verification/coverage and the authority verifies it.

The semantic solver still uses compiler-specific `Scanned*Descriptor` builders for its output. A later model phase should separate semantic judgment/receipt production from compiler artifact materialization, without moving policy back into wiring.

## Verification

- Phase audit: 11/11 checks passed.
- TypeScript `transpileModule` on all changed TS entry files: 0 syntax/transpile diagnostics.
- Focused strict type-check through `routeManifestTypeLowering.ts`: baseline 783 diagnostics, current 779 diagnostics. The repository still has many pre-existing type errors; several errors in the moved solver/contribution modules are the same errors present in the old scanner implementations. This is not a clean strict type-check.
- Package build: blocked because `tsdown` is not installed in this workspace.
- Runtime executor and proof authority implementation were not changed in this phase; executor remains the final migration stage.
- ZIP root is `RouteSync/` and archive integrity is checked.

## References

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — analyses/transformations can operate through interfaces rather than concrete implementation details.
- TypeScript Narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html — discriminated unions can model closed variants and exhaustive handling; this does not prove runtime evidence consistency by itself.
- MLIR Declarative Rewrite Rules: https://mlir.llvm.org/docs/DeclarativeRewrites/ — reference for keeping transformation rules explicit rather than embedding policy in consumers.
