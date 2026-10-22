# Phase 2034 — Assignment Parts Component Judgment, Interface First

## Trace finding

`AssignmentPartsQuery` exposed `classifyTarget` and `classifyValue` as `Target | undefined` and `Value | undefined`. This weakened the semantic boundary: the algebra had to infer whether an absent payload meant a valid unresolved classification and runtime callbacks returned sentinel values instead of explicit judgments.

## Contract change

The canonical upstream interface now requires `AssignmentPartsComponentJudgment<T>` for both target and value classification:

- `resolved` carries the classified value.
- `unresolved` carries the explicit `not_recognized` reason.

The assignment-parts algebra consumes the judgment's discriminant and payload. It no longer treats `undefined` as the semantic result for canonical target/value callbacks. Legacy `RelationOption` conversion remains only in `resolveLegacy`, as a compatibility boundary while callers migrate.

## Runtime and invariants

`astClassifierRuntime.ts` adapts existing AST classifiers to the explicit judgment contract. The AST projection, Laravel invocation semantic judgment, and integrated response authority paths are not replaced or duplicated. No `relation` or `foundation` subscanner was introduced.

## Verification limits

Run `npm run audit:phase2034-assignment-parts-component-judgment-interface-first` and the adjacent phase audits. These are structural audits, not a substitute for full TypeScript compilation or integration tests.
