# Phase 1947 Interface-First Trace

## Existing path

`controllerVariableSemanticResolutionInputAdapter.ts` builds syntax-neutral evidence and passes the canonical source expression plus typed parameter bindings to the existing executor. The executor forwards the request to `controllerVariableSemanticAuthority`.

## Defect

`controllerVariableSemanticAuthority.ts` previously constructed a callback-based `SemanticDecisionContract`, where executable `applies` / `derive` callbacks carried the domain policy. Its parameter rule used first-match selection, which did not close duplicate parameter-binding ambiguity.

## Interface-first correction

The existing `ControllerVariableSemanticAuthorityInterface` now publishes `ControllerVariableSemanticReasoningContract`, a closed data-only ADT with an explicit rule order and cardinality policy. The authority implementation executes that contract's established domain semantics and publishes a closed judgment. Duplicate matching parameter bindings now produce `kind: 'ambiguous'` and `SemanticValue` reason `ambiguous`; no first candidate is chosen.

## Ownership after change

- AST adapter: collects syntax-neutral evidence.
- Reasoning contract: owns the declared semantic rule set and precedence.
- Existing upstream authority: executes the rule contract and emits the closed semantic judgment.
- Existing runtime executor: forwards the request to that authority.
- Laravel scanner: receives the closed judgment and does not repeat classification.
- Invocation semantic model: carries the judgment through existing definition, payload, and integrated-response composition.

A TypeScript `interface` declaration cannot execute runtime logic by itself. The architectural correction is that the *semantic reasoning interface is now a declarative rule contract*, while the existing upstream authority executes it; scanner/runtime wiring does not own or reclassify the rules.
