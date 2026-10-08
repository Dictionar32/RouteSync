# Phase 368 — Evidence Relation Cutover

This phase makes the AST/query boundaries consume syntax evidence through an explicit
semantic-evidence relation and typed Presence algebra.

## Authority rule

Evidence producers observe syntax. They do not select semantic meaning. The canonical
boundary lifts observations into `Presence<SemanticEvidence<T>>`; downstream code receives
the relation result through a semantic fold.

## Construct model

Source constructs are facts. Conditionality, iteration, selection, projection, aggregation,
expansion, absence, fallback, equality, inequality and refinement are represented as semantic
construct vocabulary and resolved by relation/candidate/rewrite machinery.

## Absence rule

Host `undefined` is not used by the new authority boundary. Absence is represented by the
existing `Presence<T>` relation (`absent` / `present`). PHP `null` remains a tagged source
semantic value and is not conflated with absence.

## Evidence status

`astClassifierEvidence.ts` and `queryEvidenceProducer.ts` remain syntax evidence adapters.
They are intentionally not claimed clean: their internal implementation still contains
legacy TypeScript absence/type-assertion machinery. This phase prevents those details from
becoming the canonical semantic authority and establishes the migration seam needed for
full internal elimination.
