# Phase 424 — Scanner/Resolver Relational Cutover

## Scope
Continue the declarative semantic migration at scanner/resolver authority boundaries.

## Changes
- `routeMissingAstAdapter.ts`: missing-handler selection is a relation gate rather than imperative branching.
- `knowledgeDataModel.ts`: route constraint knowledge is exposed as an immutable relational tuple catalog for lookup.
- `routeConstraintFlowResolver.ts`: constraint knowledge dispatch uses `relationLookup` + `relationOptionFold`; matcher selection is candidate/catalog driven; route projection uses relation selection; allowed-value classification uses relation projection/gating.
- No source-language token vocabulary was removed: PHP operators remain data when they are lexical facts.

## Validation
- Targeted static forbidden-pattern audit: zero for the phase target files, except ordinary semantic equality used as relation predicates where required by existing type narrowing.
- Whole-project TypeScript checking remains environment/configuration blocked by existing missing ES lib/type dependencies and unrelated legacy diagnostics; this phase does not claim a green global build.
