# Phase 1938 — Controller Semantic Expression/Evidence Binding (Interface First)

## Trace finding

The source-payload projector derived the canonical `Expression` and independently adapted the same PHP AST value into syntax-neutral `ControllerVariableSemanticEvidence`. The upstream closed judgment retained the reduced evidence and `expressionValue`, but not the exact canonical `Expression` that the definition stores. This left the relationship between the source expression and its semantic-resolution judgment implicit in the projector's call site.

## Interface-first correction

- `ControllerVariableSemanticResolutionRequest` now carries `sourceExpression: Expression`.
- Every closed `ControllerVariableSemanticJudgment` outcome retains that exact `sourceExpression` reference, including unresolved and contract-violation outcomes.
- The PHP source adapter accepts the canonical expression as a typed field and forwards it without semantic interpretation.
- The definition projection authority supplies the exact `Expression` it just derived from the matched payload to the semantic-resolution adapter.
- The existing upstream semantic authority and runtime executor preserve the request expression; neither reconstructs it from `expressionValue`.
- The semantic-resolution adapter contract advances to version 2. The controller dataflow authority, model, and Laravel scanner contracts are synchronized to versions 12, 10, and 100.

## Ownership

Laravel scanner remains evidence collection and wiring. The existing upstream controller variable semantic authority remains the sole semantic rule owner. The exact source `Expression`, syntax-neutral evidence, and `expressionValue` remain distinct domain representations; the judgment now explicitly retains their expression-evidence relationship without replacing one representation with another.

## Validation

Run `npm run audit:phase1938-controller-semantic-expression-evidence-binding-interface-first`. Related phase 1930–1937 static audits were updated to recognize the current contract versions. TypeScript build and full tests were not run as part of this phase.
