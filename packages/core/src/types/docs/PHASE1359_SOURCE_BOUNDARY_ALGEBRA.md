# Phase 1359 — Canonical Source Boundary Algebra

## Change

`CanonicalSourceNode` and `SourceBoundaryInput` now cover the same 13 canonical source AST kinds, including `ChannelAst` / `channel_source`. The new `sourceBoundaryAlgebra.ts` is a closed, exhaustive representation projection between those two views.

## Authority rule

The algebra consumes an already classified `CanonicalSourceNode`. It does not parse PHP, inspect source text, infer Laravel semantics, reconstruct provenance, or create a second source model. It preserves the exact node reference. The `never` exhaustiveness check makes an added AST variant require a corresponding boundary mapping at compile time.

## Intended flow

`Laravel/PHP evidence → validated CompleteSourceAst → sourceBoundaryInputFromCanonicalNode → upstream boundary consumer`

This is a public upstream projection primitive for consumers that need the tagged source-boundary view; it is deliberately not inserted as an extra pass into the existing manifest path. The manifest builder already validates `CompleteSourceAst`, builds `CompleteLaravelSourceModel`, and projects dataflow inputs from that model. Existing semantic authorities continue to own manifest/dataflow/structural relations. Dataflow closure remains owned by the DataFlow authority; structural relations remain projected to `GraphEdgeRelation`; IR and CLI/SDK/React remain downstream projections.

## Why channel was added

The canonical AST schema already declares `channel_ast` and exports `ChannelAst`, while the prior `CanonicalSourceNode` and `SourceBoundaryInput` omitted it. That meant the boundary vocabulary did not cover the entire canonical AST union. Adding the missing variant closes that type-level gap without introducing a new semantic capability.

## Contract inventory impact

The symbol-aware follow-up audit now resolves the new algebra references: `CanonicalSourceNode` and `SourceBoundaryInput` no longer remain in the unconsumed-only subset. The audited public-surface candidate set therefore falls from 31 to 29, while the Phase 1354 upstream candidate inventory falls from 394 to 392. This is an evidence-backed inventory change, not deletion of contracts.

## Validation

Run `npm run audit:phase1359-source-boundary-algebra`. This is a static contract audit, not a full build. The repository declares TypeScript 7.0.2; no TS7 build claim should be made unless that pinned toolchain is actually available and runs successfully.

## Research basis

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic analyses should depend on stable interfaces rather than duplicate operation-specific semantic knowledge.
- CodeQL JavaScript/TypeScript data flow: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/ — AST nodes and data-flow nodes are related but distinct representations.
- TypeScript Compiler API: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API — the compiler's AST, symbols, checker and diagnostics are separate compiler stages; audits should use the actual pinned compiler before making compatibility claims.
