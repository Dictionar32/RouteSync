# Phase 2128 — Canonical Resource-Binding Knowledge

## Trace finding

Phase 2127 explicitly marked `resourceBindings` as projection remainder, but the existing source path already delegates each resource candidate to `ControllerResourceBindingAuthorityInterface`. The downstream controller scanner then read `contract.dataflow.resourceBindings`, causing a closed upstream semantic product to be consumed through the legacy projection.

## Change

- Evolved `LaravelControllerActionSemanticKnowledge` to publish the existing canonical `ControllerResourceBinding` domain type.
- Advanced the action semantic judgment contract to version 5 and updated its coverage ADT.
- Adapted the already-closed resource-binding products into canonical `ControllerResourceBinding` values while retaining the exact invocation source file and source offsets.
- Changed the scanner's resource-binding artifact projection to consume `semantic.resourceBindings`; it no longer reaches through `projection.dataflow.resourceBindings`.
- Preserved the existing `ControllerResourceBindingAuthorityInterface`, invocation judgment, integrated response pipeline, and forwarding-only runtime executor.

## Remaining debt

This does **not** retire `resolveControllerActionContract()`. Request binding, body, general dataflow, and schema still cross the action boundary in the legacy projection. The production action adapter still calls `scanControllerAction()`. Those responsibilities must be migrated to existing typed upstream authorities one by one; moving the resolver is not a valid substitute.

## Validation

Run `node scripts/audits/audit-phase2128-canonical-resource-binding-knowledge.cjs` and the previous phase audits. This phase does not claim a successful monorepo build or typecheck.
