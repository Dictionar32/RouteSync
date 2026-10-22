# Phase 1987 — Integrated invocation/response AST projection interface first

## Trace finding

The controller artifact ADT already couples `invocationJudgment` and `responseJudgment`, and the response contract now has explicit complete/blocked/source-binding-rejected outcomes. However, the existing `LaravelControllerAstProjectionContext` accepted only an invocation judgment, and `LaravelControllerAstProjectionSemanticJudgment` returned only that invocation judgment. This creates a semantic drop at the AST projection boundary: response meaning is owned upstream but is not represented by the projection contract.

## Contract change

- Evolved the existing AST projection types in `laravelControllerInvocationSemanticJudgmentInterface.ts`; no parallel scanner or invocation authority was added.
- Added `LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>`, indexed by the exact invocation subtype and admitting both the normal response judgment ADT and the explicit rejected source-binding judgment.
- The semantic projection context now requires both `judgment` and `responseJudgment` as the two correlated values owned by the controller artifact.
- The projection result returns both values without widening the invocation subtype.
- The existing AST projection authority interface is generic over the same invocation subtype and explicitly forbids response reclassification/reconstruction.
- Exported the evolved context and projection response type from the public barrel.

## Intended chain

`Laravel invocation semantic authority -> closed invocation judgment + response semantic authority -> closed response judgment -> controller artifact ADT -> AST projection authority interface -> runtime projection executor -> downstream AST/IR projection`

The runtime executor is a consumer of the two closed judgments, not a third semantic authority. It must forward the exact response ADT that arrived on the artifact. Source-binding rejection remains a distinct outcome and must never become a complete response product.

## Explicitly not changed

- No `semantic/relations` or `semantic/foundation` layer or subscanner was added.
- No runtime implementation, parser, or scanner wiring was modified in this phase.
- No subscanner was deleted or emptied.
- No build, typecheck, or runtime test is claimed.

## Known migration gap

`packages/core/src/types/upstream/laravelControllerAstProjectionSemanticAuthority.ts` still implements the previous invocation-only projection shape. This is expected in an interface-first phase; runtime migration must happen only after the new contract is accepted and should forward the artifact-owned response judgment unchanged.

## Verification

Run `node scripts/audits/audit-phase1987-integrated-response-ast-projection-interface.cjs` from the RouteSync root. This is a structural audit only and does not prove TypeScript assignability or compilation.
