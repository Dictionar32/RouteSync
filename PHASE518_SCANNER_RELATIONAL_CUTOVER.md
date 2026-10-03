# Phase 518 — Scanner Relational Cutover

## Scope

This phase closes two remaining imperative scanner surfaces:

- `packages/core/src/compiler/scanner/subscanners/FormRequestScanner.ts`
- `packages/core/src/compiler/scanner/descriptors/validation/validationRuleSet.ts`

The migration keeps scanner syntax as evidence and moves selection, presence, traversal, aggregation, and canonical construction into the relational kernel.

## Architecture

`scanner evidence -> relation facts -> candidate/option witness -> recursive relation traversal -> canonical semantic value`

### FormRequestScanner

- file discovery is accumulated through `relationAsyncFold`
- method discovery uses `relationFirstOption`
- authorization evidence is resolved through relation options and gates
- rules/return anchors use relational index witnesses
- method scanning is a depth-state relation fold
- AST collection construction uses recursive sequence closure rather than collection reducers

### validationRuleSet

- root aggregation is a relation fold over validation entries
- root lookup is an option witness over relation entries
- property merge uses relational index selection and projection
- nested object fields use recursive relation folds
- validation requirements use first-witness resolution
- field/tree construction uses relation gates and projections

## Forbidden-surface audit

Run:

`npm run audit:scanner-lexer:phase518`

Expected result: every forbidden construct count is `0` and `closedSurfaceClean` is `true`.

## Validation

Both target files were passed through TypeScript `transpileModule` with zero transpile diagnostics.

A full repository typecheck is not claimed because the workspace has pre-existing dependency/type-environment limitations.

## Research basis

The direction follows declarative static-analysis and rewrite architectures: fact enrichment and closure in Rascal, declarative pattern/rewrite separation in MLIR PDLL/PDL, and the combination of relational reasoning with equality saturation in egglog. These systems reinforce the design rule used here: scanner code should emit evidence while semantic resolution and transformation are represented as relations, constraints, witnesses, closure, and rewrites. 
