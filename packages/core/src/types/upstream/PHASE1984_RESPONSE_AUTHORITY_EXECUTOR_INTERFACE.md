# Phase 1984 — Response Semantic Authority and Runtime Executor Interfaces

## Scope

This phase is interface-first and type-only. It does not edit scanner runtime, wiring implementation, response inference implementation, AST projection implementation, or legacy subscanner files. It adds no `semantic/relations`, `semantic/foundation`, replacement subscanner, or parallel invocation authority.

## Trace finding

The existing `LaravelControllerResponseSemanticJudgment` defines a response ADT, and `LaravelControllerScanArtifact` requires a correlated `responseJudgment`. However, the production `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` still emits only `invocationJudgment`. No response semantic authority interface or response executor interface existed in the upstream response contract. Therefore the artifact contract and runtime producer are currently out of sync.

## Interface correction

`laravelControllerResponseSemanticJudgmentInterface.ts` now declares:

- `LaravelControllerResponseSemanticEvidenceForSource<Source>`: response evidence whose source endpoint is indexed by the invocation source subject.
- `LaravelControllerResponseSemanticJudgmentInput<InvocationJudgment>`: a closed input carrying the exact invocation subtype and source-indexed evidence.
- `LaravelControllerResponseSemanticJudgmentAuthorityInterface`: the explicit owner of Laravel HTTP-response meaning. It uses the existing `LaravelSourceIdentitySemanticsInterface` and returns `LaravelControllerResponseSemanticJudgmentFor<InvocationJudgment>`.
- `LaravelControllerResponseSemanticRuntimeExecutorInterface`: a delegation boundary whose implementation must forward the authority's closed ADT without classifying descriptors or reconstructing provenance.

This response authority is not a second invocation authority. The existing invocation judgment remains the canonical invocation source; response semantics is a distinct domain judgment that depends on it.

## Invocation → response → artifact → AST/ADT

```text
source-derived invocation inventory
  → existing invocation semantic judgment
  → response evidence indexed by invocation source
  → response semantic authority (closed response ADT)
  → controller artifact carrying both correlated judgments
  → existing source AST projection judgment (complete | blocked)
  → runtime executor forwards closed outcomes
```

`InvocationSemanticIntegratedResponseCompositionInterface` remains the PHP invocation/knowledge integration boundary. It is not interchangeable with Laravel HTTP-response semantic judgment.

## Validation

Run the structural audit from the repository root:

```sh
node scripts/audits/audit-phase1984-response-authority-executor-interface.cjs
```

The audit is structural only. No build or TypeScript typecheck is claimed.

## Explicitly unresolved

The production controller scanner still does not populate `responseJudgment`; wiring and response-authority implementation have not been migrated in this phase. This is intentionally reported as a known gap, not misrepresented as complete integration. The next phase should implement the declared response authority and wire it through the existing scanner contract without adding a relation/foundation layer or duplicate invocation authority.
