# Phase 2570 — CLI Manifest Authority No-Fallback Closure

## Root cause

The CLI composition interface requires both `manifestComposition` and `requestTypeDerivationPipeline`, but `scan` and `sync` still used `composition?.manifestComposition ?? controllerInvocationManifestCompositionAuthority`. This retained an implicit default authority at the consumer boundary and made the declared all-or-nothing composition contract weaker than its type.

## Change

- Removed the direct default-authority import from both commands.
- The commands now consume `manifestComposition` only from the supplied `RouteSyncCliUpstreamCompositionInterface`.
- A missing manifest authority is represented as a terminal CLI failure before source identity creation or source acquisition.
- Updated Phase 2561's regression audit to require the new no-fallback boundary rather than the old fallback implementation.
- Added `audit:phase2570-cli-manifest-authority-no-fallback`.

## Resulting path

`CLI composition bundle → semantic pipeline resolution → manifest authority presence check → canonical project identity → manifest composition → identity binding → semantic judgments → inventory authority → manifest builder → RequestType projection`.

The CLI still intentionally blocks when no production semantic pipeline is supplied. This phase does not fabricate the missing production reasoning/verifier/decision/authority implementation.

## Validation

Run the new audit and the prior phase audits. Full typecheck, package build, Vitest, and CLI end-to-end are not claimed unless executed separately.
