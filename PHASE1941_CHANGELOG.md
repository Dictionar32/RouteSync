# Phase 1941 — Controller Payload-Identity Semantic Judgment

## Trace finding

`controllerAstCanonical.resolvedExpression` was flattening `semanticVariables` into definitions and searching each judgment by re-comparing source file/start/end offsets. This repeated a source-correspondence operation already closed upstream in `ControllerDataflowSemanticJudgmentAuthorityInterface` and retained in each resolved `bindingJudgment`.

## Interface-first change

- Evolved the existing `LaravelControllerInvocationSemanticBoundaryContract` to version 103.
- The boundary now states that the scanner consumes the correlated binding judgment through the exact `PhpAstValue` payload reference retained by upstream correspondence.
- `resolvedExpression` now reads the existing `bindingJudgments`, selects the resolved outcome whose matched payload carries the exact AST value, and reuses `definition.semanticResolution.sourceExpression` as the canonical projected expression.
- Only an expression with no matching closed semantic judgment is projected locally and retained as explicitly unresolved/external.
- No new authority, relation abstraction, map/index, or parallel semantic model was introduced.
- Updated the Phase 1940 regression audit to assert the new contract and added `test-phase1941-controller-payload-identity-semantic-judgment.cjs`.

## Verification

- Phase 1940 regression audit: 8/8 PASS.
- Phase 1941 payload-identity audit: 7/7 PASS.
- Historical Phase 1915 audit: 5/10 PASS; it contains stale assertions about earlier ownership and version expectations.
- Historical Phase 1917 audit: 2/10 PASS; it contains stale assertions about earlier boundary versions and implementation structure.
- Build and TypeScript compilation were not run in this environment.
