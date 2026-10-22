# Phase 2260 — Controller response-reference judgment authority

## Ownership change

The action-contract resolver no longer decides whether a controller response-reference attribute is absent or declared, and it no longer constructs the semantic response type name itself. It converts the parser's closed response-attribute variant into `ControllerActionResponseReferenceSourceEvidence` and delegates the judgment to the existing injected upstream authority contract.

- `ControllerActionResponseReferenceJudgmentInterface` defines the semantic boundary.
- `ControllerActionResponseReferenceSourceEvidence` is a closed ADT: `absent` or `declared` with a typed `ClassName`.
- `controllerActionResponseReferenceJudgmentAuthority` owns the resulting `ControllerResponseReferenceJudgment` construction.
- Production wiring and direct resolver tests supply the authority explicitly.

This authority concerns the per-action declared response reference only. It does not replace HTTP return semantics or the controller-wide integrated response pipeline.

## Verification

`node scripts/audits/audit-phase2260-response-reference-judgment-authority.cjs` passes 8/8 static source assertions.

No package build, TypeScript check, or Vitest run is claimed for this phase. The broader migration remains incomplete: `resolveControllerActionContract` still composes other semantic products, and the action execution wiring still imports that resolver. This phase retires one semantic decision from that resolver; it does not claim to retire the resolver or the subscanner tree.
