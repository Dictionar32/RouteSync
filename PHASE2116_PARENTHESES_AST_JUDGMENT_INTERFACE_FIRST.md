# Phase 2116 — Parenthesized AST Judgment Interface-First

## Scope

This phase migrates one AST expression candidate from the legacy `RelationOption` adapter to the existing upstream token-structure judgment and the existing closed AST rule-resolution ADT. It deliberately does not claim that `astClassifierRuntime.ts` is globally relation-free.

## Trace

Before this change, `classifyParenthesized` used `relationGate`, `relationAny`, `relationNotEqual`, `relationEqual`, `relationCount`, `relationAdvanceIndex`, `relationSlice`, `relationSome`, and `relationNone`, returning `RelationOption<PhpAstValue>`. The parenthesized rule then entered the `legacy_adapter` branch and translated that relation option into an AST rule judgment.

After this change, `classifyParenthesized` calls `scannerTokenStructureInterface.matchLeadingDelimiter` and returns `AstRuleResolution<PhpAstValueNode, AstClassificationSourceFailure>` directly:

- `not_found` becomes `not_resolved`;
- malformed delimiter evidence becomes `malformed_parenthesized_expression` and retains the original upstream delimiter judgment;
- a matching outer pair with no suffix projects the already-classified contents;
- other matched delimiters or delimiter pairs with suffix remain `not_resolved` so the ordered candidate policy can continue.

The parenthesized candidate is now registered as a `judgment` resolver rather than a `legacy_adapter`. No new parser authority, relation subscanner, or foundation layer was introduced.

## Invariants preserved

- The public AST classifier retains the overload-correlated expression/block request/result interface.
- Candidate ordering and arbitration remain owned by `AstClassificationRuleAlgebraInterface` and the upstream precedence policy.
- Delimiter matching remains owned by `ScannerTokenStructureInterface`.
- The AST runtime still contains legacy relation adapters for other expression candidates; this phase only removes the parenthesized candidate's adapter.
- Invocation judgment, integrated response judgment, and runtime executor contracts are unchanged by this narrowly scoped AST migration.

## Verification

Run the focused static audit with:

`node scripts/audits/audit-phase2116-parenthesized-ast-judgment-interface-first.cjs`

The corresponding Vitest regression is `astParenthesizedExpressionJudgment.phase2116.test.ts`. Build, TypeScript typecheck, and Vitest execution are not asserted by this phase.
