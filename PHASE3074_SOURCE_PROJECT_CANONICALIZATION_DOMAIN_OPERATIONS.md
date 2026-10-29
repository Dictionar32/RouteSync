# Phase 3074 — Source Project Canonicalization Domain Operations

## Outcome

Migrated the canonicalization result in `packages/core/src/types/upstream/sourceProjectIdentity.ts` from a generic `continueWith<Result>(handlers)` bundle to a closed typed union whose variants own named domain operations.

- `controller_source_project_identity_canonicalized` exposes `continueToSourceDiscoveryIdentity(): SourceProjectIdentity`.
- `controller_source_project_identity_canonicalization_blocked` exposes `preserveFailureEvidence(): ControllerSourceProjectIdentityCanonicalizationBlockedEvidence`, a stable typed evidence projection for the CLI terminal.
- Removed `ControllerSourceProjectIdentityCanonicalizationHandlers<Result>` and `ControllerSourceProjectIdentityCanonicalizationJudgmentOperations` from the upstream contract and public type exports.
- The CLI composition input now consumes the named operations and performs the outcome mapping at the CLI composition boundary. This keeps core independent from CLI manifest terminal types.
- The filesystem canonicalization adapter remains an interface-first `export const ...: ControllerSourceProjectIdentityCanonicalizationInterface = Object.freeze({...})` and continues to use `fs.realpath`.
- Default versus explicit query-policy intent remains preserved when rebuilding the canonical source-project identity.
- Blocked canonicalization projects into typed failure evidence and still maps to the existing `controller_invocation_manifest_source_project_identity_blocked` manifest terminal. It is not converted into an empty or complete manifest.

## Runtime trace

```text
CLI scan / sync
  → routeSyncCliManifestScanOperationFactory.scan
  → ControllerInvocationManifestCompositionAuthority.compose
  → composition input continueToCanonicalization
  → controllerSourceProjectIdentityCanonicalization.canonicalize
  → fs.realpath(requested project root)
  → canonicalized judgment operation OR blocked evidence-preservation operation
      ├─ canonicalized → source discovery → source document identity/read
      │                → invocation semantic pipeline → inventory
      │                → ManifestBuilder → manifest projection → validation
      │                → generator save / persistence
      └─ blocked → source-project-identity-blocked manifest terminal
```

The trace follows the actual source wiring. This phase does not claim a successful live PHP → CLI → manifest execution.

## Remaining boundary

`failure: unknown` remains in the blocked judgment because the original Node filesystem rejection is retained as diagnostic evidence. This is intentionally disclosed rather than silently discarded or cast to a guessed type. The next model should introduce a closed filesystem-failure evidence representation only after confirming which diagnostic information downstream consumers require. The raw rejection should be confined to the platform boundary and not used as semantic control data.

The CLI composition boundary still uses a discriminated `switch` to map the upstream result to CLI-owned manifest terminals. Moving those terminal types into core would invert dependency direction; replacing the switch must not create a second semantic authority or a generic relation foundation.

## Verification

- Phase 3074 structural audit: **14/14 checks passed**.
- Phase 3072 regression: **PASS**.
- Phase 3071 regression: **PASS**.
- Phase 3070 regression: **PASS**.
- Phase 3069 regression: **PASS**.
- Changed-file TypeScript syntax transpilation: **PASS** (no syntax diagnostics).
- Whole-program strict TypeScript check: **BLOCKED by workspace environment**. The available global compiler reports missing standard library/type definitions and missing `node` / `vitest/globals`; it is not a clean project typecheck.
- End-to-end PHP → CLI → manifest integration: **NOT RUN**.
- `packages/core/src/types/upstream/collections.ts`: preserved as exactly one newline byte.
- Deleted relation foundation modules remain absent; none were restored.

## Architectural rule carried forward

Raise semantic knowledge into upstream ADTs and typed domain operations; keep platform-specific interpretation at the adapter boundary; keep CLI manifest terminals in the CLI composition layer; do not mechanically delete all branching or traversal mechanics. Do not claim global elimination of `string`, `number`, `unknown`, `null`, `undefined`, booleans, `Map`, `reduce`, `if`, `switch`, equality checks, or ternaries based on this local migration.
