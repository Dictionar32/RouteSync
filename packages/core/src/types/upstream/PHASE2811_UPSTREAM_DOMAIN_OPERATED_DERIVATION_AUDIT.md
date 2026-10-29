# Phase 2811 — Upstream Domain-Operated RequestType Derivation

## Purpose

Phase 2810 put continuation behavior on the downstream lowering ADT, but the upstream `RequestTypeDerivationRuntimeExecutionResult` still carried semantic outcomes as data only. That forced the lowering authority to enumerate every upstream semantic result kind again.

This phase evolves the existing upstream contract instead of introducing a second semantic authority or generic visitor.

## Runtime trace

```text
CLI scan / sync
  -> manifest scan operation
  -> request-resolution preflight
  -> requestTypeDerivationOperationPreparationFactory.create(...).prepare(input)
  -> RequestTypeDerivationRuntimeExecutionResult
       -> continueForManifestProjection(handlers)
       -> RequestTypeDerivationManifestProjectionDisposition
  -> authority-backed lowering
       -> lowered | derivation_not_projectable
       -> each lowering variant owns continue(handlers)
  -> manifest projection composition
       -> manifest_projected | manifest_projection_blocked
       -> each composition variant owns continue(handlers)
  -> integrated manifest authority
  -> CLI validation / persistence
```

## Contract evolution

`packages/core/src/types/upstream/requestTypeDerivationInterface.ts` now defines:

- `RequestTypeDerivationRuntimeExecutionResultData`: the closed semantic outcome data without executable operations, suitable for preserving evidence in downstream artifacts.
- `RequestTypeDerivationRuntimeExecutionResult`: the same explicit semantic variants, each augmented with `continueForManifestProjection(...)`.
- `RequestTypeDerivationRuntimeExecutionOutcomeHandlers`: a concrete, non-generic handler contract.
- `RequestTypeDerivationManifestProjectionDisposition`: the two domain-specific outcomes `request_type_derivation_projectable` and `request_type_derivation_not_projectable`.

The operation is specific to RequestType manifest projection. It is not a generic `Result<T>`, generic visitor, or reasoning primitive. The preparation factory attaches the operation to every projected and blocked runtime result.

## Downstream effect

`routeManifestTypeLoweringAuthority.ts` now calls `derivation.continueForManifestProjection(...)` instead of switching over `projected`, `incomplete`, `conflict`, `input_rejected`, verification failures, and integrity failures itself. It exhaustively eliminates only the two domain dispositions. The distinction between the full semantic authority outcomes remains intact in the upstream operation and evidence.

Manifest composition still consumes the lowering ADT through its own `continue(...)` operation. Projection and integrated authority continue to reuse existing result contracts rather than renaming them into duplicate unions.

## Upstream contract policy

The existing `RequestTypeDerivationRuntimeExecutionResult` remains the canonical semantic contract. No duplicate upstream authority contract was added. The package entrypoint exports the new types. `packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Verification

Run:

```bash
npm run audit:phase2811-upstream-domain-operated-derivation
```

The audit checks the contract shape, result construction, lowering integration, explicit ADT variants, non-generic handlers, interface-first runtime factory, and empty `collections.ts`. This structural audit is not a substitute for full TypeScript typechecking, production build, the complete test suite, or CLI `scan`/`sync` end-to-end execution.

## Why one exhaustive disposition elimination remains

The upstream operation must not import a downstream `RouteManifestProjectionCompositionResult`, and the implementation must not introduce a generic handler return type merely to make arbitrary downstream values flow through upstream. The remaining two-variant exhaustive elimination is therefore over the explicit projectability disposition at the lowering boundary, not over all semantic authority result kinds. It preserves layering and compile-time exhaustiveness while removing semantic reclassification from the lowerer.
