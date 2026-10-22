# Phase 2358 — Closed Standard Route Method Contract

## Audit and root cause

The upstream `LaravelRouteDeclarationMethodJudgment` already owns the semantic decision that maps a Laravel route declaration to its final HTTP method. However, the `standard` judgment arm still carried `targetMethods` copied from parser evidence, even though a standard declaration's final method is already resolved by `method` and `httpMethods`. This left irrelevant source evidence inside a supposedly closed semantic judgment and allowed the contract to imply that the target-method list mattered for standard declarations.

The `query` arm also expressed a single resolved method as an unrestricted `readonly HttpMethod[]`, which was weaker than the semantic fact it represents.

## Contract evolution

- Evolved the existing `LaravelRouteDeclarationMethodJudgment` ADT; no parallel interface or V2 contract was added.
- Standard judgment now carries only its standard declaration method and a one-element `httpMethods` tuple.
- QUERY judgment also carries a one-element `httpMethods` tuple.
- Match judgment retains `targetMethods` because those are source evidence for a `match` declaration, as well as the resolved `httpMethods` used for emission.
- `any` retains its complete canonical supported HTTP method set.
- Resource methods remain a separate judgment family because resource expansion is not a single HTTP verb.
- The authority contract advances from version 7 to 8; the scanner and its scan outcomes advance from version 23 to 24.
- The existing regression test no longer expects a redundant `targetMethods` field on the standard judgment.

## Active path

The existing authority is still invoked by `laravelRouteScanner`; the scanner emits `methodJudgment.httpMethods`; the source-AST pipeline injects `laravelRouteScanner`; `upstreamManifestBuilder` executes that pipeline; and CLI scan still delegates through the shared invocation composition boundary.

## Verification boundary

Run the phase audit scripts under `scripts/audits/audit-phase235*.cjs` and the new `audit-phase2358-closed-standard-route-method-contract.cjs`. These are static source-contract checks. TypeScript typecheck, Vitest, and CLI end-to-end execution are not claimed unless separately run in an environment with dependencies installed.

## Remaining architecture debt

This phase does not remove `semantic/relations` or subscanner dependencies from the active route scanner/source-AST pipeline. The current changes narrow and strengthen the upstream route-method judgment contract only; broader scanner migration remains open and must not be described as completed.
