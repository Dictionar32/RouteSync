# Phase 2594 — CLI Program Operation Interface

## Change

`createProgramFromSemanticComposition` is now explicitly typed through `RouteSyncCliProgramFactoryInterface['createFromSemanticComposition']`, and the named `routeSyncCliProgramFactory` export is typed by that interface. The operation composes the existing canonical manifest authority with a host-supplied semantic composition through the existing upstream assembler. Assembly rejection remains a closed result.

## Verified boundary

The 34 canonical law identifiers remain unique. This change does not create a semantic producer, complete verifier, decision authority, or proof packet. It does not use the legacy `RequestType[]` solver as a substitute for judgment.

## Unresolved executable root

The standalone CLI still initializes `createProgram()` without a semantic composition. The new factory is an explicit host integration point, not evidence that the packaged executable has production semantic capabilities. `scan` and `sync` must continue to fail closed until a real upstream capability bundle is provided and the executable root is wired to it.

## Required next evolution

Implement concrete reasoning and independent verification under `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` and its proper semantic operation owners, then connect those implementations at the executable composition root. Do not mint a `derived` judgment or mark law coverage verified from legacy solver output.
