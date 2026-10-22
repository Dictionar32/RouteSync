# Phase 1636 — Invocation Semantic Judgment / Interface First

## Intent

The canonical concept is **Invocation Semantic Judgment**, not `callable boundary`. A callable relation is one evidence relation used by the invocation model; it is not the model's public semantic result.

The scanner's invocation facade must only forward the canonical interface and authority. Declarative policy lives in `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`; the algebra interprets that policy; the authority is a thin binding; the generic executor performs generic rewrite mechanics.

## Changes

1. **Canonical module names**
   - Added `invocationSemanticJudgmentInterface.ts`, `invocationSemanticJudgmentAlgebra.ts`, and `invocationSemanticJudgmentAuthority.ts`.
   - Kept the older `semanticInterproceduralDataFlow*` filenames as compatibility re-exports, not as a second authority.
   - The upstream barrel exports the canonical interface and authority.

2. **Interface-owned rule catalog**
   - `INVOCATION_SEMANTIC_CONTRACT` version 2 owns the rule catalog for target resolution, positional argument binding, result emission, exception emission, unresolved-target obligations, and judgment closure.
   - Rule declarations are typed discriminated data; the algebra lowers target-resolution policy into the generic rewrite protocol rather than restating the semantic role and relation literals.

3. **Judgment and proof integrity**
   - Closed judgments and closed proofs require an empty obligation tuple at the type level.
   - Incomplete obligations carry a reason (`no_resolved_callable_target` or `argument_without_parameter`).
   - Proofs contain structured rule outcomes with derived-fact and obligation counts, alongside source evidence and the generic rewrite judgment.
   - Solver saturation is not treated as semantic closure. Known facts remain available in incomplete judgments.

4. **Scanner boundary**
   - `semanticInterproceduralDataFlowRelations.ts` delegates directly to the canonical invocation interface and authority.
   - The authority facade is 37 lines and delegates analysis to the canonical algebra.
   - Legacy filenames remain for compatibility and only re-export canonical modules.

5. **Regression coverage**
   - The existing invocation test now checks the canonical rule catalog and structured proof trace.
   - The incomplete argument-binding case checks its rule outcome.
   - A missing target case verifies that missing callable evidence produces an explicit unresolved obligation rather than a closed empty result.

## Trace result and remaining migration frontier

A source scan found 371 production TypeScript files under `packages/core/src/compiler/scanner`. Of these, 157 still directly import a module under `semantic/foundation`; 114 refer to `semanticRelations`; 140 refer to `relationalSequence`. These counts overlap.

Therefore this phase makes the **invocation semantic path** interface-first and thin, but it does **not** claim the entire scanner is thin yet. The next migration should classify those remaining imports into (a) syntax/data-structure utilities, (b) generic relational execution mechanics, and (c) domain semantic reasoning. Only category (c) belongs in domain-specific judgment interfaces/algebras; generic mechanisms should remain generic and syntax extraction should remain in the scanner.

`semantic/foundation` has not been emptied: the measured consumer frontier shows that doing so now would break imports.

## Validation

- Focused TypeScript check for canonical interface, algebra, authority, and compatibility facades: passed with global TypeScript 5.8.3 and strict options excluding `noUncheckedIndexedAccess`.
- Focused TypeScript check for the invocation regression test: passed using a temporary ambient Vitest declaration because Vitest is not installed.
- Static audit `scripts/audits/audit-phase1636-invocation-semantic-judgment-interface-first.cjs`: passed.
- `npm run build`: blocked because `tsdown` is not installed (`sh: tsdown: not found`).
- Runtime Vitest suite: not run because Vitest is not installed in this workspace.
