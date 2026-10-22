# Phase 2340 — Existing Policy Authority Contract Closure

## Scope

This phase changes the existing upstream policy authority/executor contracts only. It does not claim runtime wiring or Laravel scanner integration is complete.

## Contract defect

`EffectiveControllerActionPolicySemanticAuthorityInterface` exposed both `judge(input)` and `algebra`. The algebra is a lower-level semantic mechanism; exposing it on the authority contract allows consumers to bypass the single closed judgment boundary and assemble partial results themselves. That contradicts the interface-first goal that downstream consumers receive one complete `EffectiveControllerActionPolicy` ADT.

## Change

- Evolved the existing `EffectiveControllerActionPolicySemanticAuthorityInterface` and `EffectiveControllerActionPolicyRuntimeExecutorInterface` to contract version 2.
- Removed `algebra` from the authority's public contract. The algebra interface remains available to its semantic implementation; it is no longer part of the authority-facing contract.
- Clarified that `judge` is the only semantic decision operation and returns the closed `complete | blocked` ADT.
- Clarified that executor preserves the authority result and must not classify, repair, or synthesize fallback products.
- Explicitly documented that this is a contract closure, not proof of wiring. `LaravelRouteScannerInterface` still exposes route-method and route-authorization authorities, but does not yet expose the effective controller-action policy authority/executor. The scanner wiring still calls the scanner-local resolver directly.

## Trace finding

Current path:

`CLI → source/AST pipeline → LaravelRouteScannerInterface.scan → scanner wiring → scanner-local effective policy resolver → RouteSemanticFlow → AST/manifest projections`

Parallel upstream path:

`highLevelSourceModel → resolveEffectiveControllerActionPolicyUpstream → source-model policy relations`

These paths still perform overlapping policy closure. This phase deliberately does not disguise that unresolved duplication as fixed. Next interface-first step is to evolve the existing `LaravelRouteScannerInterface` to consume the canonical policy authority and executor, then adapt the existing scanner-local input contract to the upstream policy input without introducing a parallel V2 contract.

## External semantic references

Laravel controller middleware supports class-level and method-scoped applicability through `only` and `except`; resource routes also support per-action middleware. Therefore scope must remain represented as typed policy evidence before a final policy judgment is emitted.

TypeScript's official handbook describes discriminated unions as a way to model alternatives with a shared discriminant. The `complete | blocked` policy ADT follows this principle: only `complete` exposes usable middleware and authorization products.

## Verification limits

Static contract audit only. Typecheck, Vitest, build, and CLI end-to-end were not run. `npm run build` was not run.
