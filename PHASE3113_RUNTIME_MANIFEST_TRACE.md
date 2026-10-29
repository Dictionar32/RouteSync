# Phase 3113 — Runtime Manifest Trace and Migration Frontier

## Goal
Audit the actual Laravel controller manifest runtime path after Phase 3112. This phase deliberately strengthens runtime trace evidence rather than performing unsafe repository-wide textual rewrites of `if`, `switch`, `??`, ternaries, primitive types, or exported functions.

## Runtime trace
1. CLI manifest composition invokes `dependencies.sourceDiscovery.discover(...)` with a typed discovery input.
2. The upstream Laravel controller discovery ADT returns a complete or blocked judgment while preserving project identity, root, source inventory or partial inventory, and blocker evidence.
3. CLI calls the domain operation `discovery.projectForManifest()`; it does not construct a second discovery relation model.
4. The blocked projection retains the original blocked judgment and is settled by the CLI's terminal-manifest operation.
5. The complete projection passes its typed source inventory and project identity into `discoveredSourcesContinuationOperation.continue(...)`, which schedules PHP source reads and proceeds toward semantic judgment and manifest construction.
6. The CLI remains the owner of manifest construction; core upstream types do not import CLI manifest types.

## Why the remaining branch is not mechanically erased
The CLI checks the discriminant of a two-variant projection at the layer that owns manifest policy. Removing this branch by replacing it with generic callbacks/visitors would reintroduce the abstraction Phase 3112 retired, while moving CLI manifest types into core would invert dependency direction. The next architectural step should be a fixed, domain-specific manifest settlement contract only if it can preserve the layer boundary and blocked/complete evidence without a generic visitor.

## Audit
Run `npm run audit:phase3113-runtime-manifest-trace` (or `node scripts/audits/audit-phase3113-runtime-manifest-trace.cjs`). The generated JSON records runtime boundary checks and a TypeScript AST inventory for exported functions, generic continuation visitors, `if`, `switch`, conditional expressions, and nullish-coalescing expressions.

## Verification limits
This phase's structural audit is not a full typecheck, test-suite run, or end-to-end PHP → CLI → manifest generation. Those remain explicitly unverified in the report. The repository-wide export-interface migration and primitive/control-flow elimination are not complete. Deleted relation-foundation modules remain prohibited and are not restored.
