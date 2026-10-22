# Phase 1433 — Upstream expression judgment authority

## Change

`judgeExpressionStructureResolution` now owns the conversion from the ordered candidate algebra's result into the closed `ExpressionStructureJudgment` contract. It centralizes:

- selected candidate identity + source evidence as provenance;
- rejected candidate identities for `not_structured`;
- candidate algebra contract violations;
- the impossible state where arbitration selected a candidate but the adapter supplied no structure (`selected_candidate_without_structure`).

`astClassifierRuntime.ts` unwraps the PHP adapter's `RelationOption` value and consumes the resulting judgment. It no longer manufactures the judgment's variants or reconstructs the attempt trail. `projectPhpExpressionStructure` remains downstream and only projects the already-selected structure into PHP AST nodes.

## Boundary that remains

Candidate-specific PHP evidence acquisition is still declared in `classifyCompoundExpression`: e.g. locating `?:`, resolving conditional token boundaries, identifying call shapes, and supplying PHP unary operators. This phase deliberately does not pretend that moving judgment construction alone migrates all semantic reasoning. The next migration should define an upstream-owned candidate provider/contract interface for those evidence queries, with the PHP adapter supplying evidence and the algebra resolving it; runtime should become wiring + judgment execution only.

## Verification

Run `node scripts/audits/audit-phase1433-upstream-expression-judgment-authority.cjs`. The audit checks the ownership boundary by source invariants. It is not a substitute for the TypeScript build or runtime tests.
