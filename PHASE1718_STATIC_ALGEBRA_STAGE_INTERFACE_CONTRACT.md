# RouteSync Phase 1718 — Static Algebra Stage Interface Contract

Date: 2026-10-12

## Purpose

This phase evolves the upstream static-invocation algebra contract before implementation or scanner wiring. Phase 1717 had a single broad `derive({ knowledge, subject })` boundary. That left internal ownership between target resolution, argument binding, effect projection, and proof assembly underspecified, and it provided no typed algebra result for an invalid/missing source subject.

## Trace and correction

Primary files:

- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`
- `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`
- `packages/core/src/index.ts`

The static algebra contract is now version 2 and declares separately owned interfaces for:

1. `InvocationStaticSubjectPresenceInterface` — returns a typed present/rejected result; an invalid subject is not fabricated into an incomplete semantic judgment.
2. `InvocationStaticPositionalEvidenceInterface` — returns a typed confirmed/unavailable positional-evidence result.
3. `InvocationStaticTargetResolutionAlgebraInterface` — resolves the static class/operation pair to the existing target-resolution ADT.
4. `InvocationStaticArgumentBindingAlgebraInterface` — consumes the already-derived target judgment and typed positional evidence; it does not receive broad knowledge for re-resolving the target.
5. `InvocationStaticEffectProjectionAlgebraInterface` — consumes the existing target judgment, preventing effect projection from selecting a different callable.
6. `InvocationStaticJudgmentAssemblyInterface` — consumes completed subjudgments and assembles the aggregate judgment/proof without re-deriving earlier stages.

`InvocationStaticSemanticAlgebraInterface` composes these stage interfaces. Its result is a typed `InvocationStaticSemanticAlgebraResult`: either a derived candidate judgment or a typed input rejection. A derived candidate is still not authoritative until the separate authority validator accepts it.

The Laravel scanner boundary advances to version 8 and explicitly prohibits implementing/inlining the static rule stages or taking over their semantic reasoning. No production scanner wiring was changed, and no static algebra or authority runtime implementation is claimed.

## Contract version synchronization

- Static algebra contract: 2
- Aggregate static judgment contract: 9
- Static judgment model contract: 13
- Invocation coverage contract: 13
- Invocation pipeline contract: 26
- Laravel controller scanner invocation boundary: 8

Public exports were added for the stage input/result/interface types through `packages/core/src/index.ts`. Rolling audit assertions for Phase 1702–1717 were updated to check the latest contract versions and the typed algebra result.

## Verification

- Phase 1718 audit: **17/17 PASS**.
- Regression audits Phase 1702–1718: **257/257 PASS** across 17 audit scripts.
- Targeted strict TypeScript check: exit 2 because of **34 diagnostics in unrelated existing modules**; **zero diagnostics** mention either changed interface file.
- Full package build: not run.
- Production static algebra implementation, authority validator, and scanner wiring: not implemented in this phase.

Run this phase's audit with:

```sh
npm run audit:phase1718-static-algebra-stage-interface-contract
```

## Architecture rule retained

`Source evidence → Typed semantic knowledge → Closed judgment contract → Rule-owned algebra stages → Authority validation → Wiring → Runtime projection`

The scanner remains source-evidence collection and delegation only. `core/src/semantic/foundation` is not used.
