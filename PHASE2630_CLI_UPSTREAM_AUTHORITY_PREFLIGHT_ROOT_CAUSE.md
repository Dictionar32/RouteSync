# RouteSync Phase 2630 — CLI Upstream Authority Preflight Root Cause

## Root cause found and corrected

Both `scan` and `sync` validated the `requestTypeDerivationPipeline` before project identity creation, but checked `manifestComposition` only after calling `createLaravelSourceProjectIdentity(...)` and selecting the route source file. This made the complete composition contract only partially preflighted: a missing manifest authority was discovered after source identity/selection work had already begun.

## Implementation

- Moved the `manifestComposition` presence check ahead of project identity canonicalization and route-file selection in `packages/cli/src/commands/scan.ts`.
- Applied the same ordering in `packages/cli/src/commands/sync.ts`.
- Added `scripts/audits/audit-phase2630-cli-upstream-authority-before-source-identity.cjs` and registered it as `audit:phase2630-cli-upstream-authority-before-source-identity`.
- Preserved the existing source-model complete-or-blocked ADT and the manifest builder's blocker-before-dataflow gate.
- Kept the CLI fail-closed when a host-owned semantic composition is missing; did not invent a RequestType semantic producer or claim the 34-law verifier exists.

## Verification

The Phase 2630 audit checks the order of both required authority validations relative to project identity and source-file selection, source-model inventory interface ownership, the manifest blocker gate, fail-closed standalone composition, and absence of semantic-foundation imports on this path.

The repository also has a separate known unresolved production gap: the RequestType derivation composition defines injected reasoning/verifier/decision contracts, but no concrete production reasoning producer is present in `packages/core/src/compiler/semantic/request-type-derivation`. This cannot be safely fixed by a fabricated implementation or by relaxing the fail-closed CLI gate. The host-owned producer and complete verifier remain required for end-to-end manifest projection.

## Scope limits

A passing source audit proves source structure and ordering only. It does not prove full TypeScript typecheck, Vitest, package build, or end-to-end CLI behavior. Those checks must be run in the supported project environment.
