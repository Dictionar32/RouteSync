# Phase 3111 — Explicit Manifest Discovery Projection

## Objective

Move the real upstream discovery → CLI manifest boundary away from its generic `continueWith<Result>` visitor and into a fixed, upstream-owned projection ADT. This is a bounded migration, not a claim that all generic continuations or all primitive/control-flow constructs have been removed.

## Runtime path changed

`CLI canonical project composition` → `sourceDiscovery.discover(...)` → `discovery.projectForManifest()` → one of two explicit projection variants:

- `laravel_controller_source_discovery_manifest_complete`: carries the project identity, root and complete source inventory, and can preserve the original complete judgment.
- `laravel_controller_source_discovery_manifest_blocked`: carries project identity, root, partial source inventory and blocker, and can preserve the original blocked judgment for the terminal manifest operation.

The CLI owns manifest construction. The core projection does not import CLI manifest types, so dependency direction remains `CLI → core`, not the reverse. The blocked branch retains the original judgment, blocker and partial inventory rather than manufacturing replacement evidence.

## Regression coverage

The upstream discovery operation tests now check both projection variants, project/root identity, inventory identity, blocker identity and restoration of the original blocked judgment.

## Validation status

The structural audit is `scripts/audits/audit-phase3111-explicit-manifest-discovery-projection.cjs`; its JSON output is `reports/PHASE3111_EXPLICIT_MANIFEST_DISCOVERY_PROJECTION_AUDIT.json`.

The global export conversion (`export function` and exported arrow-valued declarations to `export const name: Interface = ...`) is still incomplete. Primitive/control-flow removal is not performed mechanically because it can erase PHP/Laravel syntax and discovery semantics. Full TypeScript typecheck, complete tests and PHP → CLI → manifest → generator E2E remain unverified in this phase.

## Architectural constraints

No deleted relation foundation is restored. `packages/core/src/types/upstream/collections.ts` remains untouched. The core owns domain evidence and operations; CLI owns filesystem wiring and manifest construction.
