# Phase 1463 — Token Structure Interface Boundary

## Scope

This phase is interface-only. It separates the public token-structure evidence and consumer contract from the implementation algebra. It does not implement match-expression reasoning, change scanner runtime wiring, or alter AST projection.

## Boundary

- `scannerTokenStructureInterface.ts` owns public token evidence, closed structural judgments, query shapes, and `ScannerTokenStructureInterface`.
- `scannerTokenStructureAlgebra.ts` owns cursor-based delimiter validation and top-level search algorithms. It imports the contract and re-exports its public types for compatibility with existing consumers.
- `scannerMatchExpressionInterface.ts` depends on the dedicated token-structure contract rather than reaching into the algebra module to obtain the interface type.
- `scannerTokenStructureAlgebra.ts` continues to export `scannerTokenStructureInterface`, the concrete consumer-facing authority backed by the algebra.

## Invariants for the next algebra phase

1. A match algebra must use the injected `ScannerTokenStructureInterface` for structural evidence.
2. It must not duplicate delimiter-depth traversal or top-level partition scanning.
3. Resolved match evidence must retain token partitions, condition separators, arm separators, and trailing tokens.
4. Source malformedness and violation of a resolved-output invariant remain distinct judgment variants.
5. Runtime wiring remains unchanged until these obligations are implemented and tested.

## Verification boundary

This phase audits module ownership and import direction only. It does not claim semantic match parsing, runtime migration, AST correctness, or a full package build.
