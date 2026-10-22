# RouteSync Phase 1578 — Interface-first semantic authority closure

## Scope

This phase changes only `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` and adds a structural audit plus this trace note. It deliberately does not wire the new interface into the scanner or change the authority implementation/runtime executor.

## Trace

- `core/src/types/upstream/requestTypeDerivationInterface.ts`: owns the canonical source-evidence, relation, closure, judgment, and verification types. Phase 1578 strengthens the authority outcome algebra here.
- `core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts`: remains an orchestration path using `createDerivationContext` and `aggregateRequestTypeGroups`; unchanged in this interface-only phase.
- `core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts`: remains the current aggregation implementation; unchanged.
- `core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts`: still classifies judgment/verification combinations imperatively; unchanged and explicitly a future migration target.
- `core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts`: unchanged; runtime is intentionally last.

## Semantic model correction

A valid verification establishes that a judgment conforms to the declared laws. It does not convert an `incomplete` judgment into a complete derivation, nor a `conflict` judgment into a conflict-free derivation. Phase 1578 therefore replaces the overloaded `verified` semantic outcome with distinct closed variants:

- `derivation_verified` — only a `derived` judgment with closed closure.
- `incompleteness_verified` — an `incomplete` judgment whose incompleteness itself has been verified.
- `conflict_verified` — a `conflict` judgment whose conflict evidence has been verified.
- `verification_failed` — a non-invalid judgment has a verifier counterexample.
- `input_rejected` — typed input rejection and matching rejection witness.
- `rejection_verification_failed` — rejection was not confirmed.
- `authority_inconsistent` — judgment, verification, witness, or law coverage contradicts the authority contract.

The canonical decision-rule registry has 11 entries. The mapped `RequestTypeAuthorityDecisionRuleCoverage` makes all entries required at the type boundary. This is a declaration of required coverage, not a claim that the runtime implementation already produces proofs for all rules.

## External design references

- TypeScript Handbook, Narrowing / Discriminated Unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- MLIR Declarative Rewrite Rules: https://mlir.llvm.org/docs/DeclarativeRewrites/

These references inform type-level outcome separation and declarative rule modeling; they do not establish that RouteSync's implementation is already wired or semantically verified.

## Verification limitations

`PHASE1578_AUDIT.json` is a structural contract audit. It verifies the model distinctions and hashes that the scanner, authority implementation, and runtime executor are unchanged. It does not prove semantic soundness of an evaluator because no evaluator was added in this interface-only phase. Full build status must be reported separately from this audit.
