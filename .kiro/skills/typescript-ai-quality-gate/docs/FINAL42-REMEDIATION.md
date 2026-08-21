# Final42 — FP-41-001 Remediation

## Scope

Final42 remediates FP-41-001 found by the independent Final41 certification audit.

The false positive was caused by the security sink scanner treating TypeScript
function declarations/signatures such as `declare function exec(x: string): void`
as runtime calls. In a file containing an unrelated tainted request alias, that
could create a blocking process-execution finding with no source-to-sink path.

## Remediation

`engine/analysis.py` now makes `call_arguments()` reject declaration/signature
contexts before treating a matched identifier as a runtime call. In particular,
`declare function`, `function`, `interface`, and `type` signature contexts are
excluded from runtime sink extraction.

This is evidence isolation: a declaration is not a runtime sink and cannot form
a source-to-sink edge.

## Regression

The Final41 negative fixture remains mandatory:

- `req.body.x` in one function
- unrelated `Promise.resolve("safe").then(...).then(...exec(...))`
- safe `finally()` callback
- dynamic computed property remains uncertain

The independent gate must report zero blocking concrete-untrusted-flow findings
for this negative repository.
