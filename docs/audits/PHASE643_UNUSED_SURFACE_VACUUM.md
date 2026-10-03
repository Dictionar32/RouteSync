# Phase 643 — Unused Surface Vacuum

## Scope
Conservative dead-surface vacuum after Phase 642.

## Proven candidates
- `packages/core/src/compiler/ir/ContractIRTypeBuilder.ts`
  - Non-empty production file.
  - No active production imports/references were found.
  - Its only repository reference was its stale unit test.
  - The barrel `packages/core/src/compiler/ir/index.ts` does not export it.
  - It therefore does not participate in the active compiler graph.
- `packages/core/src/compiler/ir/__tests__/ContractIRTypeBuilder.test.ts`
  - Only referenced the now-dead `ContractIRTypeBuilder` surface.
  - The test expected a class constructor that the production file does not provide, so it is not a valid active contract test.

Both paths were preserved and truncated to 0 bytes. No file was deleted.

## Non-candidates
Active scanner/lexer, AST/upstream, graph resolver, semantic analysis, and type-lowering files were not vacuumed merely because they contain host-language constructs or names such as `legacy`.

Source-language evidence such as PHP/Laravel `null`, `??`, ternary, or route `any` remains representational evidence until a semantic relation replaces its authority.

## Architectural basis
The target architecture is relation facts -> constraints -> recursive/SCC fixed point -> witness/provenance -> declarative rewrite -> canonical Route IR -> target dialect lowering. This follows the useful separation seen in MLIR canonicalization/rewrite infrastructure and circular/reference attribute grammar evaluation.
