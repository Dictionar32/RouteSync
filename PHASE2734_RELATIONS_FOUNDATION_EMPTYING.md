# Phase 2734 — Empty semantic/relations and semantic/foundation

## User-directed change

The user explicitly instructed that the `relation`/`relations` and `foundation` folders be emptied. This phase follows that instruction literally rather than moving their contents to a replacement folder or creating wrappers.

## Applied change

Emptied these directories completely:

- `packages/core/src/semantic/relations/`
- `packages/core/src/semantic/foundation/`

No files were relocated from these directories. No replacement foundation, renamed abstraction, wrapper, helper, interface module, or compatibility barrel was created.

## Expected consequences

Imports elsewhere in the project that referenced removed modules may now fail to resolve. This is intentional and visible; errors have not been masked with replacement modules. The upstream CLI-to-manifest path has not been claimed as build-verified after this destructive change.

## Verification

The directory emptiness check is the verification for this phase. Full typecheck, tests, build, and CLI end-to-end are not claimed as passing. They must be run after the user-directed source ownership migration is continued.
