# Phase 3054 — Semantic Validation Outcome ADT

## Intent

Replace a `void`-returning semantic knowledge validation contract with an explicit typed domain outcome. Validation results are now data that can be continued through a domain operation rather than an invisible side effect.

## Changes

- `SemanticKnowledgeDataFlowValidation` distinguishes `valid` and `invalid` outcomes.
- `SemanticKnowledgeDataFlowViolation` enumerates five known invariant failures: duplicate fact identity, unknown flow endpoint, self-reference, unknown guard predicate, and unsupported derived relation.
- `SemanticKnowledgeDataFlowWiringInterface.validate` returns the ADT instead of `void`.
- `continueAfterValidation` owns the compatibility continuation: valid data-flow proceeds; invalid data-flow raises a diagnostic based on the first typed violation.
- The PHP AST semantic producer consumes the outcome through `semanticKnowledgeDataFlowWiring.continueAfterValidation(...)`.

## Preserved constraints

- No deleted relation foundation was restored.
- `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
- The validation result retains the complete original data-flow model in both outcome branches.

## Verification and limitations

- Phase 3054 structural audit: run `npm run audit:phase3054-semantic-validation-outcome-adt`.
- Phase 3053 regression audit: run `node scripts/audits/audit-phase3053-runtime-relation-import-ownership.cjs`.
- Strict TypeScript dependency-closure check was attempted and remains blocked by existing missing imports to deleted `packages/core/src/semantic/relations/*` modules, a non-module `collections.ts` invariant, and pre-existing downstream type errors. This phase does not claim the full runtime path is build-clean.
- End-to-end CLI → manifest was not run.

## Next migration frontier

The remaining runtime migration must be performed by domain ownership. The Phase 3053 audit still identifies direct imports in the PHP AST adapter, semantic evidence compiler, versioned-state data-flow relations, relation store, and relational sequence. Do not recreate a generic relation foundation to silence those errors.
