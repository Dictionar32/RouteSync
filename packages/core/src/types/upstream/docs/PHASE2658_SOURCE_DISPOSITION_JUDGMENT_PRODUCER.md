# Phase 2658 — Source-disposition judgment producer

## Root cause addressed

The earlier producer stopped at duplicate-identity rejection and threw for every collision-free input. That meant the canonical AST/source inventory and request/resource resolution ledgers were wired into the reasoning interface but did not yet yield the already-representable `incomplete` and request-ambiguity `conflict` ADTs.

## Implemented source-grounded paths

`export const requestTypeDerivationSemanticReasoning: RequestTypeDerivationSemanticReasoningInterface` now supports:

1. `invalid_input` for duplicate canonical source identity, retaining canonical occurrence witnesses.
2. `incomplete` when a source route has unresolved request/resource evidence or an unresolved request binding, provided no route is contribution-eligible. The proof records route, resource, and request dispositions, source evidence, relation rows, and closure counts.
3. `conflict` for ambiguous request identity, retaining the route and all ambiguous request candidates. Mixed unresolved routes remain counted in the conflict closure instead of being silently dropped.

The independent `requestTypeDerivationProofVerifier` remains a separate capability. It independently verifies duplicate-identity rejection only. It does not claim the full 34-law verifier exists and therefore fails closed for the new `incomplete` and `conflict` judgments until their proof laws have independent checks.

## Explicit unsupported branches

The producer raises `RequestTypeDerivationSemanticProducerGapError` when:

- a route is contribution-eligible and action/response contribution plus group-fold receipts are not produced;
- resource ambiguity or route/binding resource identity mismatch lacks a dedicated source-grounded conflict ADT;
- a closed `derived` judgment would be required but group contribution and closure proof production is not implemented.

These are intentionally not converted into success-shaped outputs. Decision, authority, and integrity are still typed fail-closed stages, so the CLI can trace the path and report the exact boundary but cannot yet complete a successful semantic derivation.

## Active path

`CLI scan/sync → standaloneCompositionLoader → requestTypeDerivationSemanticComposition → preparation → reasoning → independent verifier → decision → authority/integrity → manifest projection`.

The preparation operation consumes AST-backed `RequestTypeDerivationInput`, then builds the canonical source evidence inventory and both resolution ledgers. The producer does not re-parse ASTs or invent local identity rules.

## Validation

- Phase 2656 producer interface audit: 11/11.
- Phase 2657 CLI/manifest/upstream path audit: 17/17.
- Phase 2658 source-disposition producer audit: 13/13.
- Focused TypeScript check of the changed producer reports no errors in that file, but repository imports expose unrelated pre-existing type errors in domain/upstream modules. Full project typecheck and CLI runtime tests are not validated because the repository dependencies are not installed.

Structural audits are wiring evidence only; they are not proof of all 34 semantic laws.
