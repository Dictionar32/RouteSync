# RouteSync Phase 504 — Validation Relational Cutover

## Objective

Move the validation scanner/resolver boundary from host-language control flow and sentinel semantics toward declarative semantic relations, candidate selection, recursive relation closure, and canonical semantic construction.

## Research synthesis

The design follows the strongest recurring ideas found in Statix/Scope Graphs, Rascal analysis and rewriting, MLIR PDLL/PDL declarative pattern rewriting, Flix-style relational fixed points, and egglog's combination of Datalog with equality saturation.

- Statix models static semantics as constraints and name binding as scope graphs with relational declarations and queries.
- Rascal separates extracted facts from enrichment, transitive closure, constraint solving, and rewrite-oriented synthesis.
- MLIR PDLL/PDL treats matching and rewriting as declarative pattern infrastructure.
- Flix treats relations and fixed-point computation as first-class analysis machinery.
- egglog combines relational deduction with equality saturation.

## Phase 504 changes

Closed surfaces:

- `subscanners/form-request/canonicalValidationRuleEntry.ts`
- `subscanners/form-request/validationFieldAssembler.ts`

Key migration:

1. Validation rule recognition uses relation predicates and first-option witnesses.
2. Semantic type classification is relation-gated rather than imperative dispatch.
3. Presence classification is a relation over validation-rule facts.
4. Wildcard/path resolution uses recursive relation sequence operations.
5. Nested validation shape construction is recursive relation closure.
6. Root-field aggregation uses relation folding and explicit relation options.
7. Property merging uses relational lookup/index selection and projection.
8. Requirement resolution uses candidate relations and explicit absence/presence.
9. Validation tree construction uses relation projection and gated semantic construction.
10. Runtime absence is not represented by a forbidden sentinel in the closed surfaces.

## Audit

Command:

`npm run audit:scanner-lexer:phase504`

Result:

`closedSurfaceClean: true`

Both Phase 504 surfaces report zero occurrences for the forbidden control/absence/operator categories.

## Remaining frontier

The largest remaining scanner/resolver surfaces after Phase 504 are:

1. `descriptors/request/controllerExpressionContract.ts`
2. `subscanners/resource/resourceFieldProducer.ts`
3. `descriptors/validation/validationRuleEntry.ts`
4. `descriptors/manifest/resourceRouteGroupDescriptor.ts`
5. `subscanners/controller/responseAttributeScanner.ts`
6. `subscanners/resource/resourceUpstreamExpressionCanonical.ts`
7. `orchestrator/sourceAstScanner.ts`
8. `subscanners/form-request/ruleCollector.ts`
9. `subscanners/resource/resourceAstExpressionMapper.ts`
10. `descriptors/request/controllerActionContract.ts`

The next high-value boundary is `controllerExpressionContract.ts`, followed by `resourceFieldProducer.ts`.
