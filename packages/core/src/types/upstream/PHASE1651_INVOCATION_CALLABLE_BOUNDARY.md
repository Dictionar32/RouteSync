# Phase 1651 — Invocation Callable Boundary

## Contract ownership

`invocationSemanticJudgmentInterface.ts` is the canonical contract for invocation rules, typed obligations, judgment closure, and rule trace. The contract is version 7 and declares the callable boundary's input, validated output, proof-trace, and rejection invariants.

## Enforcement and wiring

- `invocationSemanticJudgmentAuthority.ts` runs the upstream algebra and validates the returned single judgment against the contract before exposing it. Validation checks invocation identity, complete one-entry-per-rule trace coverage, trace subject identity, obligation witness counts, application ownership, proof/judgment obligation consistency, and closed/incomplete consistency. It does not infer targets or create semantic obligations.
- `invocationSemanticRuntimeExecutor.ts` publishes the same contract and delegates `execute` and `executeAll` to their upstream authorities.
- `controllerDataflowAnalyzer.ts` calls `executeAll(semanticKnowledgeDataFlow)` and exposes the resulting invocation analysis on `ControllerDataflowAst`. It does not implement invocation target resolution, argument binding, emission projection, ambiguity, or closure.
- The scanner compatibility facade remains a re-export boundary.

## Important semantic limit

The PHP AST knowledge producer currently emits invocation facts, but this controller-body source slice does not necessarily contain callable declaration facts or callable data-flow evidence. Such judgments remain `incomplete` with explicit obligations; this phase does not fabricate callable evidence. Resolving cross-method or cross-file callable targets requires the wider source-model authority to supply those facts.

## Validation

Run `node scripts/audits/audit-phase1651-invocation-callable-boundary.cjs` and `node scripts/audits/audit-phase1636-invocation-semantic-judgment-interface-first.cjs`. The repository's `npm run build` cannot start in this workspace because `tsdown` is not installed, and Vitest is not installed so the automated test suite could not be executed. Runtime smoke checks with the globally available `ts-node --transpile-only` exercised a real controller-body function call (one invocation, one incomplete judgment, eight trace entries, and a `callable_target_unresolved` obligation) plus direct closed/incomplete authority cases. A focused TypeScript 5.8.3 pass showed no diagnostics in the invocation authority/interface/executor and controller wiring files; broader checking still reports legacy diagnostics in the PHP knowledge adapter and relational code under this older global compiler. The scanner path also exposed and corrected two adapter defects: a missing `relationNotEqual` import, and a source object incorrectly used as the boolean condition of `relationResolve`; the flow wiring was then corrected to preserve typed optional guard evidence rather than nesting a presence wrapper inside a guard.
