# Phase 1942 — Controller Payload Ambiguity Closure (Interface First)

## Trace finding

Phase 1941 moved scanner consumption from span-based lookup to exact PHP AST payload identity, but `resolvedExpression` still selected the first matching *resolved binding judgment*. If more than one resolved binding referred to the same payload, the scanner could silently pick one semantic definition.

## Interface-first change

- Evolved the existing `ControllerDataflowInvocationSemanticModelInterface` to version 13 with `payloadJudgments` as a closed value field; no callable lookup interface or second authority was added.
- Added `ControllerDataflowPayloadSemanticJudgment`, with explicit `unresolved`, `resolved`, and `ambiguous` outcomes per exact source payload.
- Evolved the existing `ControllerDataflowSemanticJudgmentAuthorityInterface` to version 15. The existing authority derives one payload outcome per source payload, and duplicate resolved bindings become an explicit `ambiguous` outcome rather than a first-match choice.
- Updated `controllerAstCanonical.resolvedExpression` to consume only a resolved payload judgment and use its canonical `sourceExpression`. Unresolved or ambiguous payloads do not become resolved semantic values.
- Evolved `LaravelControllerInvocationSemanticBoundaryContract` to version 104 and registered the Phase 1942 static audit.
- Updated the Phase 1940 and Phase 1941 regression checks to validate the current contract shape.

## Verification

- Phase 1940 regression audit: 8/8 PASS.
- Phase 1941 payload identity audit: 7/7 PASS.
- Phase 1942 ambiguity closure audit: 8/8 PASS.
- TypeScript source syntax transpilation: PASS for the changed TypeScript files.
- ZIP integrity: PASS.
- Full TypeScript type-check/build was not run; these checks do not establish full-project compilation.
