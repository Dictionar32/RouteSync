# Phase1928 — Controller Dataflow Authority Input Closure (Interface First)

## Trace

Phase1927 already moved binding correspondence, variable identity, canonical variable-flow composition, and integrated-response composition into the upstream authority implementation. However, its per-analysis `ControllerDataflowSemanticJudgmentAuthorityInput` still carried those authorities as fields, so the analyzer/wiring had to assemble an orchestration bundle on every call. The interface described a closed judgment while exposing its internal machinery as input dependencies.

## Interface repair

- Narrowed the per-analysis input to the source-correlated knowledge projection, typed PHP payload evidence, exact invocation judgment, and source-specific definition projection adapter.
- Bound correspondence, variable identity, variable-flow composition, and integrated-response composition inside the upstream authority implementation.
- Reduced analyzer arguments and removed four authority dependencies from the scanner composition root.
- Bumped `ControllerDataflowSemanticJudgmentAuthorityInterface` contract version to 2 and Laravel controller scanner contract version to 90.
- Preserved per-binding discriminated unresolved/resolved outcomes, exact invocation judgment, and the distinct integrated-response result.
- Updated Phase1927's audit to validate the stronger input boundary and added a dedicated Phase1928 audit.

## Verification

- `node scripts/audits/test-phase1928-controller-dataflow-authority-interface-closure.cjs`: 7/7.
- `node scripts/audits/audit-phase1926-laravel-controller-binding-judgment-closure.cjs`: 9/9.
- `node scripts/audits/audit-phase1927-controller-dataflow-authority-boundary.cjs`: 13/13.
- No build, TypeScript compilation, or full test suite was run.
