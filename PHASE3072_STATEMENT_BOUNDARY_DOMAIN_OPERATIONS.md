# Phase 3072 — Statement Boundary Domain Operations

## Goal

Continue the actual upstream scanner path after Phase 3071. This phase migrates `packages/core/src/types/upstream/scannerStatementBoundaryAlgebra.ts`, which still used generic `continueWith<Result>` callbacks for delimiter classification, terminator position, cursor validity, and compatibility projection.

## Implementation

- Replaced generic `DelimiterLookup` callback continuations with a closed `DelimiterJudgment` union: `opener`, `closer`, or `ordinary`.
- Replaced generic `TerminatorPosition` continuation with `StatementPositionJudgment`, distinguishing a top-level terminator from an ordinary position.
- Removed `BoundaryProjection` and its generic handler bundle. The canonical `StatementBoundaryJudgment` is translated by the domain-specific `toCompatibilityResolution` operation.
- Replaced `StartCursorJudgment.continueWith<Result>` with `toStatementBoundaryResolution(input)`, an operation owned by the cursor-validity judgment.
- Kept `scannerStatementBoundaryContractAlgebra` and the legacy `scannerStatementBoundaryAlgebra` as `export const` objects typed by their public interfaces.
- Preserved existing malformed outcomes and evidence semantics for unexpected, mismatched, and unclosed delimiters.

## Runtime trace

`PHP source tokens → astClassifierRuntime → scannerStatementBoundaryContractAlgebra.resolve → typed statement-position/delimiter judgments → terminator/end/malformed judgment → compatibility facade for legacy scanner consumers → AST/runtime consumers → existing CLI manifest composition path`.

The historical compatibility facade still exposes cursor indices and delimiter-state counters. This phase does not remove those primitive compatibility fields because that would require migrating consumers and public contracts. No generic relation foundation was restored.

## Verification

The Phase 3072 audit includes 17 structural/runtime checks, TypeScript syntax transpilation, and regressions for Phases 3071, 3070, and 3069. Focused runtime fixtures cover nested semicolons, unexpected closers, mismatched closers, unclosed delimiters, and invalid cursor starts.

Whole-program strict TypeScript, Vitest, and a full PHP → CLI → manifest/IR fixture are not claimed. The workspace does not have an installed Vitest binary. Syntax transpilation and focused fixtures do not establish whole-program type correctness.

## Remaining work

- Migrate consumers off the legacy cursor/index compatibility facade before removing primitive cursor fields.
- Audit the source-project identity boundary and the actual CLI-to-manifest path for remaining generic continuation and data-loss risks.
- Keep parser traversal mechanics separate from semantic knowledge; do not mechanically erase necessary traversal branching.
