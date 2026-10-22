# Phase 1565 — Request-Type Counterexample Interface

## Scope

This phase strengthens only the upstream request-type derivation interface. It does not implement the semantic authority, rewire scanner consumers, or alter the runtime executor.

## Model gap addressed

Before this phase, `RequestTypeDerivationVerification` returned either `valid` or `invalid` with a reason string. A consumer could learn that a contract law failed, but the interface did not require the verifier to return a typed semantic witness identifying the affected source domain, route, group, policy, closure, or ledger.

## Interface change

- Added `RequestTypeDerivationVerificationFailure`, a discriminated union where every `invalid` result requires an `evidence` payload.
- Inventory and receipt-coverage failures carry the source domain and expected/actual evidence-key sets.
- Route disposition failures carry the route and expected/actual dispositions.
- Group, output, transition, relation, policy, closure, unresolved-ledger, and conflict-ledger failures carry typed expected/actual or source-bound witnesses.
- The `valid` variant names the proof kind it validates.
- The upstream barrel already exports this interface; no duplicate export path was added.

## Architecture order

`Source evidence -> semantic judgment/proof -> interface contract -> semantic authority/verifier -> scanner wiring -> scanner simplification -> runtime executor`.

Scanner and executor changes remain intentionally deferred. A typed counterexample contract is useful only when the later authority implementation constructs these witnesses from real validation, not fabricated placeholders.

## Verification

- Static interface audit: 23/23 checks passed.
- Full package build and Vitest were not run.
- No claim is made that the authority implementation or runtime migration is complete.
