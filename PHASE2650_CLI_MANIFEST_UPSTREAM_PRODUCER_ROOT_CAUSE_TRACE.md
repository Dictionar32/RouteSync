# RouteSync Phase 2650 — CLI → Manifest → Upstream Producer Root-Cause Trace

Date: 2026-10-21

## Scope and result

This phase traces the actual source path in the Phase 2649 archive. It does **not** claim the production semantic kernel is implemented. The active path is structurally wired, but the concrete semantic reasoning producer and independent complete verifier are absent. Replacing generic defaults cannot close that gap.

## Evidence in source

1. `packages/cli/src/standaloneCompositionLoader.ts`
   - The CLI loads `requestTypeDerivationSemanticComposition` from `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE`.
   - It validates that the supplied composition has `infer`, `verify`, `decide`, `evaluate`, and `validate` capabilities.
   - It does not instantiate a concrete semantic producer itself.

2. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts`
   - `assembleRequestTypeDerivationProductionPipeline` accepts an injected `RequestTypeDerivationSemanticPipelineCompositionInterface` and delegates to the assembler.
   - The source comment explicitly says concrete production reasoning/verifier/decision/authority capabilities are not supplied.
   - `requestTypeDerivationSemanticPipelineResolution` rejects missing composition instead of using a legacy solver.

3. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts`
   - Prepares canonical source inventory and request/resource resolution ledgers.
   - Returns evidence and assessments, not `RequestTypeDerivationJudgment`.
   - This is upstream preparation, not semantic inference.

4. `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
   - Declares 34 canonical law IDs and matching witness obligations.
   - Defines the closed judgment ADT (`derived`, `incomplete`, `conflict`, `invalid_input`) and the `RequestTypeDerivationSemanticReasoningInterface['infer']` boundary.
   - A list of obligations and an interface are contracts, not executable law verification.

5. The active request-type derivation directory contains source inventory, resolution, contribution operations, preparation, guards, authority, coverage, and pipeline assembly. It does not contain a concrete production reasoning implementation that creates a judgment from the prepared source packet, nor an independent verifier implementation establishing all 34 laws.

## Confirmed architectural boundary

```text
CLI composition loader
  → injected semantic composition required
  → canonical pipeline assembler
  → manifest preflight
  → canonical inventory + request/resource resolution ledgers
  → [MISSING] concrete source-bound reasoning producer
  → [MISSING] independent verifier for all 34 canonical laws
  → decision + authority + integrity
  → manifest projection
```

The diagram marks the semantic kernel gap; it does not imply the ordering of runtime execution is reversed. The CLI intentionally fails closed before source acquisition when composition is absent.

## Why not add a quick implementation here

A producer that merely packages the legacy `RequestType[]` output as `judgment.groups`, fabricates proof receipts, marks all law witnesses present, or delegates verification to the producer would manufacture evidence rather than establish semantics. That would hide the root cause and violate the proof-carrying contract. Reusing the legacy contribution path also risks reintroducing `semantic/relations` into the active path, which this phase must not do.

## Executed structural checks

- `node scripts/audits/audit-phase2638-cli-manifest-upstream-current-path.cjs` — **10/10 passed**.
- `node scripts/audits/audit-phase2641-distinct-occurrence-identity-collision.cjs` — **10/10 passed**.
- `node scripts/audits/audit-phase2648-preparation-packet-integrity.cjs` — **9/9 passed**.

These prove only the assertions in those audit scripts. No full typecheck, package build, Vitest, or Laravel end-to-end test is claimed; project dependencies are not installed in this extracted workspace.

## Next implementation boundary

Implement the concrete producer against the existing `RequestTypeDerivationSemanticReasoningInterface` using the prepared canonical inventory, resolution ledgers, action/response contribution operations, source dispositions, group contribution receipts, and closure ADT. Then implement a verifier that independently recomputes every witness required by `REQUEST_TYPE_DERIVATION_LAW_OBLIGATIONS`. Only after those capabilities exist should they be wired through the existing `RequestTypeDerivationSemanticPipelineCompositionInterface` and supplied to the CLI composition loader. Do not add a duplicate interface, generic wrapper, legacy-array proof adapter, or dependency on `semantic/foundation` / `semantic/relations`.
