# Phase 366 — Relational Authority Cutover

This phase is an authority cutover, not a cosmetic rename.

## Research basis

The architecture follows the common semantic split found in declarative compiler/formal-language systems:

- Souffle: semantics are relations and Horn rules; negation is a relation-level condition and recursive rules compute closure.
- MLIR PDLL/PDL: matching and rewriting are represented declaratively, with rewrite patterns separated from the matcher.
- egglog: Datalog relations and equality-saturation rewrites operate over one semantic database.
- Statix: name binding is expressed as scope-graph constraints rather than parser control flow.
- Maude: executable semantics are expressed as equational/rewrite theories.

## RouteSync boundary

`astClassifierEvidence.ts` and `queryEvidenceProducer.ts` remain syntax-evidence adapters. They are not semantic authorities.

The canonical downstream boundaries are now:

- `astClassifier.ts`
- `queryProducer.ts`
- `parserAdapterRelations.ts`
- `semanticRelationSolver.ts`
- `syntaxErrorRelationCore.ts`
- `ternaryHandler.ts`

Production consumers were redirected away from the evidence filenames. Evidence can therefore be migrated internally without changing the semantic dependency graph again.

## Forbidden host constructs

The semantic authority layer must not use:

- `if`, `for`, `while`, `switch`
- `.map`, `.filter`, `.reduce`, `.flatMap`
- JavaScript/TypeScript `undefined` as absence
- JavaScript/TypeScript `null` as absence
- `??`
- `===`, `!==`
- TypeScript `as`

PHP source-level `null` remains a tagged semantic fact; it is not implementation absence.

Absence is represented by `RelationOption` / `Presence`. Selection, projection, expansion, folding and fixed-point closure are relation operations. Rewriting is represented as relation rules.

## Next migration frontier

The remaining large reservoirs are syntax-evidence adapters and legacy orchestration files, especially:

- `queryEvidenceProducer.ts`
- `astClassifierEvidence.ts`
- `compiler/index.ts`
- `compiler/contracts.ts`
- canonical scanner producers and controller/resource adapters

Those files must be migrated by replacing their semantic decisions with relation facts + solver/rewrite closure, not by mechanically replacing keywords.
