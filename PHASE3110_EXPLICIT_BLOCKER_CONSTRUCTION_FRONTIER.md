# Phase 3110 — Explicit Blocker Construction Frontier

## Goal

Continue the Fully Explicit Typed Runtime Scanner migration from Phase 3109. This phase removes mutable `let blocker` staging from the upstream Laravel controller-discovery blocker factory and refreshes the repository-wide TypeScript AST export frontier.

## Runtime ownership

`packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts` owns the six blocker variants and their `blockDiscovery` operation. Each factory now constructs its self-referential immutable blocker with one explicitly typed `const` declaration. The operation still closes over the exact blocker object, so the resulting blocked judgment retains blocker identity, source-project identity, root identity, and partial source inventory.

The runtime route remains:

`CLI scan/sync → controller manifest composition → Laravel controller discovery → shared filesystem observation → FilesystemFailureCode → blocker factory → blockDiscovery → blocked discovery judgment → source reads / semantic judgments → manifest construction and validation → terminal manifest → generator/output`.

## Boundary intentionally not claimed as complete

`controllerInvocationManifestComposition.ts` still uses `discovery.continueWith(...)` at the discovery-to-CLI-manifest boundary. The output type is CLI-owned, so moving that manifest type into `core` would reverse the dependency direction. Removing this generic continuation safely requires a core-owned, fixed upstream projection contract followed by an explicit CLI projection; this phase does not pretend that the boundary has already been migrated.

## Validation

- `npm run audit:phase3110-explicit-blocker-construction-frontier` performs structural checks and a TypeScript Compiler API inventory over `core`, `cli`, `sdk`, and `react`.
- The regression test asserts all six blocker factories return frozen values with a `blockDiscovery` operation and that settlement preserves the blocker identity.
- Full typecheck, full test suite, and PHP → CLI → manifest → generator E2E are marked unverified unless run successfully in an environment with dependencies installed.

## Global migration status

The AST inventory is a frontier, not a completion claim. Conversion of every exported function and exported arrow function to `export const name: Interface = ...` is still incomplete. The global removal of primitive types and syntax patterns (`string`, `number`, `undefined`, `null`, `boolean`, `reduce`, array literals, `??`, ternary, `if`, `:`, `===`, `is`, `as`, `lookup`, `void`, `visitor`, `switch`, `for`, `map`, and `let`) is also incomplete. Each pattern must be migrated according to domain ownership and parser/runtime semantics, not deleted mechanically.

The deleted relation foundation modules under `packages/core/src/semantic/relations/` remain out of scope and are not restored.
