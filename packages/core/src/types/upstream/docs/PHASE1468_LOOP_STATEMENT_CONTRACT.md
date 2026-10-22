# Phase 1468 — Loop Statement Contract Extraction

This phase moves the structural and header reasoning for PHP `foreach`, `for`, and `while` out of `astClassifierRuntime.ts` and into the typed upstream contract/algebra pair.

Flow: source tokens → `ScannerLoopStatementQuery` → `scannerLoopStatementContractAlgebra` → closed `resolved | not_applicable | malformed` judgment → AST projection.

The algebra owns opening/closing delimiter evidence, body partitioning, exact three-clause partitioning for `for`, and `foreach`'s top-level `as` and iteration-target interpretation. Runtime retains only AST-specific projection: expression classification, identifier construction, block parsing, and `PhpAstFactory` calls.

The contract is generic over token type and requires token-value/kind evidence and the shared `ScannerTokenStructureInterface`; it does not depend on `TokenDescriptor` or construct AST nodes.

Validation: run `node scripts/audits/audit-phase1468-loop-statement-contract.cjs` and the focused Vitest file `scannerLoopStatementAlgebra.phase1468.test.ts`. Full workspace compilation is not claimed unless project dependencies and the configured TypeScript version are available.
