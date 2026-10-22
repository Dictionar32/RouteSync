# Phase 1633 — Interface-first scanner runtime audit

## Intent

Keep scanner runtime limited to source/syntax evidence extraction, typed request construction, interface invocation, and projection of an already-produced judgment. Domain semantic rules belong to canonical upstream contracts/algebra; a generic runtime executor may execute those rules but must not infer domain meaning itself.

## Trace findings from Phase 1632 baseline

- `packages/core/src/compiler/scanner`: 537 files total, 458 TypeScript files.
- 168 scanner files import `semantic/foundation` directly.
- By helper family, scanner imports include `semanticRelations` (114 files), `relationalSequence` (144), `relationMembership` (27), `semanticRewriteEngine` (10), and `semanticRelationalCollections` (1). Counts overlap.
- Three scanner files are compatibility facades that re-export upstream authority/contracts for object identity, constraint handling, and interprocedural data-flow.
- The three facades are progress, but they do not make the scanner globally thin: many scanner parsers, resolvers, descriptors, and projections still depend directly on generic relation primitives. Each dependency must be classified as syntax/evidence mechanics, reusable algebra, or domain semantic reasoning before migration; moving every generic collection helper into scanner-specific interfaces would only relocate low-level code.
- `semanticInterproceduralDataFlowAuthority.ts` had an unsound incomplete-result shape: when rewrite closure was incomplete it discarded all derived partial results and returned empty tuples. That erased known facts and did not identify unresolved invocation targets.
- `semanticInterproceduralDataFlowInterface.ts` described `call-target` as the only rewrite outcome of a `data-flow(..., callable)` rule. This is a useful internal rule, not the complete invocation contract.

## Phase 1633 contract change

`SemanticInterproceduralDataFlow` now preserves any known call targets, argument bindings, return flows, and exception flows even when closure is incomplete. Incomplete judgments additionally carry typed `unresolvedObligations` for invocations without a resolved target. The authority now constructs the same projection for closed and incomplete proof results and selects the result variant based on the proof's actual closure status.

This is a contract-correctness improvement, not a claim that all scanner semantics have been migrated. `callable-boundary` remains a low-level internal rewrite rule.

## Required migration order

1. **Inventory scanner files by responsibility**: lexical/syntax evidence; typed semantic facts; domain inference; target projection; generic collection/execution mechanics.
2. **Stabilize canonical interfaces first** in `types/upstream`: input evidence, semantic model, domain judgment, closure/completeness, proof/provenance, unresolved obligations, and projection capabilities.
3. **Move domain rules into declarative upstream rule catalogs/algebra**. Keep rule identifiers and relation vocabularies canonical; do not duplicate them in scanner facades.
4. **Make authorities consume typed semantic knowledge and return closed judgments**. Authorities may orchestrate reasoning but should not re-parse syntax or invent fallback semantics.
5. **Reduce scanner to wiring**: `evidence -> upstream interface -> judgment -> projection`. Scanner must not create alternate executors or reclassify a judgment.
6. **Only then remove direct scanner dependencies** on semantic-domain helpers. Keep generic algebra utilities in one canonical location and expose them through the appropriate abstraction boundary rather than copying them into every interface.
7. **Audit and verify**: import-boundary audit, tests for closed/incomplete judgments and provenance, targeted typecheck, package build, and end-to-end RouteSync examples.

## Verification

- Targeted TypeScript check for `semanticInterproceduralDataFlowInterface.ts` and `semanticInterproceduralDataFlowAuthority.ts`: PASS with global `tsc --noEmit --target es2020 --moduleResolution node --module commonjs --strict --skipLibCheck`.
- Full package build/tests: NOT RUN; this workspace does not contain `node_modules`.
- `semantic/foundation` has NOT been emptied. It remains a shared dependency of upstream and scanner and must not be emptied until all active consumers have been migrated.
