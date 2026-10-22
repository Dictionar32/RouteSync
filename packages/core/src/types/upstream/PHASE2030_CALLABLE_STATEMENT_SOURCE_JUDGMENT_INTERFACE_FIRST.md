# Phase 2030 — Callable and statement source judgment preservation

## Trace finding

The upstream callable-list authority already returns closed judgments for parameters, captures, argument lists, and individual arguments. The statement-sequence algebra likewise returns `complete`, `malformed`, or `contract_violation`. Several AST parser boundaries discarded those results by rebuilding generic `Error` messages.

## Interface-first correction

`scannerAstSourceFailureInterface.ts` now extends the existing source-failure ADT with variants that retain the original upstream judgment for:

- callable parameter list malformed/contract-violation outcomes;
- closure capture delimiter and capture-list outcomes;
- callable argument list and individual argument outcomes;
- statement-sequence malformed/contract-violation outcomes.

`astClassifierRuntime.ts` wraps these judgments in its existing `AstSourceJudgmentFailureError` boundary. It does not reclassify the source evidence or invent a second authority. This is a typed preservation boundary, not a claim that the parser API has already been converted wholesale to a result-returning ADT.

## Scope and limits

- No `relation` or `foundation` subscanner was introduced.
- Invocation semantic judgment remains the canonical upstream judgment.
- Laravel controller wiring continues to forward `invocationJudgment` and `responseJudgment` to `astProjection.judge`.
- Legacy `RelationOption` adapters and other generic errors remain outside this phase; they require separate trace-led migrations.
- The audit is structural. No full TypeScript build/type-check is claimed.
