# Phase2475 — Resource Field Producer Interface Wiring

## Baseline and scope

Baseline: Phase2474 ZIP. This phase changes the existing resource producer contract and its consumers; it does not modify the user's local workspace and does not claim the entire Laravel scanner is now interface-first.

## Trace findings

- `ResourceProducer` already existed and was consumed by the canonical resource producer path.
- `produceResourceField` was a separately exported positional-parameter function used by the producer and binder. The contract did not name this field-level operation.
- `twoPassRelationResolver.ts` has no production TypeScript callers in `packages/core/src`; its exports are orphaned from the current production path, although historical audit scripts and documentation still reference the file. It was not deleted because legacy audit scripts depend on its presence. This remains a known relation-algebra subscanner frontier.
- No `semantic/foundation` import was found in the resource field producer before or after this change. This phase does not claim the remaining `semantic/relations` imports across all subscanners are closed.

## Changes

- Extended the existing `ResourceProducer` interface with `produceField` and a named `ResourceFieldProducerInput` object contract.
- Changed `produceResourceField` to `export const produceResourceField: ResourceProducer['produceField']`.
- Wired `resourceProducer` and the resource binder to call the existing `produceField` operation with a single typed input object rather than positional arguments.
- Typed the binder's compatibility entry point from the existing producer operation instead of repeating its parameter types.
- No files were moved and no duplicate producer interface was created.

## Verification

- Phase2475 static audit: 8/8 passed.
- Phase2474 static audit: 8/8 passed.
- TypeScript syntax transpilation of the three changed TypeScript files: 3/3 passed.
- Full `npx tsc --noEmit` remains blocked by repository-wide pre-existing syntax errors in `effectiveControllerActionPolicyResolver.phase921.test.ts` and unsupported target/lib values in the repository tsconfig under installed TypeScript 5.8.3.
- A targeted TypeScript check of the three changed files traverses the existing import graph and reports many unrelated repository errors; none of the reported diagnostics are in `resourceFieldProducer.ts` or `resourceBinder.ts`. `resourceProducer.ts` has numerous existing diagnostics in unrelated sections, so this is not a successful typecheck.
- Full Vitest suite, package build, and end-to-end CLI were not run.

## Remaining work

The resource field producer still imports `semantic/relations` helpers for AST discrimination, sequence construction, and field/output projection. Those operations cannot be removed safely by mechanical substitution: the next step is to trace which decisions are already owned by upstream semantic authorities and wire those exact contracts. The orphaned `twoPassRelationResolver.ts` also needs a deliberate retirement or replacement decision coordinated with the historical audits that still name it.
