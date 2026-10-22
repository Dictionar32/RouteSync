# Phase 2157 — Controller Body Authority Owns Derivation

## Trace before

`resolveControllerActionContract`
→ `resolveControllerBody(method.body, sourceFile)`
→ `validationEntries` and known `errorResponses` derived in the legacy body resolver
→ `controllerBodySemanticJudgmentAuthority.judge({ body: resolvedBody, ... })`
→ authority republishes already-resolved validation and error facts.

This made the authority an output wrapper for facts that had already been interpreted by the legacy resolver. Its interface described ownership that the input contract did not actually enforce.

## Change

- Evolved the existing `ControllerBodySemanticJudgmentAuthorityInterface` to contract version 5.
- The authority now accepts the original typed `ControllerBodyAst` as evidence.
- The existing canonical body authority owns inline validation entry construction, source-span provenance, schema lowering, and the known HTTP error response mapping.
- The old `controllerBodyResolver.ts` no longer interprets validation rules or error status codes. It now contains only the compiler-side `ControllerBodyEvidenceProjection` shape used to carry source statements/dataflow evidence needed by the action projection.
- `resolveControllerActionContract` passes `method.body` directly to the authority. The exact resulting body judgment remains published through the existing action semantic judgment.
- The controller-wide integrated response pipeline and existing resource-binding authority remain separate owners; neither is duplicated or merged into per-action body judgment.

## Architectural boundary

`typed source evidence → existing body semantic authority → closed body judgment → action semantic publication → runtime executor forwarding`

No `relation/foundation` layer, new subscanner, duplicate authority, or runtime semantic classifier was added.

## Validation limits

The Phase 2157 audit is a source-level contract audit. Syntax-only TypeScript transpilation is performed for changed TypeScript files. No full build, full typecheck, or Vitest result is claimed.

## Audit results

The focused Phase 2157 audit passed 15/15. Related regression audits passed: Phase 2133 (18/18), 2136 (20/20), 2137 (15/15), 2138 (11/11), 2154 (26/26), 2155 (18/18), and 2156 (14/14). Four changed TypeScript files passed syntax-only transpilation with zero diagnostics. Full build, full typecheck, and Vitest were not run.
