# Phase 1531 — Evidence-Bound Runtime Authority Plan

## Trace finding

The runtime-authority target accepted `claim(methodName)` and returned a family-correlated plan, while the plan's `execute(request)` accepted a second source-evidence value. The type model therefore allowed a caller to claim ownership for one method and later provide evidence for another method. In addition, the executor-table target returned the older derivation judgment while the authority plan returned the provenance-complete judgment.

## Interface/model change

- `QueryOperationSemanticRuntimeAuthority.claim` now receives `QueryOperationSemanticSourceEvidence` as one complete value rather than a detached `MethodName`.
- An owned execution plan carries the evidence and family-indexed contract established by the claim.
- The plan's `execute` capability is zero-argument, expressing that evidence and contract are already bound and cannot be substituted by a caller after ownership is established.
- `QueryOperationSemanticExecutorTable` now returns `QueryOperationSemanticProvenanceJudgmentFor<Rule>`, aligning executor output with the authority's closed, provenance-bearing judgment.
- Public type exports include the mapped provenance judgment union and owned-plan union.

## Scope

This phase changes type/interface declarations, public type exports, an audit script, and this document. It does not change implementation function bodies in semantic reasoning or scanner, and it does not modify `package.json` or build configuration. The authority interface remains a migration target; this phase does not claim that runtime wiring already implements it.

## Verification

Run `node scripts/audits/audit-phase1531-evidence-bound-runtime-plan.cjs`. The audit checks evidence binding, plan closure, output-algebra consistency, and that the reasoning/scanner files remain in their existing roles. Full build/typecheck is not claimed.
