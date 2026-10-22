# Phase 1451 — statement-boundary algebra contract

## Migration boundary

Phase 1450 established `ScannerStatementBoundaryInterface` first. This phase makes
`scannerStatementBoundaryContractAlgebra` its canonical implementation and moves
all delimiter-stack reasoning into that implementation.

The canonical query receives only the token suffix for the candidate statement.
Its closed judgment is partition-based:

- `terminator`: `statement`, `terminator`, `remaining`;
- `end_of_input`: `statement`;
- `malformed`: typed source `location`, optional `expected`, `actual`, and a closed
  malformed reason.

No cursor index or delimiter counters escape through the canonical contract.
The legacy `scannerStatementBoundaryAlgebra` remains temporarily for compatibility,
but it slices at the caller's cursor, delegates to the canonical contract, and
projects the judgment back to the old index shape. It contains no delimiter scan.

## Deliberately not migrated in this phase

`scannerStatementSequenceAlgebra.ts` and `compiler/scanner/lexer/astClassifierRuntime.ts`
remain unchanged. The next phase should migrate sequence wiring to consume partition
judgments directly. Only after that wiring is verified should runtime call sites be
simplified and downstream AST output verified.

## Required order

1. Define the public interface (Phase 1450).
2. Enforce it in the algebra (Phase 1451, this phase).
3. Migrate sequence wiring to partition judgments (next phase).
4. Simplify runtime adapters after wiring no longer depends on the legacy facade.
5. Verify downstream AST/statement behavior and build.

## Validation boundary

The phase audit checks that the canonical algebra implements the public interface,
that malformed results preserve source evidence, that the compatibility facade
only delegates, and that sequence/runtime wiring has not been changed prematurely.
