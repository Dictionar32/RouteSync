# Phase 1956 Interface-First Trace

## Existing semantic owner

The core inventory authority remains the sole authority that closes the total correspondence between discovered Laravel controller source files and invocation judgments. The closure receipt carries the source inventory, exact judgments, completeness witness, and integrated-outcome preservation rule.

## Trace findings

1. `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` discovers files, creates source documents, invokes the upstream invocation pipeline, publishes one judgment per result, and asks the core inventory authority to close the source/judgment inventory.
2. The terminal ADT already existed in `controllerInvocationManifestCompositionInterface.ts`, but the previous implementation branched directly on the inventory result and formatted rejection kinds into an ordinary `Error`. That discarded structured rejection details from the thrown value.
3. The terminal ADT is now the explicit input to `closeInventory`.
4. Validated terminal outcome forwards the exact `receipt` to `manifestBuilder.build`.
5. Rejected terminal outcome throws `ControllerInvocationManifestCompositionRejectedError` and retains the exact rejected terminal ADT, including all rejection members and their source identities.
6. `laravelSourceAstPipeline` preserves the exact inventory receipt on `SourceAsts.controllerInvocationSemanticInventory`; the controller scanner receives that same receipt and attaches each source-correlated invocation judgment to its controller scan artifact.
7. No AST projection or CLI branch reconstructs `integratedResponse` or classifies the four upstream outcomes.

## Interface improvement

The interface contract now declares `rejectionPreservation` as a versioned invariant. This is not a second authority and not a relocation of semantic reasoning: the core authority still owns invocation/inventory judgment; the CLI's terminal adapter only maps the closed upstream ADT into either manifest construction or a typed error preserving the original ADT.
