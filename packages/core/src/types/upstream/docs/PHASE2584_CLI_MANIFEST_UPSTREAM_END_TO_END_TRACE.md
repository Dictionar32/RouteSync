# Phase 2584 — CLI → Manifest → Upstream End-to-End Trace

## Audit conclusion

This phase pins the active source path and its actual remaining blocker. The CLI boundary is now explicit, but the executable is not end-to-end composed: `packages/cli/src/index.ts` calls `createProgram()` without a `RouteSyncCliUpstreamCompositionInterface`. The commands intentionally fail closed rather than inventing a semantic pipeline.

## Traced path

```text
CLI executable (`createProgram()` with no composition)
  → scan/sync command receives composition = absent
  → resolve RequestTypeDerivationSemanticPipelineInterface
  → closed `request_type_semantic_pipeline_unavailable`
  → stop before source acquisition / manifest composition

Intended injected path:
CLI composition factory
  → existing ControllerInvocationManifestCompositionAuthorityInterface
  → RequestTypeDerivationSemanticPipelineCompositionInterface
  → canonical upstream pipeline assembler
  → scan/sync command
  → manifest source-project identity + route selection
  → controller source discovery / source-document reader / invocation semantic pipeline
  → source-bound controller inventory authority
  → manifest builder authority
  → RequestType source evidence inventory + canonical route/resource/request identity
  → request/resource resolution assessments
  → RequestType semantic pipeline
  → assessment integrity validation
  → project only the verified `derived` judgment
  → lower manifest and emit artifacts
```

## Evidence-backed findings

1. `packages/cli/src/index.ts` exposes `createProgram(composition?)` and passes the supplied value to scan and sync. The executable entry currently calls `createProgram()` with no composition.
2. `scan.ts` and `sync.ts` resolve the semantic pipeline before source acquisition and fail closed if it is absent. This is correct for avoiding false semantic authority, but means the shipped zero-argument executable cannot complete scan/sync.
3. `upstreamCompositionFactory.ts` delegates to `assembleRequestTypeDerivationProductionPipeline`; it composes capabilities and does not implement source semantics.
4. `requestTypeDerivationSourceEvidenceInventory.ts` already owns canonical identities and occurrence keys. Request/resource resolution inventory operations already produce typed receipts. These are useful producer inputs, not a complete RequestType judgment.
5. The canonical contract declares a closed judgment ADT and 34 law IDs. The active legacy `requestTypeDerivationSolver` returns bare `RequestType[]`; it does not provide the complete proof ledger needed to assert `derived` or mark the laws verified.
6. `requestTypeDerivationSemanticPipelineAssembler.ts` correctly wires reasoning → guarded verifier → decision → authority, but all four semantic capabilities must be supplied. No production composition implementing all capabilities was found in the active source tree.

## Root cause

The remaining root cause is not an export typo or a missing identity key. It is the missing **proof-producing upstream semantic implementation and independent complete-law verifier**, compounded by the executable entry not loading/injecting a real composition. Merely wrapping the legacy solver output in `kind: 'derived'`, filling verified-law records with literals, or falling back to `RequestType[]` would falsify the contract.

## Correct evolution sequence

1. Implement the semantic producer in the semantic owner using the canonical source inventory and the existing request/resource resolution receipts; preserve every route/resource/request disposition.
2. Build group/action/response contribution receipts and a closed proof ledger that corresponds to the produced groups, unresolved ledger, and conflict ledger.
3. Implement the independent verifier against the complete canonical law union, returning typed counterexamples for failures. The verifier must recompute/check source binding and closure rather than trust producer flags.
4. Connect the existing decision and authority capabilities through the canonical assembler using the same `requestTypeDerivationContract` instance.
5. Add an actual executable composition root that supplies both manifest authority and the assembled semantic pipeline; keep missing composition as a closed CLI error.
6. Verify derived, incomplete, conflict, invalid-input, duplicate identity, and distinct-source-occurrence cases, then run typecheck/build/tests and a real CLI scan.

## Constraints retained

- Do not use `core/src/semantic/foundation` or `semantic/relation` as a new owner for these operations.
- Do not wire `subscanner` or the legacy `RequestType[]` solver as semantic authority.
- Do not claim a valid judgment unless source dispositions, proof receipts, closure and all required law checks are actually established.

## Validation

`node scripts/audits/audit-phase2584-cli-manifest-upstream-end-to-end-trace.cjs` is a structural trace audit. It does not claim TypeScript typecheck, package build, Vitest, or CLI end-to-end success.
