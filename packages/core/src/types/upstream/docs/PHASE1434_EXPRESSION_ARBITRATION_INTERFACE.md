# Phase 1434 — Expression arbitration interface authority

## Boundary change

`resolveExpressionStructureJudgment` is now the single upstream entry point that combines ordered candidate arbitration with construction of the closed `ExpressionStructureJudgment`. It accepts a typed candidate contract, original source evidence, and an adapter projection from the selected candidate value to a language-neutral expression structure.

The scanner runtime no longer imports or invokes `scannerExpressionCandidateAlgebra.resolveFirst`, nor does it separately unpack a resolution and pass it into a judgment constructor. It invokes the upstream authority and consumes the resulting closed judgment for projection.

## Intended flow

1. Source evidence: PHP token descriptors remain owned by the PHP scanner adapter.
2. Semantic reasoning algebra: candidate arbitration and priority validation remain in the upstream candidate algebra.
3. Closed judgment/contract: upstream produces `structured`, `not_structured`, or `contract_violation`, with provenance or rejected-rule history.
4. Interface/wiring: `resolveExpressionStructureJudgment` is exported from the upstream barrel and wired into the scanner.
5. Runtime executor: consumes the judgment and dispatches to AST projection.
6. Downstream projection: `projectPhpExpressionStructure` constructs the PHP AST representation.

## Remaining migration frontier

This phase moves arbitration authority behind the upstream contract, but candidate evidence construction and PHP syntax applicability callbacks still live inside `classifyCompoundExpression`. The next phase should extract those callbacks into a PHP-specific source-evidence provider under `compiler/scanner`, while keeping ordering, arbitration, provenance, and closed judgment in `types/upstream`. The provider should return evidence/candidate contracts rather than making the final semantic decision.

## Validation

Run `node scripts/audits/audit-phase1434-expression-arbitration-interface.cjs` from the repository root. This is a source-boundary audit, not a substitute for TypeScript build or runtime tests.


## Phase 1435 — preserve arbitration proof in the closed judgment

The closed judgment now carries the algebra-produced attempt trail for both successful and unsuccessful resolution. A successful judgment records the selected rule, its priority, source evidence, and all attempts. A `not_structured` judgment retains the full attempt trail alongside the convenience list of rejected rule IDs. This prevents downstream consumers from reconstructing arbitration history from the candidate contract.

The remaining migration boundary is explicit: `astClassifierRuntime.ts` still declares PHP-specific candidate evidence callbacks and still throws for malformed ternary/unary evidence. Those callbacks are language evidence acquisition, but malformed evidence should next become a typed source-evidence outcome instead of an exception; candidate assembly can then move to a dedicated PHP evidence provider while the upstream algebra remains the sole arbitration authority.
