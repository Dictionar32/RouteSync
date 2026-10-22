# Phase 1363 — Upstream Contract Closure and Operation Identity Consumption

## Findings

The following upstream declarations have no production consumer in the traced core, CLI, SDK, React, and ecommerce-example source trees:

- `ValidationRuleDefinition` — the active canonical validation path is `CanonicalRouteValidationRuleEntry` → `RouteSemanticFlowValidationRuleSet` → `RequestField.validation` (`ValidationRuleNode` ADT). Keep this declaration unchanged; do not add a second validation authority.
- `ControllerExpressionFact` — no consumer is demonstrated. Keep it unchanged until a distinct semantic fact is required beyond the existing controller variable-flow and expression/dataflow contracts.
- `ExpressionDefinition` — no consumer is demonstrated. Its expression/source tuple may overlap existing AST provenance. Keep it unchanged pending a concrete need.
- `SchemaRelationTarget` — no consumer is demonstrated. The active relation path uses `SchemaRelationInterface` / `SchemaRelationIndexInterface` and projects structural relations into graph edges. Do not create a parallel target authority without evidence of a missing identity.

These are **unconsumed candidates**, not automatically dead declarations. Public API compatibility and downstream consumers outside this repository cannot be disproved by an internal source search. No declaration was deleted, emptied, or artificially wired.

## Operation identity trace

`OperationIdentityCapabilityRuntimeAlgebraInterface` → `operationIdentityCapabilityAlgebra.fromRoute` → `operationIdentityCapabilityAuthority` → `operationIdentityProjection` → manifest/SDK `OperationIdentityReference` → SDK `defineApi` `$key` / `$queryKey`.

`RouteDefinition.operationIdentity` is already typed as `OperationIdentityReference`. After the missing-identity guard, the SDK consumer now uses the narrowed property directly rather than asserting `as OperationIdentityReference`. This removes a redundant type escape without introducing another runtime classifier.

React's `ClosedHookKind` similarly reads `hookKind` from the closed `$def` contract. CLI serializes the upstream capability rather than rebuilding operation identity from method/path names. The schema/validation/graph/IR ownership boundaries from Phases 1361–1362 remain intact.

## Validation

Run `npm run audit:phase1363-upstream-contract-closure`. This is a static source audit. It is not a substitute for the full build or runtime tests; the workspace does not contain local `node_modules/tsdown`, and the declared TypeScript 7.0.2 toolchain has not been verified here.
