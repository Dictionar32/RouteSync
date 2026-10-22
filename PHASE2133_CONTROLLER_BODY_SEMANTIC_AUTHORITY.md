# Phase 2133 — Controller Body Semantic Authority

## Interface-first change

Introduced `ControllerBodySemanticJudgmentAuthorityInterface` in `packages/core/src/types/upstream/controllerBodySemanticJudgmentInterface.ts`. Its completed judgment is source-correlated and publishes canonical `SourceStatements`, a schema payload, and domain `HttpErrorResponseDescriptor` values.

The existing canonical controller AST boundary now implements `controllerBodySemanticJudgmentAuthority`. `resolveControllerActionContract` invokes it once and retains the resulting `bodySemanticJudgment`; action semantic publication consumes that retained judgment rather than rebuilding source statements and copying error descriptors in the wiring adapter.

## Why this is more than a file move

The change introduces a typed, discriminated, source-correlated semantic judgment as the boundary between body evidence and action publication. The action contract retains the exact judgment, and downstream publication consumes the closed value. Existing body-rule extraction runs once; the judgment authority consumes its resolved result and closes the source statements without repeating body-rule derivation.

## Preserved invariants

- Invocation judgment remains attached by identity to the completed action judgment.
- Controller-wide integrated response remains owned by the response semantic pipeline.
- Runtime executor remains a pass-through of the completed action judgment.
- No `relation/foundation` or `semantic/foundation` layer was added.

## Remaining debt

This does not retire `resolveControllerActionContract` or the legacy `ControllerActionContract` projection. Request-aware schema derivation still runs in the legacy action resolver, and the projection still carries raw body AST evidence. This phase closes the body-statement/error-response publication boundary only; it does not claim full upstream semantic derivation closure.

## Verification

Run `npm run audit:phase2132-canonical-body-semantic-knowledge-boundary` and `npm run audit:phase2133-controller-body-semantic-authority`.

No full build, project typecheck, or Vitest run is claimed by this phase.
