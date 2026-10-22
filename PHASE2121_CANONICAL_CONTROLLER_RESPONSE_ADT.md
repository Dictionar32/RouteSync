# Phase 2121 — Canonical Controller Response ADT

## Root-cause trace

The Phase 2120 adapter reconstructed `ControllerResponse` from `result.contract.response.responseTypeName()` and always emitted `response_present`. That duplicated response classification at the adapter boundary and lost the existing `response_absent` case. It also treated any descriptor exposing `responseTypeName()` as a resource response, although the canonical `ControllerResponse` contract is a presence ADT and the resolver already derives it as `resourceResponse`.

## Interface-first correction

`ControllerActionContract` now exposes `semanticResponse: ControllerResponse`. `resolveControllerActionContract` populates this field from the same `resourceResponse` value already supplied to `controllerReturnSemanticFromMethod` and `createControllerDataflowContract`. The action-judgment adapter forwards `result.contract.semanticResponse`; it no longer synthesizes another response ADT from the descriptor. The Laravel scanner continues to consume `result.semanticJudgment.response`, and the runtime executor preserves the whole judgment.

This is an ownership/correlation correction, not a claim that the legacy resolver has been retired. The resolver and its subscanner dependencies remain in the transitive path and require a separate semantic-owner migration.

## Trace boundaries

```text
PHP method evidence
  -> resolveControllerActionContract
       -> canonical resourceResponse: ControllerResponse
          -> ControllerReturnSemantic
          -> ControllerDataflowContract
          -> ControllerActionContract.semanticResponse
  -> action semantic judgment adapter
       -> judgment.response = contract.semanticResponse
  -> runtime executor
       -> preserves semanticJudgment object
  -> Laravel controller scanner
       -> consumes semanticJudgment.response
  -> integrated response pipeline / AST projection
```

## Validation

Run `node scripts/audits/audit-phase2121-canonical-controller-response-adt.cjs` or `npm run audit:phase2121-canonical-controller-response-adt`.

This is a static contract audit. No package build, TypeScript typecheck, or Vitest run is implied.
