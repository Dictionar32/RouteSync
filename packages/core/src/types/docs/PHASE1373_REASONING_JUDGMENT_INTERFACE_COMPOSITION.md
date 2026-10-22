# Phase 1373 — Reasoning Judgment Interface Composition

## Trace

`SemanticDataflowInput -> SemanticDataflowReasoningAuthorityInterface -> SemanticDataflowJudgment -> DataFlowAuthorityInterface -> analysis/IR/policy consumers`

The executable dataflow authority was already injected into runtime adapters, but its `judge` method was redeclared locally instead of specializing the generic `SemanticReasoningJudgmentInterface` in `semanticReasoning.ts`.

## Change

`SemanticDataflowReasoningAuthorityInterface` now extends `SemanticReasoningJudgmentInterface<SemanticDataflowInput, SemanticDataflowJudgment>`. It keeps its domain-specific `kind` and `authority: 'upstream'` markers. The implementation binding remains in `semanticDataflowAuthority.ts`; the concrete runtime composition remains in `semanticDataflowRuntimeComposition.ts`.

This is interface composition, not a new solver. `SemanticDataflowInput` and `SemanticDataflowJudgment` remain the canonical ADTs. `DataFlowAuthorityInterface` is the runtime consumer surface for the already-closed judgment; producer execution remains a separate contract. AST syntax, semantic dataflow, structural graph relations, and IR projections are not collapsed into one model.

## Validation

The Phase 1373 audit checks the shared judgment interface, domain contract specialization, concrete binding location, runtime adapter dependency, AST ADT aliases, operation identity algebra, manifest/graph/IR projections, and React/SDK/CLI consumers. It also verifies that package version `1.0.49` and the `tsdown` build script remain unchanged.

A static audit does not prove TypeScript compilation or runtime tests. Those must be run separately with project dependencies installed.
