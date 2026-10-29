# Phase 3055 — Upstream Semantic Validation Domain Ownership

## Objective

Move semantic knowledge/data-flow invariant validation into `packages/core/src/types/upstream`, so the canonical domain owns the validation ADT and operation rather than the PHP AST compatibility facade.

## Implementation

- Added `semanticDataflowKnowledgeValidation.ts`.
- Added the closed `SemanticKnowledgeDataFlowValidationViolation` ADT for duplicate identity, unknown flow endpoint, self-reference, unknown guard predicate, and unsupported derived relation.
- Added `SemanticKnowledgeDataFlowValidationOutcome` with `valid` and `invalid` cases; validation does not return `void`.
- Added `SemanticKnowledgeDataFlowValidationOperationsInterface` and `semanticKnowledgeDataFlowValidationOperations: Interface = Object.freeze({...})`.
- Identity validation now carries `KnowledgeId` witnesses and calls `semanticKnowledgeIdOperations.same`; the validator no longer derives string keys to make identity decisions.
- Exported the operation through `types/upstream/index.ts`.
- Kept `semanticKnowledgeDataFlowRelations.ts` as a compatibility facade: it delegates to the upstream operation and preserves its scanner-only extension fields in the returned local outcome.
- Updated Phase 3054 regression audit and added Phase 3055 ownership audit.

## Verification

- Phase 3055 structural/domain ownership audit: 10/10 passed.
- Phase 3054 regression audit: 7/7 passed.
- Phase 3053 regression audit: passed.
- Phase 3049 regression audit: 10/10 passed.
- Strict TypeScript on `semanticDataflowKnowledgeValidation.ts` plus `semanticDataflowKnowledge.ts`: passed.
- `package.json` parse: passed.
- `packages/core/src/types/upstream/collections.ts`: remains exactly one newline byte.
- Deleted relation foundation files remain absent.

## Known blockers / honesty boundary

- Strict TypeScript over the frontend adapter dependency closure still fails with 773 diagnostics. The first errors include imports from deleted `packages/core/src/semantic/relations/*` modules, followed by dependent implicit-any errors. This phase does not repair that entire transitive closure.
- Full repository typecheck, full Vitest, and end-to-end CLI → manifest were not run.
- This phase does not claim that all `if`, `===`, primitive values, loops, maps, or string types have been eliminated. The remaining compatibility continuation still renders errors and throws on invalid input; that is a separate runtime-boundary migration.
- No deleted relation foundation was restored or recreated under another name.

## Runtime trace

`phpAstSemanticKnowledgeDataFlowProductionOperation.produce` constructs the scanner model → `validateSemanticKnowledgeDataFlow(model)` delegates to `semanticKnowledgeDataFlowValidationOperations.validate(model)` in `core/src/types/upstream` → compatibility facade preserves scanner-only `semanticRelations` / `semanticClosure` fields → `continueAfterValidation` retains existing caller behavior.

The next phase should model the rejected continuation as a typed runtime outcome and then migrate the remaining relation imports by true domain ownership, validating the real upstream → CLI → manifest path after each change.
