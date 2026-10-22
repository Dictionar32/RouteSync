# Phase 2056 — Controller Model-Origin Closed Judgment Interface First

## Trace finding

`controllerDataflowContract.ts` projected a static-call AST node into `ControllerStaticCallOriginInput`, immediately invoked `controllerStaticCallOriginAuthority`, then embedded the nested judgment in `ControllerResourceModelOriginEvidence`. `controllerResourceBindingAuthority` interpreted that judgment again and separately derived an unresolved reason. This split semantic orchestration across scanner wiring and the resource authority, and model origin was represented internally as `ControllerModelOrigin | undefined`.

## Change

- `ControllerResourceModelOriginEvidence` now carries `static_call_origin_input`, not a precomputed nested static-call judgment.
- The existing `ControllerResourceBindingAuthorityInterface` exposes `judgeModelOrigin`, returning the closed ADT `resolved | missing | unresolved`.
- The existing resource authority composes `controllerStaticCallOriginAuthority` from typed input evidence, then closes its result into a model-origin judgment.
- Resource-binding judgment consumes that closed judgment once and preserves the distinction between missing variable semantics and unresolved origin evidence.
- Contract version advanced from 4 to 5.
- The scanner now only projects AST shape into typed input evidence; it no longer calls `controllerStaticCallOriginAuthority` directly.

## Preserved boundaries

- No new authority was introduced: the existing resource-binding authority remains the sole owner of resource/model/response correlation.
- The static-call origin authority remains the owner of DB-table versus class-model origin semantics; it is composed upstream, not duplicated.
- Invocation judgment, integrated response pipeline, response-attribute authority, and AST rule algebra remain unchanged.
- No `relation/foundation` subscanner was added.

## Verification scope

The phase audit checks evidence ownership, closed model-origin judgment, authority composition, scanner purity, prior-phase audit compatibility, and archive structure. Parser-only checks are not full typechecking. Build, full TypeScript typecheck, and Vitest must not be claimed unless actually run.
