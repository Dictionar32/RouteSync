# RouteSync Phase 2558 — CLI Authority Before Source Acquisition

## Implemented

- `scan` and `sync` now require the upstream `RequestTypeDerivationSemanticPipelineInterface` before source-project setup and manifest scanning.
- The exact required pipeline value is reused when calling `projectRouteSyncManifestForRouteManifest`; there is no second lookup after preflight.
- Added `audit:phase2558-cli-authority-before-source-acquisition` and a structural audit for the fail-fast order and the preserved manifest-bound preflight packet.
- Updated the Phase 2554 and Phase 2557 audits to reflect the explicit pipeline variable.

## Active path

`CLI scan/sync → require upstream semantic pipeline → source manifest producer → canonical manifest-bound preflight (inventory + identity + request/resource assessments) → closed resolution gates → authority-backed projection → authority-backed lowering consumes exact preflight input/evidence/ledgers → semantic pipeline derive → assessment integrity validation → closed judgment ADT → downstream projection`.

The inventory and occurrence identity remain owned by the existing upstream contracts and operations. The active authority path does not import the legacy `RequestType[]` solver, and the Phase 2557 composition path does not introduce `semantic/relations` or `semantic/foundation` dependencies.

## Root cause still open — do not misreport as complete

The repository still lacks a concrete production composition implementing all four existing upstream capabilities for the current source input:

1. `RequestTypeDerivationSemanticReasoningInterface` — a real source-evidence-to-closed-judgment producer.
2. `RequestTypeDerivationProofVerificationInterface` — a complete verifier for all 32 required laws (the current source-occurrence guard only checks three laws and delegates the rest).
3. `RequestTypeDerivationSemanticDecisionInterface` — decision proof composition over the exact inference and verification witnesses.
4. `RequestTypeDerivationSemanticAuthorityInterface` — source-bound authority adjudication.

`assembleRequestTypeDerivationProductionPipeline` correctly assembles supplied capabilities and checks canonical contract object identity, but does not create the missing capabilities. The CLI therefore still fails closed at `requireRequestTypeDerivationSemanticPipeline()` until a real composition is supplied. This phase moves that failure before source acquisition; it does **not** claim that the semantic producer is complete or that the CLI can currently complete a scan.

Do not bridge this gap by wrapping the legacy solver's `RequestType[]` output as a `derived` judgment or by marking the partial source-occurrence guard as a complete 32-law verifier.

## Verification

Structural audits passed: Phase 2552 (11/11), 2535 (14/14), 2542 (12/12), 2543 (12/12), 2544 (6/6), 2554 (20/20), 2555 (7/7), 2556 (11/11), 2557 (12/12), and 2558 (9/9), total 114/114 assertions.

No full typecheck, package build, Vitest suite, or CLI end-to-end run is claimed in this phase.

## Reference

The TypeScript Handbook describes interfaces as named structural contracts and discriminated unions as a way to encode closed alternatives with narrowing/exhaustiveness. Those concepts support the contract/ADT direction but do not substitute for implementing RouteSync's domain-specific 32-law verifier:
- https://www.typescriptlang.org/docs/handbook/2/objects.html
- https://www.typescriptlang.org/docs/handbook/2/narrowing.html
