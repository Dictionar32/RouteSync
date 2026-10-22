# Phase 2013 — Invocation Outcome Uniformity at the Laravel Response Boundary

## Trace

The Laravel controller scanner already receives the canonical `LaravelControllerInvocationSemanticJudgmentInterface` from the closed invocation inventory. The judgment is outcome-indexed and retains its exact source identity and integrated PHP invocation result. The response path already delegates response meaning to `responseExecutor` and sends the exact invocation/response pair to `astProjection`.

The defect was in `compiler/scanner/wiring/laravelControllerScanner.ts`: it repeated the same response evidence → response executor → AST projection → artifact construction sequence in four branches, one for each invocation integration outcome. The branch did not change the result. It duplicated runtime control flow around a semantic distinction that is already represented by the ADT and owned by upstream authorities.

## Contract-first correction

- Evolved the existing `LaravelControllerResponseSemanticPipelineContract` to version 16; no parallel authority or subscanner was introduced.
- Added `invocationOutcomeUniformityRule`: every closed invocation outcome uses the same response-evidence and AST-projection sequence; outcome differences remain in the response and projection ADTs.
- Removed the scanner's `hasInvocationOutcome` classification and four duplicate branches.
- The scanner now preserves the exact `invocationJudgment`, obtains the response judgment from the existing response executor path, and forwards the exact pair to the existing AST projection authority.
- No invocation outcome is rewritten as success. Response binding/correlation rejection and blocked outcomes remain explicit closed ADT members owned upstream.

## Boundaries

- This does not claim that the entire Laravel scanner has become a thin executor; declaration parsing, controller evidence construction, and relation-helper collection shaping still exist in scanner runtime.
- Existing `semantic/relations` imports remain. No `relation` or `foundation` subscanner was added.
- `responseScanner.ts` still contains a JSON decoding boundary using `unknown`; no new `unknown` semantic contract field was added.
- Full project typecheck/build is not claimed. Validation is limited to audit checks, syntax transpilation where available, package JSON parsing, and ZIP integrity.

## External design references

- Laravel's `PaginatedResourceResponse` exposes pagination response construction and `paginationInformation`, confirming response envelope semantics belong to Laravel response/resource behavior rather than scanner-side guesses.
- TypeScript's discriminated-union guidance explains how a closed ADT carries outcome differences; the consumer need not duplicate outcome routing when every branch executes the same operation.
