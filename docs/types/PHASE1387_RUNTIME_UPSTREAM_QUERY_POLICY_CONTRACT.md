# Phase 1387 — Runtime executes upstream query-policy contracts

## Trace result

The Phase 1386 trace exposed one remaining classification step inside the Runtime query policy: `semanticDataflowFactAnalysisPolicy.ts` accepted `sourceProducers` and `sinkProducers` and filtered judgment facts by those labels. Although this did not recompute the fixed-point closure, it meant Runtime still made a policy classification decision.

## New contract flow

```text
SemanticDataflowJudgment + explicit query-policy intent
                    |
                    v
materializeSemanticDataflowQueryPolicy (upstream)
                    |
                    v
SemanticDataflowQueryPolicyContract
  - judgmentNode
  - sourceFacts (already selected)
  - sinkFacts (already selected)
  - selectedFacts
  - closed: true
                    |
                    v
analyzeRouteSyncManifestDataflowWithPolicy
                    |
                    v
Runtime validates canonical judgment identity
                    |
                    v
Runtime creates query predicates from contract facts
                    |
                    v
reaches() reads existing closed closure
```

## Ownership rules

- Upstream materializes producer-domain intent into selected source/sink fact sets.
- Runtime accepts the closed `SemanticDataflowQueryPolicyContract`; it does not receive producer-domain labels.
- Runtime validates that the policy contract belongs to the same canonical judgment and fails closed on mismatch or absence.
- Runtime may construct query predicates from already-selected facts and answer reachability using existing closure. It must not call the reasoning authority or calculate a new closure.
- The canonical semantic judgment is preserved; query policy does not alter `facts`, `closure`, `derivations`, `paths`, or `fixedPoint`.

## Changed files

- `packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts` — upstream policy intent and closed contract materializer.
- `packages/core/src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts` — Runtime consumes contract facts, not producer labels.
- `packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts` — policy analysis requires pre-materialized contracts and fails closed when missing.
- `packages/core/src/compiler/analysis/__tests__/ecommerceShopDataflowPolicyPhase1029.spec.ts` — integration test constructs policy contracts before invoking Runtime.
- `packages/core/src/index.ts` — exports contract/materializer.
- `scripts/audits/audit-phase1387-upstream-query-policy-contract.cjs` and `package.json` — structural audit.

## Verification boundary

The structural audit verifies type and source-level ownership boundaries. It does not replace a TypeScript build or integration test execution. Build verification requires the repository dependencies, including `tsdown`, to be installed.
