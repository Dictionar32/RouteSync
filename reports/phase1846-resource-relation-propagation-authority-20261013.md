# Phase 1846 — Resource Relation Propagation Authority

## Scope

This phase continues from Phase 1845 and strengthens the upstream resource-model binding authority. It does not add a second authority or move semantic classification into the resource scanner.

## Trace finding

The production resource scanner already preserves source-derived resource relation edges and passes the complete `LaravelControllerScanJudgment` to the authority. However, the authority only used controller-return evidence and naming convention evidence, leaving relation edges as a reason for unresolved outcomes rather than a candidate-producing semantic premise.

## Changes

- Added relation-propagation evidence in `packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts`.
- Relation propagation requires a source relation edge from the resource under judgment, a child resource whose conventional model matches a canonical model definition, and a canonical relation on the parent model whose relation name and target model match that edge.
- Enforced candidate source precedence: `controller_dataflow` → `relation_propagation` → `convention` → `structural`.
- Only candidates with evidence at the highest available precedence participate in the final judgment; multiple candidates at that same precedence remain explicitly ambiguous.
- Advanced the resource scanner contract and Laravel scanner semantic judgment contract to version 5.
- Updated Phase 1836/1845 audits to reflect the current contract version and added the Phase 1846 static audit.

## Validation

Static audit scripts and JSON/package metadata checks are used. Build, typecheck, and E2E are intentionally not run in this environment.

## Remaining work

The relation propagation rule currently uses the child resource's naming convention to seed its model candidate, then validates that candidate against the parent model's canonical relation definition. It does not yet compute a graph-wide fixed point across mutually dependent resource/model bindings. A later phase should make that dependency explicit in an upstream batch judgment interface if real source cases require it, while preserving source provenance and explicit ambiguity.
