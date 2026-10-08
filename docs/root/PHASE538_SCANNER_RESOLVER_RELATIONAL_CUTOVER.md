# Phase 538 — Scanner/Resolver Relational Cutover

This phase continues the active scanner/lexer/resolver frontier after Phase 537.

## Targets

- `packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationProgram.ts`
- `packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts`

## Architecture

`scanner evidence -> semantic relation program -> relation constraints -> candidate/witness -> recursive closure -> canonical semantic authority -> solver/rewrite`

The semantic relation-program validator now represents relation-schema lookup and variable/polarity decisions through relation options and predicates rather than host-language absence/control constructs. Controller dataflow legacy compatibility projection similarly uses relation equality/gates for semantic decisions.

## Verification

- Phase 538 target audit: all forbidden surface counts are zero.
- Phase 538 target `transpileModule` diagnostics: zero.
- Phase 536 and Phase 537 audits are rerun as regression checks.
- Inactive-path vacuum remains unchanged; active scanner/resolver files are transformed rather than removed.
