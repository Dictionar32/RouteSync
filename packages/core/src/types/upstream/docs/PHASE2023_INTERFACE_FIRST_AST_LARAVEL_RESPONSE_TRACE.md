# Phase 2023 — Interface-first trace: AST, Laravel invocation, integrated response

## Result

This phase records the actual ownership boundaries found in the supplied RouteSync source. It does not claim that the full AST classifier has been migrated away from `RelationOption`.

## AST findings

- `astClassifierEvidenceContract.ts` defines the existing `AstClassifierEvidenceInterface`; it is a syntax request/response port (`expression` / `block`), not the semantic arbitration contract.
- `scannerAstExpressionCandidateInterface.ts` owns expression candidate identity and the canonical precedence list.
- `scannerExpressionJudgmentInterface.ts` plus `scannerExpressionStructure.ts` define an upstream-owned closed judgment for **compound expression structure** only. It is already used by `phpExpressionStructureEvidenceProvider.ts`.
- `astClassifierRuntime.ts` still uses `SemanticDecisionContract`, `semanticDecisionAlgebra.resolve/verifyProof`, callback-based `expressionRule`, and `RelationOption` throughout its parser implementation. Replacing that with `AstClassifierEvidenceInterface` alone would be a category error: the outer port does not encode the selected semantic rule, attempts, proof, or malformed/blocked outcomes.

## Recommended interface evolution

Do not add a `relation` or `foundation` subscanner and do not introduce a duplicate broad semantic authority.

1. Keep `AstClassifierEvidenceInterface` as the public syntax port.
2. Evolve the existing candidate/judgment contracts upstream so the **full expression classifier** has a closed judgment with candidate identity, precedence evidence, attempts/provenance, malformed source, unsupported expression, and contract violation.
3. Reuse `ExpressionStructureJudgmentInterface` for the subset it already owns (compound structures); do not stretch it to own all PHP expressions.
4. Keep PHP AST construction functions as syntax capabilities supplied to the upstream policy. The authority selects and closes a judgment; the runtime projects that judgment into `PhpAstValue`.
5. Convert relation-based parser helpers incrementally behind this contract. Do not announce “relation-free AST” until all relevant parser functions and consumers have migrated.

## Laravel invocation and integrated response findings

The existing `LaravelControllerInvocationSemanticJudgment` is already a four-outcome closed ADT. The controller scanner contract requires an invocation inventory closure receipt, and scanner wiring passes the exact `invocationJudgment` and `responseJudgment` into response AST projection. Preserve those objects and their outcome/provenance; AST projection must not reconstruct them.

`invocationSemanticRuntimeExecutor.ts` is an execution boundary that delegates to the upstream authority. It should remain thin; semantic classification belongs upstream.

## Explicit scope boundary

No `relation` or `foundation` subscanner is added. This phase does **not** remove all `RelationOption` use from `astClassifierRuntime.ts`; that is the remaining implementation migration, not something an audit or a rename can truthfully claim is complete.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- TypeScript discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

The relevant principle is to let generic consumers depend on semantic contracts rather than hard-code every concrete operation's semantics, and to model outcomes as closed discriminated unions.
