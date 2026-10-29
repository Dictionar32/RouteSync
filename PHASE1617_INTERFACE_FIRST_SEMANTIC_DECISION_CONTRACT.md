# Phase 1617 — Interface-first semantic decision contract

## Scope

This phase improves the existing upstream semantic decision interface model only. It does not change scanner composition, runtime executor, or wiring.

## Trace findings

- `packages/core/src/types/upstream/semanticDecisionInterface.ts` previously exposed a callback-bound `SemanticDecisionRule` (`applies` / `derive`) as the principal contract. That means rule meaning was represented partly as executable behavior rather than declarative semantic data.
- `packages/core/src/compiler/frontend/php/astClassifierRuntime.ts` constructs those callback rules through `expressionRule(...)`. This is a downstream migration target, not changed in this interface-only phase.
- `packages/core/src/types/upstream/semanticDecisionAlgebra.ts` consumes the callback contract today. Its executable solver remains unchanged; changing that solver or scanner wiring before the declarative model is settled would violate the requested sequence.
- `packages/core/src/types/upstream/astSemanticInterface.ts` still owns closure implementation and uses a minimal fixed-point certificate. That is a separate unresolved contract gap and is intentionally not claimed as fixed by this phase.

## Contract model strengthened

The declarative model in `semanticDecisionInterface.ts` now expresses:

- stable string rule identities and policy identity/revision;
- relation atoms as declarative premises and conclusions, with no callbacks in the rule definition;
- source identity plus exact snapshot identity on evidence packets;
- premise witnesses and ordered rule receipts;
- proof binding to contract identity/revision and source snapshot;
- separate outcomes for derived, not-derived, conflicting, incomplete, and rejected contracts;
- explicit policy obligations for precedence completeness, source binding, premise witnesses, and relation vocabulary closure.

The callback-bound `SemanticDecisionRule` / `SemanticDecisionContract` are explicitly deprecated as executable compatibility adapters. They remain for now so the interface-first phase does not silently perform a scanner cutover.

## Validation

- `tsc --noEmit --strict --target ES2022 --moduleResolution node --module ESNext packages/core/src/types/upstream/semanticDecisionInterface.ts`: passed with TypeScript 5.8.3.
- `node scripts/audits/audit-phase1617-interface-first-semantic-decision-contract.cjs`: expected to validate declarative-only rule shape and proof binding.
- Full package build and Vitest were not run because package dependencies are not installed in this workspace.

## Explicitly not done

- No scanner changes.
- No wiring or composition-root changes.
- No runtime executor changes.
- No claim that the declarative model is already the production authority.
- No claim that AST closure or all upstream interfaces are complete.

## Next interface-first gaps

1. Strengthen AST closure certificates to bind the exact closure request, seed snapshot, and rule-set identity.
2. Align request-type inference, verification, and authority assessments around one proof-carrying closed outcome.
3. Specify semantic authority laws and proof verification contracts before any scanner or runtime migration.
