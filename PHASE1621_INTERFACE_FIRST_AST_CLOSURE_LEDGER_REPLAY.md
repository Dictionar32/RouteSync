# Phase 1621 — Interface-First AST Closure Ledger Replay

## Scope

Continue strengthening the existing `packages/core/src/types/upstream/astSemanticInterface.ts`. No scanner wiring, request-type derivation contract, semantic algebra, or runtime executor was changed.

## Trace and model finding

Phase 1620 bound request, seed, rules, fact set, and ledger identities, but the verifier still had a soundness gap: it validated recorded derivations individually against the final fact set, without replaying derivations round by round. A forged final fact set could therefore potentially contain unsupported facts or omit a required derivation while presenting a self-consistent identity envelope.

## Contract change

- Added `AstSemanticClosureDerivation`, which carries an explicit typed derivation round.
- The derivation ledger identity includes the round.
- `verifyClosure` rejects duplicate rule identities and replays each round from the seed facts.
- Replay verifies that every newly enabled conclusion has exactly the corresponding derivation, that its premises were available before that round, that the witness matches the rule and round, and that the replayed final fact set equals the claimed closure.
- The verifier checks the fixed-point condition against every rule at the final fact set.
- Added a regression fixture that removes a necessary derivation while keeping the final fact set and identity envelope self-consistent; verification must reject it.

## Boundary discipline

This is a structural replay verifier over the declared rule set. It still trusts the semantic meaning of each rule definition and the integrity of source evidence. It is not a cryptographic signature or a proof that a rule is domain-correct. Scanner consumers found in Phase 1620 do not directly call `astSemanticInterface.close`; end-to-end authority wiring remains unproven and intentionally unchanged.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- TypeScript Handbook, Narrowing and discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

These support explicit compiler contracts and closed outcome modeling; the round-replay checks are a RouteSync-specific integrity requirement, not a claim made by those docs.

## Validation

Record only commands actually run for this phase. The targeted Vitest and full build must not be claimed as passing unless completed successfully.

Validation performed:

- Phase 1617, 1618, 1619, 1620, and 1621 structural audits passed.
- A focused TypeScript invocation reported 34 diagnostics in other upstream/domain dependency files; it reported no diagnostic naming `astSemanticInterface.ts`. This is not a successful project typecheck.
- Vitest is not installed in this workspace, so the targeted test file could not be executed.
- Full build was not run/verified.
