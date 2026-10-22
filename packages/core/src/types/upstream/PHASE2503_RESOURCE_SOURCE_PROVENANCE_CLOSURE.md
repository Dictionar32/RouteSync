# Phase2503 — Resource Source Provenance Closure

## Root cause

The named `ResourceAstExpressionMappingInput` contract already required a typed `SourceFile`, but three scanner consumers bypassed source identity by manufacturing `SourceFile('<scanner>')`. Inline response metadata also used `'<inline>'` as its source origin. This meant the upstream mapping contract was stronger than the actual consumer wiring.

## Changes

- `bindField` now requires `SourceFile`; `SemanticResourceBinder.bindField` carries the same required input.
- The recursive nested-field callback preserves the same source identity rather than reconstructing a placeholder.
- `bindNestedArrayField` accepts the source identity and passes it to every nested expression mapping operation.
- `resolvePropertyPath` and `bindPropertyPathField` require `SourceFile`; method-call argument mapping receives the same identity.
- `detectInlineResponse` requires a typed `SourceFile`, maps inline values with it, and uses the same path for response-origin metadata.
- Replaced the unresolved legacy `Token` import in `responseDetector.ts` with the existing `TokenDescriptor` exported by `PhpAst.ts`.
- Added `scripts/audits/audit-phase2503-resource-source-provenance-closure.cjs` to guard the source identity flow and forbid synthetic `<scanner>`/`<inline>` provenance on the scanner path.

## Verification

- Phase2503 source-provenance audit: 11/11 assertions passed.
- Phase2497 audit: 9/9 passed.
- Phase2498 audit: 11/11 passed.
- Phase2499 audit: 10/10 passed.
- Phase2501 audit: 16/16 passed.
- Phase2502 audit: 10/10 passed.
- TypeScript syntax parsing for seven affected files passed.
- Relative import resolution for those files passed after fixing the pre-existing `Token` import.

## Remaining architecture debt

This phase closes synthetic source provenance for the audited scanner tree; it does not claim that the whole Laravel scanner is relation/foundation-free. `resourceExpressionSemanticAuthority.ts`, `resourceProducer.ts`, `resourceBinder.ts`, `resourceSourceEvidence.ts`, `propertyPathResolution.ts`, and `responseDetector.ts` still have active semantic-relations dependencies. Active `subscanners` remain elsewhere, including request and assignment producers. Full project typecheck, build, Vitest, and CLI end-to-end validation were not run in this workspace.
