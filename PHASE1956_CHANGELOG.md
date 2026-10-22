# Phase 1956 — Controller Manifest Terminal ADT, Interface First

## Scope

Trace the existing controller invocation semantic judgment from the upstream inventory closure through the CLI terminal branch and the AST pipeline. Improve the actual boundary where structured rejection evidence was being reduced to an error message.

## Changes

- Advanced `ControllerInvocationManifestCompositionReasoningContract` from v1 to v2 with an explicit rejection-preservation rule.
- Activated the existing `ControllerInvocationManifestCompositionTerminalOutcome` ADT as the closed input to terminal manifest handling.
- Added `ControllerInvocationManifestCompositionRejectedError`, whose `terminalOutcome` retains the exact rejected inventory result and its non-empty typed rejection ledger. The `Error.message` remains a readable summary; it is no longer the only available representation of rejection.
- Kept the validated path passing the exact authority-produced receipt to `manifestBuilder.build`.
- Exported the typed error from the CLI PHP composition surface.
- Added a static audit for the CLI terminal ADT and the inventory receipt's continuity through the source-AST pipeline.

## Trace

`Laravel source files → source invocation semantic pipeline → source-correlated invocation judgments → inventory reasoning interface → validated/rejected inventory ADT → CLI terminal outcome ADT → manifest builder (validated only)`

On rejection, the CLI now preserves the complete rejected ADT in `ControllerInvocationManifestCompositionRejectedError.terminalOutcome`; it does not infer new invocation or integrated-response semantics.

The AST path continues to carry the exact closure receipt through `SourceAsts.controllerInvocationSemanticInventory` and the Laravel controller scanner. The scanner is a consumer of the authority-closed receipt, not a second semantic authority.

## Boundaries

- No `npm run build` was run.
- No runtime integration test runner was run; this phase adds static boundary verification.
- TypeScript `interface` declarations specify the contract; the existing CLI composition implementation executes the terminal projection.
