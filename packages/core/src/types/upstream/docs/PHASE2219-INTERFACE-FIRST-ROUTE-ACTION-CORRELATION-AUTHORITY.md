# Phase 2219 — Interface-first route/action correlation authority

## Trace and defect

The prior route scanner selected `ControllerActionJudgmentPublication` values locally by controller/action name. Phase 2218 added the exact method `SourceSpan` to the canonical action judgment and publication, but the route correlation consumer did not validate that the publication's copied identity and span still agreed with the canonical judgment. A drifted publication could therefore be selected as if it were authoritative.

## Change

- Added `ControllerActionRouteCorrelationAuthorityInterface` and its closed `ControllerActionJudgmentRouteSelection` judgment path under `types/upstream`.
- The authority owns exact controller/action matching and ambiguity, and verifies publication controller/action against the canonical projection and semantic action name.
- It verifies that `publication.sourceFile`, `publication.source.file`, and `judgment.semantic.source.file` agree, and that the publication span equals the canonical semantic span.
- Added the explicit `invalid_action_judgment_publication` ADT branch. A route with inconsistent publication provenance projects to `unresolved_action_request` / `unresolved_action_input`, never to `no_request` / `no_input`.
- `laravelRouteScanner.ts` now delegates correlation to the authority instead of implementing the match/ambiguity algorithm itself.
- No `semantic/relations`, `semantic/foundation`, or new subscanner layer was introduced.

## Remaining limits

This closes only the route-to-action publication correlation boundary. It does not retire `scanControllerAction` / `resolveControllerActionContract`, and does not claim complete upstream ownership of action response DTO derivation, resource binding publication, channel subscription evidence, or all `semantic/relations` call sites. Full TypeScript checking, Vitest, and package build were not run in this environment.
