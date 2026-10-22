# Phase 1435 — Expression Judgment Proof Trail

## Objective

Preserve the complete candidate-arbitration evidence across the upstream judgment boundary so that scanner runtime and downstream projection do not need to reconstruct semantic decisions.

## Contract changes

- `structured` carries the selected rule id, selected candidate priority, source token evidence, and the complete algebra-produced candidate attempt trail.
- `not_structured` carries the rejected-rule convenience list and the same attempt trail, including each rule's priority and outcome.
- `contract_violation` remains a closed variant for invalid arbitration contracts and selected candidates that fail to produce a structure.
- The upstream judgment authority copies the attempt trail from `ExpressionCandidateResolution`; it does not recompute ordering or outcomes.

## Pipeline

`Source token evidence → PHP candidate evidence callbacks → ExpressionCandidateAlgebra → ExpressionStructureJudgment → upstream interface → scanner wiring → AST projection`

The PHP callbacks remain syntax-specific evidence acquisition. The algebra owns deterministic arbitration. The judgment owns the closed result and provenance. The runtime consumes that result and projects the selected structure.

## Remaining migration frontier

`astClassifierRuntime.ts` still contains the PHP-specific candidate callback definitions and currently converts malformed conditional/unary evidence into exceptions. The next phase should move those callbacks to a dedicated PHP evidence-provider module and model malformed evidence as a typed source-evidence outcome. Do not move PHP syntax details into the language-neutral algebra, and do not let the runtime choose priorities or reconstruct judgment variants.

## Verification

- `audit-phase1435-expression-judgment-proof-trail.cjs`: 9/9 checks passed.
- `audit-phase1434-expression-arbitration-interface.cjs`: 9/9 checks passed.
- `audit-phase1433-upstream-expression-judgment-authority.cjs`: 9/9 checks passed.
- `npm run build`: not verified; the environment does not have the `tsdown` executable installed.
