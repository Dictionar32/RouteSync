# Phase 1558 — Interface-First Self-Contained Semantic Decision Proof

## Objective
Strengthen the semantic decision interface itself. This phase does not relocate runtime functions; it makes the judgment proof carry the policy context needed for downstream verification and makes scanner/authority wiring enforce that proof.

## Trace
- `packages/core/src/types/upstream/semanticDecisionInterface.ts`: `SemanticDecisionProof` previously carried only the evaluated prefix, total rule count, termination, and a `complete` flag. A consumer could not independently compare the proof's rule order and precedence snapshot with the contract.
- `packages/core/src/types/upstream/semanticDecisionAlgebra.ts`: the algebra chooses rules according to explicit precedence, then emits the judgment. It now includes canonical `orderedRuleIds` and the declared `precedence` snapshot in the proof and exports `verifyProof` through `SemanticDecisionInterface`.
- `packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts`: verifies a non-violation judgment against the same contract before projecting the result into AST.
- `packages/core/src/types/upstream/controllerVariableSemanticAuthority.ts`: verifies the decision proof before projecting it to the domain authority judgment.
- Regression suites: assert the proof carries policy context and that tampering with the canonical order is rejected without invoking rule callbacks again.

## Model change
`SemanticDecisionProof` is now self-contained with respect to the declared decision policy:
- `orderedRuleIds`: canonical rule order derived from precedence, not declaration-array order;
- `precedence`: a snapshot of the contract's precedence edges;
- `evaluated`: the exact prefix evaluated by the resolver;
- `termination`: `selected` or `exhausted`;
- `complete`: the proof record itself is complete, not a claim that all rules ran after early selection.

`SemanticDecisionInterface.verifyProof` validates rule order, precedence snapshot, receipt prefix, and termination without re-running semantic callbacks. It does not prove that an individual callback implements the language semantics correctly; that remains the responsibility of the semantic rule/authority implementation and its tests.

## Verification
- TypeScript 5.8.3 targeted compile of `semanticDecisionInterface.ts` and `semanticDecisionAlgebra.ts`: passed.
- Isolated Node runtime assertions against emitted JavaScript: 7 assertions passed (precedence-based selection, proof order, valid proof, tampered order rejection, exhausted judgment, exhausted proof verification, and malformed receipt rejection).
- Broader targeted typecheck that reaches scanner/upstream transitive dependencies: blocked by pre-existing errors in unrelated modules, including `queryEvidenceProducer.ts`, `semanticEvidenceRelations.ts`, `resourceModelKeyCapability.ts`, `routeSecurityAuthority.ts`, and semantic dataflow/reasoning modules. No full monorepo build or Vitest run is claimed.

## Remaining scanner frontier
This phase does not claim to migrate all scanner reasoning. `RequestTypeDeriver.ts`, `request-deriver/groupAggregator.ts`, and language-specific handlers in `astClassifierRuntime.ts` still require a rule-by-rule ownership trace. Next work should strengthen the RequestType authority contract and move domain rule ownership upstream before changing scanner wiring.
