# Phase 1949 — CLI Invocation Composition Interface First

## Goal

Promote the CLI invocation-to-manifest orchestration into an explicit typed interface and declarative workflow contract. The CLI is not a second semantic authority: invocation judgments and inventory closure remain owned by existing core authorities.

## Trace findings

- `packages/cli/src/commands/scan.ts`, `sync.ts`, and `commands/audit/driftAuditor.ts` share `buildManifestWithInvocationPipeline`.
- The previous composition function embedded discovery, pipeline delivery, judgment publication, source inventory creation, inventory closure, and manifest projection in one function.
- The existing upstream invocation judgment authority and inventory closure authority already provide the correct semantic ownership boundaries.

## Changes

- Added `controllerInvocationManifestCompositionInterface.ts` with a typed authority boundary and a closed seven-stage workflow contract.
- Refactored the existing composition module into a composition authority; the public `buildManifestWithInvocationPipeline` entry point remains compatible and delegates through that interface.
- Preserved core authority ownership for invocation judgments and inventory closure.
- Preserved the ADT split between validated and rejected inventory results. Only a validated, authority-produced receipt reaches `manifestBuilder.build`.
- Exported the new interface and contract from the PHP parser subdomain index.
- Added a static audit under `scripts/audits/` and registered it in `package.json`.

## Boundaries

The interface owns the declarative workflow contract. TypeScript interfaces do not execute code by themselves; the composition authority implements the boundary. Semantic reasoning stays upstream in core, while CLI executes discovery, wiring, and projection.

## Verification

- Phase 1940–1949 static audit scripts: see `PHASE1949_VERIFICATION.md`.
- TypeScript syntax transpilation: checked separately from full type-checking.
- Full build and test suite were not run.
