# Phase 2024 — AST judgment ADT, Laravel invocation and integrated response

## Source changes in this phase

### Existing AST rule algebra evolved; no parallel authority added

`packages/core/src/types/upstream/astClassifierRuleAlgebra.ts` no longer imports `RelationOption` or any `semantic/relations` helper. Its existing rule contract now returns closed ADTs for applicability and resolution, and `resolveFirst` returns a closed classification judgment with ordered attempts and a selected-rule proof. The same existing algebra now verifies the proof and checks policy ordering against upstream precedence.

`packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts` now uses `AST_CLASSIFICATION_RULES` and the existing rule algebra for expression arbitration. It no longer uses `SemanticDecisionContract`, `semanticDecisionAlgebra.resolve`, or the old semantic-decision proof adapter for that policy. Structured-statement and simple-statement rule selection also consume the new judgment ADT.

### Explicit remaining migration boundary

The AST parser still uses `RelationOption` internally for many parser-specific recognizers and constructors. `resolveFromRelation` is an explicit compatibility adapter at the edge of the new rule judgment; this phase does not claim the entire AST parser is relation-free. The next migration should convert individual parser capabilities to typed AST-specific judgments, preserving malformed/unsupported/contract-violation distinctions, before removing the adapter. Do not add a `relation` or `foundation` subscanner.

### Laravel invocation and integrated response

No parallel invocation model was introduced. The existing four-outcome `LaravelControllerInvocationSemanticJudgmentInterface` remains canonical. Existing scanner wiring forwards the exact `invocationJudgment` and `responseJudgment` into `astProjection.judge`; `invocationSemanticRuntimeExecutor` delegates to the upstream authority. Those paths were audited and retained rather than rewritten without evidence of a defect.

## Static audit results

- Phase 2021 regression audit: 13/13
- Phase 2024 AST judgment ADT audit: 12/12
- Controller request-binding interface audit: 11/11
- AST classifier ADT correlation audit: 7/7
- Invocation outcome uniformity audit: 7/7
- Laravel controller scanner implementation audit: 12/12
- Integrated response runtime audit: 15/15

Total: 77/77 targeted static checks passed. These are static source audits, not a TypeScript build or runtime test.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- MLIR Toy tutorial, generic transformations with interfaces: https://mlir.llvm.org/docs/Tutorials/Toy/Ch-4/
- TypeScript Handbook, discriminated unions and exhaustive checking: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

MLIR's interface model supports generic compiler algorithms without embedding each operation's semantics in the consumer. TypeScript's discriminated unions support explicit outcome variants and exhaustive handling. RouteSync should apply these principles by making upstream judgment contracts authoritative and keeping scanner/runtime wiring thin.
