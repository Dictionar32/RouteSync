# Phase 2700 — Fully Typed Runtime Scanner Operations

## Objective
Continue the upstream CLI manifest runtime audit. Apply `export const name: Interface = { ... }`
to live CLI command-factory operations rather than examples, and remove the callable exported
factory form from the scan/sync command boundary.

## Runtime trace
1. `packages/cli/src/index.ts` loads the upstream composition and registers scan/sync commands.
2. `createScanCommand.create(composition)` / `createSyncCommand.create(composition)` construct the CLI commands.
3. Each command consumes `composition.manifestScanOperation.scan(...)`.
4. The manifest scan operation delegates into the upstream manifest composition and source acquisition.
5. The resulting discriminated union is checked at the CLI boundary; identity, source acquisition,
   discovery, inventory, and manifest-builder blocked outcomes remain explicit.
6. The complete manifest then flows through manifest projection and downstream dataflow/IR output.

## Source changes
- `packages/cli/src/commands/scan.ts`: added `ScanCommandFactoryInterface`; changed
  `createScanCommand` to a frozen interface-typed object with `.create`.
- `packages/cli/src/commands/sync.ts`: added `SyncCommandFactoryInterface`; changed
  `createSyncCommand` to a frozen interface-typed object with `.create`.
- `packages/cli/src/index.ts`: runtime registration now calls `.create(composition)`.

## Static checks
- No stale `createScanCommand(composition)` or `createSyncCommand(composition)` call sites were found
  under `packages/`.
- Both command factories now have explicit object-interface contracts and `Object.freeze` wrappers.
- TypeScript `transpileModule` syntax diagnostics passed for all three changed files (3/3).
- Source-level terminal structure was inspected after edits.
- The Phase 2699 audit script was attempted, but it exited with `EACCES` while trying to write
  `PHASE2699_FULLY_TYPED_RUNTIME_SCANNER_OPERATIONS_AUDIT.json` into the read-only workspace.
  Therefore that audit script is **not reported as passing** in this run.
- Full TypeScript typecheck, package build, unit tests, and CLI end-to-end execution were not run.

## Upstream semantic frontier (not hidden)
The object/interface refactor does not implement missing production semantic reasoning or independent
proof verification. Those upstream authority obligations remain unresolved and must continue to fail
closed rather than be papered over with a fallback.

## External language reference
TypeScript interfaces can describe object shapes and call signatures; the official handbook supports
using explicit interfaces to constrain runtime object contracts:
https://www.typescriptlang.org/docs/handbook/2/objects.html
https://www.typescriptlang.org/docs/handbook/interfaces.html
