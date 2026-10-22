# Phase 1395 — Runtime Matcher Full Contract Validation

## Finding

The orchestration matcher previously checked only structural shape and judgment-node identity. That allowed a contract with an invalid fact subset or inconsistent `selectedFacts` to be classified as a match at the routing boundary, even though the executor would reject it later. This split validation responsibility created a misleading intermediate result.

## Change

`semanticDataflowQueryPolicyMatches(candidate, judgment)` now first rejects non-JSON/executable object graphs and then invokes the full `validateSemanticDataflowQueryPolicyContract` invariant check. It still does not infer source/sink roles or materialize policy. The executor remains responsible for decoding a fresh immutable snapshot before execution.

## Ownership

- Upstream owns semantic policy selection and contract materialization.
- The matcher only answers whether an untrusted candidate is valid for a specific judgment.
- Runtime decoding creates the immutable execution snapshot.
- The executor applies the closed contract without producer reclassification.

## Verification boundary

The phase audit checks source-level wiring and invariants. It is not a substitute for the full build or runtime integration suite.
