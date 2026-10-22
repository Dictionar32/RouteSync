# Phase 1644 — Proof-Bound Rule Trace

## Semantic contract correction

The exported `INVOCATION_SEMANTIC_CONTRACT.version` now matches the declared contract version (`4`). The prior mismatch (`readonly version: 4` but runtime value `3`) could cause consumers to observe a stale contract revision despite compiling against the new interface.

## Trace model

Every `InvocationSemanticRuleTraceEntry` now carries:

- `subjectInvocation`: the canonical invocation knowledge identity the rule was evaluated for;
- `evidence`: source provenance actually considered for that rule outcome;
- `obligations`: the exact domain obligations emitted by that rule, not just a count.

The trace still retains counts/outcomes for quick diagnostics, but those summaries are now accompanied by evidence and obligation witnesses. Missing-invocation traces bind the evidence-missing obligation to the requested invocation and do not invent target-resolution evidence.

## Boundary

The semantic contract and trace remain in `core/src/types/upstream`. The authority delegates to the judgment algebra; the runtime executor delegates to the authority; scanner code only calls the executor and does not construct trace entries or restate semantic rules.

## Verification

The Phase 1644 audit checks the contract-version invariant, proof-binding declarations, trace identity/evidence/obligation fields, and scanner boundary. The existing ambiguity regression now checks the actual rule-trace witness, not only `obligationCount`.
