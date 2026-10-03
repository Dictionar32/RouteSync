# Phase 573 — Build Trace Resource Binder Export Closure

## Frontier

Close the current DTS build blocker reported by the latest build trace.

## Observed blocker

`packages/core/src/compiler/scanner/binders/SemanticResourceBinder.ts` imports and explicitly re-exports:

- `bindBinaryField`
- `bindNullCoalesceField`

from `./resource`, but `./resource` resolves to the `resource/index.ts` barrel, whose explicit export list did not expose those two canonical composite binders.

The implementations already exist in `resource/composite/literalTernaryBinders.ts` and were already exposed by `resource/composite/index.ts` and `resource/compositeBinders.ts`. The missing edge was only the resource-domain barrel closure.

## Change

Extended `packages/core/src/compiler/scanner/binders/resource/index.ts` to explicitly export `bindBinaryField` and `bindNullCoalesceField` from `./compositeBinders`.

No compatibility wrapper or duplicate implementation was introduced.

## Verification

- The two implementations remain single-sourced in `literalTernaryBinders.ts`.
- `resource/composite/index.ts` already exports both functions.
- `resource/compositeBinders.ts` already exports both functions.
- `resource/index.ts` now closes the export path consumed by `SemanticResourceBinder.ts`.
- Full repository build could not be executed in the checkpoint because the available `node_modules` snapshot does not contain `tsup`; a dependency bootstrap attempt timed out. Therefore no claim of full `npm run build` success is made in this phase.
