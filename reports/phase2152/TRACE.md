# Phase 2152 Trace

**Scope:** interface-first audit of the canonical Laravel action request judgment, invocation correlation, integrated response pipeline, and route request projection.

## Findings

- Canonical action judgment derives request through `laravelControllerRequestSemanticBindingAuthority`.
- The action executor forwards the completed judgment unchanged.
- The per-action judgment is transient: the published `LaravelControllerScanArtifact` carries action projections but not the canonical per-action judgments.
- Route scanner passes only `controller.actions` into route binding. Route boundaries are built first from route emissions and controller-reference targets begin with `no_request`.
- The route producer correctly projects typed/unresolved request variants when they are actually present, but cannot reconstruct a judgment discarded upstream.
- Invocation-correlated integrated response remains a separate action/controller response path and is not the missing request publication link.

## Verdict

Audit is source-trace only. `typed_request_binding_projection_loss` remains OPEN. Do not claim end-to-end closure. No `relation`/`foundation` authority or new subscanner was introduced. Next code change must evolve the existing controller scan artifact and route boundary input contract so a total, source-correlated action judgment is published and consumed; route producer remains projection-only.

## Validation

- `node scripts/audits/audit-phase2152-canonical-action-route-judgment-trace.cjs`: 9/9.
- No full build, typecheck, or Vitest was run.
